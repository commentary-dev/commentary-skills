import { WorkflowError, makeAdapter, reconcileEvents } from './adapters.mjs';

// Host-side transports. Credentials never enter renderer calls or artifacts.
export function networkAdapter({ transport, baseUrl, token, catalog, validate, discover, workspaceId, fetchImpl = fetch, runCli, signal }) {
  if (!token || !baseUrl || !['http', 'mcp', 'cli'].includes(transport)) throw new Error('Explicit host transport/authentication required.');
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(base.hostname))) throw new Error('HTTPS or local fixture origin required.');
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Use a credential-free server origin.');
  let rpcId = 0;
  return makeAdapter({ transport, catalog, validate, discover, workspaceId, signal,
    invoke: async (call, context) => {
      if (transport === 'cli') {
        if (!runCli) throw new Error('Installed CLI runner required.');
        // Pass credential via environment in the runner, not argv/logs.
        return runCli({ ...call, argv: ['--base-url', base.origin, ...call.argv] }, { ...context, token });
      }
      const url = transport === 'mcp' ? new URL('/mcp', base) : new URL(call.url, base);
      if (call.query) for (const [key, value] of Object.entries(call.query)) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      const body = transport === 'mcp' ? { jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: call } : call.body;
      const response = await fetchImpl(url, { signal, redirect: 'error', method: transport === 'mcp' ? 'POST' : call.method,
        headers: { authorization: 'Bearer ' + token, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}), ...call.headers },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new WorkflowError(payload.error?.data?.code ?? payload.error?.code ?? 'request_failed', 'Host operation failed.');
      if (transport === 'mcp') {
        const result = payload.result;
        const output = result?.structuredContent ?? JSON.parse(result?.content?.find(item => item.type === 'text')?.text ?? '{}');
        if (result?.isError || output.error) throw new WorkflowError(output.error?.code ?? 'operation_failed', 'MCP operation failed.');
        return output;
      }
      return { ...payload, etag: response.headers.get('etag') ?? payload.etag };
    } });
}

// One bounded turn. Caller retains continuation privately, rediscovering access
// next invocation. No background process or unbounded wait is implied.
export async function feedbackTurn(adapter, { kind, resourceId, trackerId, recordId, patch, readFeedback, publishCorrection, continuation, key }) {
  if (!['pm', 'engineering'].includes(kind) || !key || typeof readFeedback !== 'function') throw new Error('Explicit kind, intent key and authorized native feedback reader required.');
  const saved = structuredClone(continuation ?? { cursor: null, seen: [], phase: 'feedback' });
  const send = (operationId, input, options = {}) => adapter.send({ operationId, input, ...options });
  try {
    const op = kind === 'pm' ? 'listTrackerFeedback' : 'listProjectReviewFeedback';
    const identity = kind === 'pm' ? { trackerId } : { sessionId: resourceId };
    let page;
    try { page = await send(op, { ...identity, limit: 25, ...(saved.cursor ? { cursor: saved.cursor } : {}) }); }
    catch (error) {
      if (error.code !== 'event_cursor_resync_required') throw error;
      page = { data: { gap: true, items: [] } };
      saved.cursor = null; saved.seen = [];
    }
    const seen = new Set(saved.seen);
    const changes = reconcileEvents(page.data, seen);
    saved.seen = [...seen]; saved.cursor = changes.cursor;
    if (!changes.events.length && !changes.refetch) return { state: 'waiting', continuation: saved, acceptance: 'awaiting_human' };
    // Notifications carry minimal hints. Fetch native threads with current
    // authorization before proposing a correction; do not infer their bodies.
    const feedback = await readFeedback(changes);
    if (!feedback.length) return { state: 'waiting', continuation: saved, acceptance: 'awaiting_human' };
    if (kind === 'pm') {
      const current = await send('getTrackerRecord', { trackerId, recordId });
      saved.phase = 'patch';
      await send('patchTrackerRecord', { trackerId, recordId, schemaRevisionId: current.data.schemaRevisionId, patch }, { etag: current.etag, idempotencyKey: key });
    } else {
      const current = await send('getProjectReviewSession', identity);
      saved.phase = 'publish';
      const target = await publishCorrection(feedback);
      const targets = current.data.manifest.targets.map(item => item.resource.type === target.resource.type && item.resource.id === target.resource.id ? target : item);
      if (!targets.some(item => item === target)) throw new WorkflowError('target_unavailable', 'Correction must address an existing exact target.');
      saved.phase = 'revise';
      await send('reviseProjectReviewSession', { ...identity, targets }, { etag: current.etag, idempotencyKey: key + '-revise' });
      const refreshed = await send('getProjectReviewSession', identity);
      const session = refreshed.data;
      const acceptanceTarget = { version: 1, sessionId: resourceId, sessionRevisionId: session.manifest.revisionId,
        revisionSetFingerprint: session.revisionSetFingerprint, manifestSha256: session.manifestSha256, scope: 'session', targets: session.manifest.targets, supportingRevisions: [] };
      saved.phase = 'request';
      await send('requestProjectAcceptance', { ...identity, target: acceptanceTarget, consequence: 'Accept this exact corrected walkthrough; no deployment or Git action is authorized.' }, { etag: refreshed.etag, idempotencyKey: key + '-request' });
    }
    return { state: 'corrected', continuation: saved, acceptance: 'awaiting_human', verification: 'self_reported' };
  } catch (error) {
    // Failed turns retain the original cursor so feedback is revisited. A
    // publisher must recover its durable idempotency receipt after timeout.
    throw new WorkflowError(error.code ?? 'operation_failed', 'Feedback turn stopped; retain draft and reconcile current state before continuation.', { ...saved, cursor: saved.cursor === null ? null : continuation?.cursor ?? null, seen: continuation?.seen ?? [], refetchRequired: true });
  }
}
