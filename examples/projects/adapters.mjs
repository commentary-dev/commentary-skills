import { createHash } from 'node:crypto';

const families = { commentary_projects: 'project', commentary_trackers: 'tracker', project_review_session: 'review-session', codebase_review: 'source-snapshot', project_evidence: 'evidence' };
const commands = { records_patch: ['records', 'update'], revise: ['revision'], acceptance_request: ['request-review'] };
const humanOnly = new Set(['archiveProject', 'restoreProject', 'setProjectParticipant', 'removeProjectParticipant', 'migrateTrackerAuthority', 'bindTrackerGitSource', 'setProjectReviewParticipant', 'removeProjectReviewParticipant']);
export class WorkflowError extends Error {
  constructor(code, message, recovery) { super(message); this.code = code; this.recovery = recovery; }
}
function fail(code, message, recovery) { throw new WorkflowError(code, message, recovery); }
export function makeAdapter({ transport, catalog, discover, invoke, validate, workspaceId, signal }) {
  if (!['cli', 'mcp', 'http'].includes(transport) || !workspaceId || typeof validate !== 'function') throw new Error('Explicit transport and granted workspace required.');
  return {
    transport,
    async send(step) {
      signal?.throwIfAborted();
      const draft = structuredClone(step);
      if (/decision|approve/i.test(step.operationId) || humanOnly.has(step.operationId)) fail('human_only', 'Use the eligible human path.', draft);
      const op = catalog.operations.find(o => o.operationId === step.operationId);
      if (!op || op.status !== 'implemented') fail('capability_unsupported', 'No implemented operation; preserve portable input.', draft);
      const capabilities = await discover({ signal });
      if (!capabilities.operations.includes(op.operationId)) fail('capability_unsupported', 'Deployment does not authorize this operation.', draft);
      if (step.input.workspaceId && step.input.workspaceId !== workspaceId) fail('workspace_mismatch', 'Select a matching granted credential.', draft);
      if (step.input.provider === 'azure_devops' && op.scopes.includes('commentary.trackers.writeback')) fail('unsupported_provider_write', 'Azure supports current-authority reads, not writes.', draft);
      const diagnostics = validate(op.inputSchema, step.input);
      if (diagnostics.length) fail('validation_failed', 'Correct diagnostic paths before writing.', { ...draft, diagnostics });
      if (op.ifMatch && !step.etag) fail('precondition_required', 'Refetch the exact ETag.', draft);
      if (op.idempotencyKey && !step.idempotencyKey) fail('idempotency_required', 'Supply an exact-intent retry key.', draft);
      let call;
      if (transport === 'mcp') {
        call = { name: op.family, arguments: { action: op.action, input: step.input, ...(step.etag ? { etag: step.etag } : {}), ...(step.idempotencyKey ? { idempotencyKey: step.idempotencyKey } : {}) } };
      } else if (transport === 'http') {
        const params = [...op.path.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
        const url = op.path.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(step.input[key]));
        const body = Object.fromEntries(Object.entries(step.input).filter(([key]) => !params.includes(key)));
        call = { method: op.method, url, ...(op.method === 'GET' ? { query: body } : { body }), headers: { ...(step.etag ? { 'If-Match': step.etag } : {}), ...(step.idempotencyKey ? { 'Idempotency-Key': step.idempotencyKey } : {}) } };
      } else {
        if (!families[op.family]) fail('filesystem_required', 'Use packageDirectory for CLI publication.', draft);
        const argv = ['--workspace', workspaceId, '--json', families[op.family], ...(commands[op.action] ?? op.action.split('_'))];
        const params = [...op.path.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
        for (const key of params) {
          if (['commentary_projects', 'commentary_trackers'].includes(op.family) && ['projectId', 'trackerId'].includes(key)) argv.push(key === 'projectId' ? '--project' : '--tracker', step.input[key]);
          else argv.push(step.input[key]);
        }
        const input = Object.fromEntries(Object.entries(step.input).filter(([key]) => !params.includes(key)));
        if (op.method !== 'GET' && Object.keys(input).length) argv.push('--stdin');
        if (step.etag) argv.push('--etag', step.etag);
        if (step.idempotencyKey) argv.push('--idempotency-key', step.idempotencyKey);
        if (op.method === 'GET') for (const [key, value] of Object.entries(input)) {
          if (key !== 'workspaceId') argv.push('--' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
        call = { argv, stdin: input };
      }
      try { return await invoke(call, { signal, operation: op, step: draft }); }
      catch (error) { throw new WorkflowError(error.code ?? 'operation_failed', error.message, { draft, refetchRequired: error.code === 'version_conflict' }); }
    },
    async packageDirectory({ directory, mode = 'publish', key, packageId, etag }) {
      if (transport !== 'cli') fail('filesystem_unavailable', 'Use bounded literal uploads.', { directory });
      if (!['publish', 'sync', 'validate'].includes(mode) || !directory || (mode !== 'validate' && !key)) throw new Error('Explicit directory/mode/key required.');
      if (mode === 'sync' && (!packageId || !etag)) fail('precondition_required', 'Read the exact package id and ETag before sync.', { directory, packageId, etag });
      const caps = await discover({ signal });
      const needed = mode === 'sync' ? 'publishPackageRevision' : 'publishReviewPackage';
      if (!caps.operations.includes(needed)) fail('capability_unsupported', 'Package publication unavailable.', { directory, mode });
      return invoke({ argv: ['--workspace', workspaceId, '--json', 'package', mode, directory, '--manifest', directory + '/commentary.package.json', ...(mode === 'validate' ? [] : ['--idempotency-key', key, '--no-open']), ...(mode === 'sync' ? ['--package', packageId, '--etag', etag] : [])] }, { signal, packageDirectory: true });
    },
  };
}

export async function runWorkflow(adapter, name, cases, { directory = './walkthrough' } = {}) {
  const steps = cases.workflows[name];
  if (!steps) throw new Error('Unknown fixture workflow.');
  const receipts = [];
  if (name === 'package' && adapter.transport === 'cli') receipts.push(await adapter.packageDirectory({ directory, key: 'directory-publish-1' }));
  else for (const step of steps) {
    if (step.operationId === 'publishPackageRevision' && adapter.transport === 'cli') receipts.push(await adapter.packageDirectory({ directory, mode: 'sync', key: step.idempotencyKey, packageId: step.input.packageId, etag: step.etag }));
    else receipts.push(await adapter.send(step));
  }
  return { receipts, acceptance: 'awaiting_human', verification: name === 'evidence' ? 'self_reported' : 'not_observed' };
}

export async function resumeChunk(adapter, step, confirmed) {
  const bytes = Buffer.from(step.input.contentBase64, 'base64');
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== step.input.sha256) fail('checksum_mismatch', 'Preserve bytes and correct the manifest.', step);
  const end = step.input.offset + bytes.length;
  if (confirmed.nextOffset === end && confirmed.sha256 === hash) return { skipped: true };
  if (confirmed.nextOffset !== step.input.offset) fail('upload_conflict', 'Refetch exact chunk status; no implicit overwrite.', step);
  return adapter.send(step);
}

export function reconcileEvents(page, seen) {
  if (page.gap || page.expired) return { refetch: true, events: [], cursor: null };
  const events = [];
  for (const event of page.items) if (!seen.has(event.id)) { seen.add(event.id); events.push(event); }
  return { refetch: false, events, cursor: page.nextCursor };
}
