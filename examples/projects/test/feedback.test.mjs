import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { networkAdapter, feedbackTurn } from '../feedback.mjs';
import { serveFixture, loopFixture } from '../fixture-server.mjs';
import { makeAdapter } from '../adapters.mjs';
const catalog = JSON.parse(readFileSync(new URL('../../../contracts/projects-agent-v1.json', import.meta.url)));
const operations = catalog.operations.filter(item => item.status === 'implemented').map(item => item.operationId);
const discover = async () => ({ operations });
const turn = (kind, fixture) => ({ kind, resourceId: 'returned-session', trackerId: 'returned-tracker', recordId: 'returned-record',
  patch: { values: { done: true }, unset: [] }, key: kind + '-correction', readFeedback: async () => fixture.comments,
  publishCorrection: async feedback => { assert.equal(feedback[0].resolved, false); return fixture.correction; } });
// PROJECTSKILL-001 / INTERACTION-005/008 / WORKSPACE-003. Tests execute
// local wire adapters, not hosted authorization or native client installation.
for (const transport of ['http', 'mcp']) for (const kind of ['pm', 'engineering']) {
  test(transport + ' executes bounded ' + kind + ' feedback with returned identities and honest authority', async () => {
    const fixture = loopFixture({ catalog });
    const server = await serveFixture({ catalog, dispatch: fixture.dispatch });
    try {
      const adapter = networkAdapter({ transport, ...server, catalog, validate: () => [], discover, workspaceId: 'workspace-1' });
      const result = await feedbackTurn(adapter, turn(kind, fixture));
      assert.equal(result.acceptance, 'awaiting_human'); assert.equal(result.verification, 'self_reported');
      assert.equal(result.continuation.seen.length, 1); assert.equal(fixture.comments[0].resolved, false);
      if (kind === 'pm') {
        assert.equal(fixture.edits[0].input.schemaRevisionId, 'returned-schema'); assert.equal(fixture.edits[0].input.patch.values.done, true);
        assert.equal(fixture.requests.length, 0);
      } else {
        const request = fixture.requests[0]; assert.equal(request.etag, '"returned:v2"');
        assert.equal(request.input.target.sessionRevisionId, 'returned-session-revision-2');
        assert.deepEqual(request.input.target.targets, [fixture.correction, fixture.source]);
        assert.equal(request.input.target.targets.some(item => item.revisionId === fixture.oldTarget.revisionId), false);
        assert.equal('decisionIds' in request.input, false);
      }
      const second = await feedbackTurn(adapter, { ...turn(kind, fixture), continuation: result.continuation });
      assert.equal(second.state, 'waiting');
    } finally { await server.close(); }
  });
}
for (const transport of ['cli', 'mcp']) for (const kind of ['pm', 'engineering']) for (const code of ['unauthorized', 'timeout', 'version_conflict', 'validation_failed', 'source_access_revoked', 'git_conflict']) {
  test(transport + ' ' + kind + ' retains continuation on ' + code, async () => {
    const fixture = loopFixture({ catalog, failure: async step => { if (step.operationId.startsWith('patch') || step.operationId.startsWith('revise')) throw Object.assign(new Error(), { code }); } });
    const adapter = makeAdapter({ transport, catalog, validate: () => [], discover, workspaceId: 'workspace-1', invoke: async (_, { step }) => fixture.dispatch(step) });
    await assert.rejects(feedbackTurn(adapter, turn(kind, fixture)), error => error.code === code && error.recovery.refetchRequired && error.recovery.cursor === null && error.recovery.seen.length === 0);
    assert.equal(fixture.requests.length, 0); assert.equal(fixture.comments[0].resolved, false);
  });
}
test('wire credential loss and deployment capability absence stop safely', async () => {
  const fixture = loopFixture({ catalog }); const server = await serveFixture({ catalog, dispatch: fixture.dispatch });
  try {
    for (const transport of ['http', 'mcp']) {
      const adapter = networkAdapter({ ...server, token: 'revoked-fixture', transport, catalog, validate: () => [], discover, workspaceId: 'workspace-1' });
      await assert.rejects(feedbackTurn(adapter, turn('engineering', fixture)), error => error.code === 'unauthorized');
      const old = networkAdapter({ ...server, transport, catalog, validate: () => [], discover: async () => ({ operations: [] }), workspaceId: 'workspace-1' });
      await assert.rejects(feedbackTurn(old, turn('pm', fixture)), error => error.code === 'capability_unsupported');
    }
    assert.equal(server.calls.length, 0);
  } finally { await server.close(); }
});
test('event gap forces current native feedback refetch; reader denial prevents publishing', async () => {
  const fixture = loopFixture({ catalog }); let reads = 0, publishes = 0;
  const adapter = makeAdapter({ transport: 'mcp', catalog, validate: () => [], discover, workspaceId: 'workspace-1',
    invoke: async (_, { step }) => step.operationId === 'listProjectReviewFeedback' ? { data: { gap: true, items: [] } } : fixture.dispatch(step) });
  await assert.rejects(feedbackTurn(adapter, { ...turn('engineering', fixture), readFeedback: async () => { reads++; throw Object.assign(new Error(), { code: 'source_access_revoked' }); }, publishCorrection: async () => { publishes++; } }), error => error.code === 'source_access_revoked');
  assert.equal(reads, 1); assert.equal(publishes, 0);
});
test('non-origin URLs and external HTTP never receive host credential', () => {
  for (const baseUrl of ['http://example.com', 'https://user:password@example.com', 'https://example.com/other']) assert.throws(() => networkAdapter({ transport: 'mcp', baseUrl, token: 'fixture', catalog }));
});
for (const transport of ['cli', 'mcp']) {
  test(transport + ' resumes after a pre-write timeout without losing feedback', async () => {
    let failed = false;
    const fixture = loopFixture({ catalog, failure: async step => {
      if (step.operationId === 'reviseProjectReviewSession' && !failed) { failed = true; throw Object.assign(new Error(), { code: 'timeout' }); }
    } });
    const adapter = makeAdapter({ transport, catalog, validate: () => [], discover, workspaceId: 'workspace-1', invoke: async (_, { step }) => fixture.dispatch(step) });
    let continuation;
    try { await feedbackTurn(adapter, turn('engineering', fixture)); } catch (error) { continuation = error.recovery; }
    assert.equal(continuation.phase, 'revise');
    const result = await feedbackTurn(adapter, { ...turn('engineering', fixture), continuation });
    assert.equal(result.state, 'corrected'); assert.equal(fixture.requests.length, 1);
    assert.equal(result.acceptance, 'awaiting_human');
  });
}
test('expired server cursor performs bounded snapshot resync and exact correction', async () => {
  const fixture = loopFixture({ catalog }); let refetched = false;
  const adapter = makeAdapter({ transport: 'mcp', catalog, validate: () => [], discover, workspaceId: 'workspace-1',
    invoke: async (_, { step }) => {
      if (step.operationId === 'listProjectReviewFeedback') throw Object.assign(new Error(), { code: 'event_cursor_resync_required' });
      return fixture.dispatch(step);
    } });
  const result = await feedbackTurn(adapter, { ...turn('engineering', fixture), continuation: { cursor: 'expired', seen: ['old'], phase: 'feedback' },
    readFeedback: async changes => { refetched = changes.refetch; return fixture.comments; } });
  assert.equal(refetched, true); assert.equal(result.continuation.cursor, null);
  assert.equal(fixture.requests.length, 1);
});
