import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeAdapter, runWorkflow, resumeChunk, reconcileEvents } from '../adapters.mjs';
import { readRenderer, editRendererRecord, watchRenderer } from '../renderer.mjs';
const catalog = JSON.parse(readFileSync(new URL('../../../contracts/projects-agent-v1.json', import.meta.url)));
const cases = JSON.parse(readFileSync(new URL('../workflows.json', import.meta.url)));
const operations = catalog.operations.filter(o => o.status === 'implemented').map(o => o.operationId);
function fixture(transport, { invoke, discover, validate } = {}) {
  const calls = [];
  return { calls, adapter: makeAdapter({ transport, catalog, workspaceId: 'workspace-1', discover: discover ?? (async () => ({ operations })), validate: validate ?? (() => []),
    invoke: async (call, context) => { calls.push(call); return invoke ? invoke(call, context) : { data: { id: 'fixture-receipt', provenance: 'reported' }, etag: '"fixture:v2"' }; } }) };
}
// PROJECTSKILL-001, PROJECTAGENT-001, INTERACTION-005/008, WORKSPACE-003.
for (const transport of ['cli', 'mcp', 'http']) for (const name of Object.keys(cases.workflows)) {
  test(transport + ' completes ' + name + ' and retains honest pending acceptance', async () => {
    const { adapter, calls } = fixture(transport);
    const result = await runWorkflow(adapter, name, cases);
    assert.equal(result.acceptance, 'awaiting_human');
    assert.equal(result.verification, name === 'evidence' ? 'self_reported' : 'not_observed');
    assert.equal(calls.length, transport === 'cli' && name === 'package' ? 1 : cases.workflows[name].length);
    if (transport === 'mcp') for (let i = 0; i < calls.length; i++) {
      const step = cases.workflows[name][i];
      const op = catalog.operations.find(o => o.operationId === step.operationId);
      assert.equal(calls[i].name, op.family); assert.equal(calls[i].arguments.action, op.action);
      assert.deepEqual(calls[i].arguments.input, step.input);
      if (op.ifMatch) assert.equal(calls[i].arguments.etag, step.etag);
    }
    if (transport === 'cli' && name === 'package') assert.ok(calls[0].argv.includes('publish'));
    if (transport === 'http' && name === 'tracker-edit') assert.equal(calls[0].headers['If-Match'], cases.workflows[name][0].etag);
  });
}
test('unsupported deployment and revoked discovery stop before mutation', async () => {
  const { adapter, calls } = fixture('mcp', { discover: async () => ({ operations: [] }) });
  await assert.rejects(runWorkflow(adapter, 'pm-tracker', cases), e => e.code === 'capability_unsupported' && e.recovery.input.name === 'Feature readiness');
  assert.equal(calls.length, 0);
});
test('agents refuse Decisions, lifecycle governance and authority migration without dispatch', async () => {
  for (const transport of ['cli', 'mcp', 'http']) {
    const { adapter, calls } = fixture(transport);
    for (const operationId of ['approveProject', 'createDecision', 'archiveProject', 'migrateTrackerAuthority', 'bindTrackerGitSource']) await assert.rejects(adapter.send({ operationId, input: {} }), e => e.code === 'human_only');
    assert.equal(calls.length, 0);
  }
});
test('server schema paths stop create and preserve local data', async () => {
  const input = cases.invalid[0]; const original = structuredClone(input);
  const { adapter, calls } = fixture('mcp', { validate: () => [{ path: '$/contract/fields/0/type', code: 'invalid_type' }] });
  await assert.rejects(adapter.send(input), e => e.code === 'validation_failed' && e.recovery.diagnostics[0].path.endsWith('/type'));
  assert.deepEqual(input, original); assert.equal(calls.length, 0);
});
test('stale ETag preserves original key/input and requires refetch; no retry overwrite', async () => {
  const draft = cases.workflows['tracker-edit'][0];
  const { adapter, calls } = fixture('mcp', { invoke: async () => { throw Object.assign(new Error('Refetch'), { code: 'version_conflict' }); } });
  await assert.rejects(adapter.send(draft), e => e.recovery.refetchRequired && e.recovery.draft.etag === draft.etag && e.recovery.draft.idempotencyKey === draft.idempotencyKey);
  assert.equal(calls.length, 1);
});
test('interrupted upload resends exact missing bytes and skips confirmed chunk only', async () => {
  const chunk = cases.workflows.package.find(s => s.operationId === 'transferPackageChunk');
  const { adapter, calls } = fixture('mcp');
  const end = Buffer.from(chunk.input.contentBase64, 'base64').length;
  assert.deepEqual(await resumeChunk(adapter, chunk, { nextOffset: end, sha256: chunk.input.sha256 }), { skipped: true });
  await resumeChunk(adapter, chunk, { nextOffset: 0 });
  assert.equal(calls.length, 1); assert.equal(calls[0].arguments.idempotencyKey, chunk.idempotencyKey);
  await assert.rejects(resumeChunk(adapter, chunk, { nextOffset: 1 }), e => e.code === 'upload_conflict');
  await assert.rejects(resumeChunk(adapter, { ...chunk, input: { ...chunk.input, sha256: 'f'.repeat(64) } }, { nextOffset: 0 }), e => e.code === 'checksum_mismatch');
});
test('duplicate events are hints; a gap requires authorized refetch', () => {
  const seen = new Set(); const page = { items: [{ id: 'event-1' }, { id: 'event-1' }], nextCursor: 'cursor-1' };
  assert.equal(reconcileEvents(page, seen).events.length, 1);
  assert.equal(reconcileEvents(page, seen).events.length, 0);
  assert.deepEqual(reconcileEvents({ ...page, gap: true }, seen), { refetch: true, events: [], cursor: null });
});
test('abort and missing conditional version stop before writes', async () => {
  const { adapter, calls } = fixture('mcp');
  await assert.rejects(adapter.send({ ...cases.workflows['tracker-edit'][0], etag: undefined }), e => e.code === 'precondition_required');
  assert.equal(calls.length, 0);
  const c = new AbortController(); c.abort();
  const aborted = makeAdapter({ transport: 'mcp', catalog, workspaceId: 'workspace-1', signal: c.signal, validate: () => [], discover: async () => { throw Error('must not discover'); } });
  await assert.rejects(aborted.send(cases.workflows['pm-tracker'][0]), e => e.name === 'AbortError');
});
test('denied source credentials and timeouts preserve the draft and never infer success', async () => {
  for (const code of ['source_access_revoked', 'unauthorized', 'timeout']) {
    const { adapter, calls } = fixture('mcp', { invoke: async () => { throw Object.assign(new Error(code), { code }); } });
    await assert.rejects(runWorkflow(adapter, 'evidence', cases), e => e.code === code && e.recovery.draft.operationId === 'publishSourceSnapshot');
    assert.equal(calls.length, 1);
  }
});
test('renderer negotiates exact capabilities, bounded query and destroys controller', async () => {
  const calls = [];
  const client = { ready: Promise.resolve({ protocol: 'commentary-tracker-v1', operations: ['getSchema', 'getPermissions', 'queryRecords'] }), getPermissions: async () => ({ data: {} }), getSchema: async () => ({ data: {} }), queryRecords: async input => { calls.push(input); return { data: { items: [] } }; }, destroy: () => calls.push('destroy') };
  assert.equal((await readRenderer(client)).fallback, false);
  assert.deepEqual(calls, [{ query: { limit: 25, archived: false } }, 'destroy']);
  calls.length = 0; client.ready = Promise.resolve({ protocol: 'unsupported', operations: [] });
  assert.equal((await readRenderer(client)).fallback, true); assert.deepEqual(calls, ['destroy']);
});

test('CLI sync carries explicit package identity and conditional version', async () => {
  const { adapter, calls } = fixture('cli');
  await runWorkflow(adapter, 'feedback', cases);
  assert.ok(calls[0].argv.includes('--package'));
  assert.equal(calls[0].argv[calls[0].argv.indexOf('--package') + 1], 'package-1');
  assert.equal(calls[0].argv[calls[0].argv.indexOf('--etag') + 1], cases.workflows.feedback[0].etag);
});
test('renderer conditional edit retains diagnostics and event gaps refetch', async () => {
  const calls = [];
  const client = { ready: Promise.resolve({ protocol: 'commentary-tracker-v1', operations: ['getRecord', 'patchRecord'] }),
    getRecord: async () => ({ data: { schemaRevisionId: 'schema-2' }, etag: '"record:v3"' }),
    patchRecord: async (input, options) => { calls.push({ input, options }); throw Object.assign(new Error('invalid field'), { code: 'validation_failed', details: [{ field: '$/title' }] }); },
    watchChanges: ({ onChange }) => { void onChange({ gap: true, reconciliationRequired: true }); return () => calls.push('stop'); } };
  const result = await editRendererRecord(client, { recordId: 'record-1', values: { title: '' }, key: 'patch-1' });
  assert.equal(result.code, 'validation_failed'); assert.deepEqual(result.diagnostics, [{ field: '$/title' }]);
  assert.equal(calls[0].options.etag, '"record:v3"'); assert.equal(calls[0].options.idempotencyKey, 'patch-1');
  const c = new AbortController(); let refetch = 0;
  const stop = watchRenderer(client, { signal: c.signal, reload: async () => { refetch++; }, onError: () => {} });
  await new Promise(resolve => setTimeout(resolve, 0)); stop();
  assert.equal(refetch, 1); assert.equal(calls.at(-1), 'stop');
});
