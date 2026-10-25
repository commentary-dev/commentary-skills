import { createServer } from 'node:http';
import { once } from 'node:events';

// Only a deterministic local request fixture, never a product authorizer or DB.
export async function serveFixture({ catalog, dispatch, token = 'fixture-host-credential' }) {
  const calls = [];
  const server = createServer(async (request, response) => {
    try {
      if (request.headers.authorization !== 'Bearer ' + token) throw Object.assign(new Error(), { code: 'unauthorized', status: 401 });
      const url = new URL(request.url, 'http://127.0.0.1');
      let text = '';
      for await (const chunk of request) { text += chunk; if (text.length > 1024 * 1024) throw new Error('Fixture body limit'); }
      const body = text ? JSON.parse(text) : {};
      const mcp = url.pathname === '/mcp';
      let operation, input, etag, idempotencyKey;
      if (mcp) {
        operation = catalog.operations.find(item => item.family === body.params.name && item.action === body.params.arguments.action);
        ({ input, etag, idempotencyKey } = body.params.arguments);
      } else {
        for (const candidate of catalog.operations) {
          if (candidate.method !== request.method) continue;
          const params = [...candidate.path.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
          const match = url.pathname.match(new RegExp('^' + candidate.path.replace(/\{\w+\}/g, '([^/]+)') + '$'));
          if (!match) continue;
          operation = candidate;
          const query = Object.fromEntries([...url.searchParams].map(([key, value]) => [key, ['limit', 'waitMs'].includes(key) ? Number(value) : value]));
          input = { ...body, ...query, ...Object.fromEntries(params.map((key, i) => [key, decodeURIComponent(match[i + 1])])) }; break;
        }
        etag = request.headers['if-match']; idempotencyKey = request.headers['idempotency-key'];
      }
      if (!operation) throw Object.assign(new Error(), { code: 'capability_unsupported', status: 404 });
      const step = { operationId: operation.operationId, input, etag, idempotencyKey };
      calls.push(step);
      const result = await dispatch(step);
      response.writeHead(200, { 'content-type': 'application/json', ...(result.etag ? { etag: result.etag } : {}) });
      response.end(JSON.stringify(mcp ? { jsonrpc: '2.0', id: body.id, result: { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] } } : result));
    } catch (error) {
      response.writeHead(error.status ?? 400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { code: error.code ?? 'fixture_error', message: 'Fixture operation failed.' } }));
    }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { baseUrl: 'http://127.0.0.1:' + server.address().port, token, calls, close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}

export function loopFixture({ validate = () => [], catalog, failure } = {}) {
  let version = 1;
  const oldTarget = { resource: { type: 'review_package', id: 'returned-package' }, revisionId: 'returned-revision-1', sha256: 'a'.repeat(64) };
  const source = { resource: { type: 'source_snapshot', id: 'returned-source' }, revisionId: 'returned-source-revision', sha256: 'b'.repeat(64) };
  let targets = [oldTarget, source];
  const requests = [], edits = [], comments = [{ id: 'native-thread-1', author: 'reviewer-1', bodyMarkdown: 'Explain rollback and unknown dates.', resolved: false }];
  const etag = () => '"returned:v' + version + '"';
  return { comments, requests, edits, source, oldTarget,
    correction: { ...oldTarget, revisionId: 'returned-revision-2', sha256: 'c'.repeat(64) },
    async dispatch(step) {
      const op = catalog.operations.find(item => item.operationId === step.operationId);
      if (validate(op.inputSchema, step.input).length) throw Object.assign(new Error(), { code: 'validation_failed' });
      if (failure) await failure(step);
      if (op.ifMatch && step.etag !== etag()) throw Object.assign(new Error(), { code: 'version_conflict', status: 412 });
      if (op.idempotencyKey && !step.idempotencyKey) throw Object.assign(new Error(), { code: 'idempotency_required' });
      if (step.operationId === 'listTrackerFeedback' || step.operationId === 'listProjectReviewFeedback') return { data: { items: [{ id: 'event-1' }, { id: 'event-1' }], nextCursor: 'returned-cursor', hasMore: false, outcome: 'events' } };
      if (step.operationId === 'getTrackerRecord') return { data: { id: 'returned-record', schemaRevisionId: 'returned-schema', values: { title: 'Missing dates stay unscheduled', done: false } }, etag: etag() };
      if (step.operationId === 'patchTrackerRecord') { edits.push(step); version++; return { data: { id: 'returned-record', ...step.input.patch.values }, etag: etag() }; }
      if (step.operationId === 'getProjectReviewSession') return { data: { id: 'returned-session', manifest: { manifestVersion: 1, sessionId: 'returned-session', revisionId: 'returned-session-revision-' + version, targets }, manifestSha256: String(version).repeat(64), revisionSetFingerprint: 'd'.repeat(64) }, etag: etag() };
      if (step.operationId === 'reviseProjectReviewSession') { targets = step.input.targets; version++; return { data: { id: 'returned-session' }, etag: etag() }; }
      if (step.operationId === 'requestProjectAcceptance') { requests.push(step); return { data: { interactionId: 'returned-request', actionId: 'returned-action' }, etag: etag() }; }
      throw new Error('Unsupported fixture operation ' + step.operationId);
    }
  };
}
