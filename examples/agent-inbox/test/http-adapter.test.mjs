import assert from "node:assert/strict";
import test from "node:test";
import { HttpAdapter, HttpError } from "../lib/http-adapter.mjs";
import { pollDecision, runWorkflow } from "../lib/workflow.mjs";

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", ...headers },
});
const specification = (parameters) => ({ paths: {
  "/api/v1/interactions/{interactionId}/decisions": { get: { parameters } },
} });
const adapterFor = (fetchImpl) => new HttpAdapter({ baseUrl: "https://commentary.example", token: "fixture-credential", fetchImpl });

test("HTTP polling uses the nested server hints and preserves zero hints", async () => {
  const adapter = adapterFor(async () => json({ data: null, polling: { retryAfterMs: 1234 } }, 202));
  assert.equal((await adapter.decisionWait("ixn_123", { waitMs: 10 })).retryAfterMs, 1234);
  const zero = adapterFor(async () => json({ data: null, polling: { retryAfterMs: 0 } }));
  assert.equal((await zero.decisionWait("ixn_123", { waitMs: 0 })).retryAfterMs, 0);
});

test("HTTP errors preserve retryability, correlation and retry headers without exposing a payload", async () => {
  const adapter = adapterFor(async () => json({ error: { code: "rate_limited", message: "Try again", retryable: true, correlationId: "run-123" } }, 429, { "retry-after": "3" }));
  await assert.rejects(adapter.status("ixn_123"), (error) => error instanceof HttpError
    && error.status === 429 && error.code === "rate_limited" && error.retryable === true
    && error.correlationId === "run-123" && error.retryAfterMs === 3000 && !error.payload);
});

test("an old deployment cannot be treated as policy-approved", async () => {
  const calls = [];
  const adapter = adapterFor(async (url) => { calls.push(url); return json(specification([])); });
  const result = await pollDecision(adapter, { id: "ixn_123" }, { approval: true, timeoutMs: 10 });
  assert.equal(result.polling.approval.state, "unavailable");
  assert.deepEqual(calls, ["https://commentary.example/openapi.json"]);
});

test("approval waits pass the exact requested receipt and current-policy query", async () => {
  let query;
  const adapter = adapterFor(async (url) => {
    if (url.endsWith("/openapi.json")) return json(specification([{ in: "query", name: "approval" }]));
    query = new URL(url).searchParams;
    return json({ data: null, polling: { approval: { state: "pending" }, retryAfterMs: 2000 } }, 202);
  });
  await adapter.decisionWait("ixn_123", { waitMs: 10, approval: true, decisionId: "ixd_123" });
  assert.equal(query.get("approval"), "true");
  assert.equal(query.get("decisionId"), "ixd_123");
  assert.equal(query.get("waitMs"), "10");
});

test("mutations reuse the exact returned ETag and exclude adapter-only fields", async () => {
  let sent;
  const adapter = adapterFor(async (url, init) => {
    if (init.method === "GET") return json({ data: { id: "ixn_123", version: 7 } }, 200, { etag: '"ixn_123:v7"' });
    sent = init;
    return json({ data: { id: "ixn_123", version: 8 } });
  });
  const current = await adapter.status("ixn_123");
  await adapter.revise("ixn_123", { content: { title: "Revised" }, priorRevisionId: "ixr_123", addressedFeedbackIds: ["ixm_123"], expectedVersion: 7, etag: current.etag, idempotencyKey: "revise-123" });
  assert.equal(sent.headers["If-Match"], '"ixn_123:v7"');
  assert.deepEqual(JSON.parse(sent.body), { content: { title: "Revised" }, priorRevisionId: "ixr_123", addressedFeedbackIds: ["ixm_123"] });
});

test("missing routes and malformed successes fail loudly", async () => {
  const missing = adapterFor(async () => new Response("<html>Not found</html>", { status: 404 }));
  await assert.rejects(missing.status("ixn"), (error) => error.code === "invalid_response" && error.status === 404);
  const malformed = adapterFor(async () => json({ ok: true }));
  await assert.rejects(malformed.create({ resource: {}, content: {}, idempotencyKey: "key", correlationId: "run" }), /missing.*handle/);
});

test("full HTTP flow handles server-shaped action context and creates no external side effect", async () => {
  const fp = "a".repeat(64);
  const receipt = { id: "ixd_123", interactionId: "ixn_123", revisionId: "ixr_123", actionId: "ixa_123", semanticAction: "approve", outcome: "approve", proposalFingerprint: fp, expiresAt: null, purged: false };
  const interaction = { id: "ixn_123", currentRevisionId: "ixr_123", version: 2, state: "active", revisions: [{
    id: "ixr_123", proposalFingerprint: "b".repeat(64), content: { title: "Review this exact draft" },
    actions: [{ id: "ixa_123", semanticAction: "approve", payload: { consequence: "Send this exact draft through a separate connector." } }],
  }] };
  const requests = [];
  const adapter = adapterFor(async (url, init) => {
    requests.push({ url, method: init.method });
    if (url.endsWith("/openapi.json")) return json(specification([{ in: "query", name: "approval" }]));
    if (init.method === "POST") {
      assert.ok(!Object.hasOwn(JSON.parse(init.body), "signal"));
      return json({ data: { id: interaction.id } }, 201);
    }
    if (url.includes("/decisions?")) return json({ data: receipt, polling: {
      approval: { state: "approved", approvals: 1, required: 1 }, retryAfterMs: null,
    } });
    return json({ data: interaction }, 200, { etag: '"ixn_123:v2"' });
  });
  const result = await runWorkflow({ adapter, workflow: {
    name: "email", correlationId: "email-123", resource: { type: "draft_review", id: "draft_123" },
    content: { title: "Review this exact draft" }, expectedConsequence: "Unbound description must not replace approved consequence.",
  }, timeoutMs: 100, executeFixture: true });
  assert.equal(result.stop, "external_execution_unavailable");
  assert.equal(result.approval.proposalFingerprint, fp);
  assert.equal(result.consequence, interaction.revisions[0].actions[0].payload.consequence);
  assert.equal(requests.filter((request) => request.method === "POST").length, 1);
});
