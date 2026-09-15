import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { FixtureAdapter } from "../lib/fixture-adapter.mjs";
import { consolidatedMcpCall } from "../lib/mcp-pattern.mjs";
import { cancelWorkflow, loadWorkflow, pollDecision, runWorkflow, stableId } from "../lib/workflow.mjs";

const root = path.resolve(import.meta.dirname, "..");
const names = ["morning-brief", "email-draft", "calendar-plan", "engineering-change", "production-operation"];
for (const name of names) test(`${name} stops before external execution`, async () => {
  const workflow = await loadWorkflow(path.join(root, name, "input.json"));
  const result = await runWorkflow({ adapter: new FixtureAdapter(), workflow, timeoutMs: 20 });
  assert.equal(result.stop, name === "morning-brief" ? "response_received" : "approved_external_execution_required");
});
test("rejection and revision are safe", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  assert.equal((await runWorkflow({ adapter: new FixtureAdapter({ outcome: "reject" }), workflow, timeoutMs: 20 })).stop, "human_rejected");
  assert.equal((await runWorkflow({ adapter: new FixtureAdapter({ outcome: "request_revision" }), workflow, timeoutMs: 20 })).stop, "revision_submitted");
});
test("timeout and stale fingerprint stop", async () => {
  const workflow = await loadWorkflow(path.join(root, "calendar-plan/input.json"));
  assert.equal((await runWorkflow({ adapter: new FixtureAdapter({ noDecision: true }), workflow, timeoutMs: 2 })).stop, "decision_timeout");
  assert.equal((await runWorkflow({ adapter: new FixtureAdapter({ staleFingerprint: true }), workflow, timeoutMs: 20 })).stop, "stale_fingerprint");
});
test("fixture reports failed and unknown fulfillment without claiming proof", async () => {
  const workflow = await loadWorkflow(path.join(root, "production-operation/input.json"));
  for (const status of ["failed", "unknown"]) {
    const result = await runWorkflow({ adapter: new FixtureAdapter({ fulfillment: status }), workflow, timeoutMs: 20, executeFixture: true });
    assert.equal(result.fulfillment.status, status);
    assert.equal(result.fulfillment.evidence.externalSideEffect, false);
  }
});
test("MCP pattern keeps action equivalent and headers consistent", () => {
  const call = consolidatedMcpCall({ action: "decision_wait", params: { handle: "ixn_fixture", waitMs: 1000 }, correlationId: "example:mcp:1" });
  assert.equal(call.headers["MCP-Param-Action"], call.body.params.arguments.action);
  assert.equal(call.body.params.name, "interaction");
});
test("create retries are idempotent and cancellation uses current version", async () => {
  const workflow = await loadWorkflow(path.join(root, "morning-brief/input.json"));
  const adapter = new FixtureAdapter();
  const first = await adapter.create({ ...workflow, idempotencyKey: "same-key" });
  const replay = await adapter.create({ ...workflow, idempotencyKey: "same-key" });
  assert.equal(replay.id, first.id);
  const canceled = await cancelWorkflow(adapter, first, workflow.correlationId);
  assert.equal(canceled.interaction.state, "canceled");
  assert.equal((await cancelWorkflow(adapter, canceled.interaction, workflow.correlationId)).reason, "already_terminal");
});
test("only five maintained fixture directories exist", async () => {
  const entries = await readdir(root, { withFileTypes: true });
  assert.deepEqual(entries.filter((entry) => entry.isDirectory() && names.includes(entry.name)).map((entry) => entry.name).sort(), [...names].sort());
});

test("answers, choices and acknowledgments are input, not executable approval", async () => {
  const original = await loadWorkflow(path.join(root, "morning-brief/input.json"));
  for (const outcome of ["answer", "choose", "acknowledge"]) {
    const workflow = structuredClone(original);
    workflow.content.actions[0].type = outcome;
    const adapter = new FixtureAdapter({ outcome });
    const result = await runWorkflow({ adapter, workflow, timeoutMs: 20, executeFixture: true });
    assert.equal(result.stop, "response_received");
    assert.equal(result.executionAuthorized, false);
    assert.deepEqual(adapter.reports, []);
  }
});

test("a receipt cannot select a different action or Interaction", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  for (const field of ["actionId", "interactionId", "semanticAction"]) {
    class WrongReceipt extends FixtureAdapter {
      async decisionWait(id, input) {
        const result = await super.decisionWait(id, input);
        result.data[field] = "wrong";
        return result;
      }
    }
    const adapter = new WrongReceipt();
    assert.equal((await runWorkflow({ adapter, workflow, timeoutMs: 20, executeFixture: true })).stop, "stale_fingerprint");
    assert.deepEqual(adapter.reports, []);
  }
});

test("a revision changed during a wait invalidates the receipt", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  class RevisionDrift extends FixtureAdapter {
    async decisionWait(id, input) {
      const result = await super.decisionWait(id, input);
      this.interactions.get(id).currentRevisionId = "ixr_new";
      this.interactions.get(id).version++;
      return result;
    }
  }
  assert.equal((await runWorkflow({ adapter: new RevisionDrift(), workflow, timeoutMs: 20 })).stop, "stale_fingerprint");
});

test("policy satisfaction, expiry and unavailable evidence stop before fulfillment", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  for (const approvalState of ["pending", "rejected", "expired", "unsatisfiable", "unavailable"]) {
    const adapter = new FixtureAdapter({ approvalState });
    const result = await runWorkflow({ adapter, workflow, timeoutMs: 5, executeFixture: true });
    assert.equal(result.stop, approvalState === "pending" ? "approval_timeout" : `approval_${approvalState}`);
    assert.deepEqual(adapter.reports, []);
  }
});

test("policy validation cannot replace the original tuple", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  class FingerprintDrift extends FixtureAdapter {
    async decisionWait(id, input) {
      const result = await super.decisionWait(id, input);
      if (input?.approval) result.data.proposalFingerprint = "b".repeat(64);
      return result;
    }
  }
  assert.equal((await runWorkflow({ adapter: new FingerprintDrift(), workflow, timeoutMs: 20 })).stop, "stale_fingerprint");
});

test("execution handoff refetches after policy approval", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  class LastMomentDrift extends FixtureAdapter {
    async decisionWait(id, input) {
      const result = await super.decisionWait(id, input);
      if (input?.approval) this.interactions.get(id).currentRevisionId = "ixr_new";
      return result;
    }
  }
  assert.equal((await runWorkflow({ adapter: new LastMomentDrift(), workflow, timeoutMs: 20 })).stop, "stale_fingerprint");
});

test("expired and purged receipts are not executable", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  for (const fields of [{ expiresAt: "2000-01-01T00:00:00Z" }, { purged: true }]) {
    class UnusableReceipt extends FixtureAdapter {
      async decisionWait(id, input) {
        const result = await super.decisionWait(id, input);
        Object.assign(result.data, fields);
        return result;
      }
    }
    const result = await runWorkflow({ adapter: new UnusableReceipt(), workflow, timeoutMs: 20 });
    assert.equal(result.stop, fields.purged ? "stale_fingerprint" : "approval_expired");
  }
});

test("revision submission uses a fresh ETag after conversational version changes", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  class ConversationDrift extends FixtureAdapter {
    async feedback(id) {
      const feedback = await super.feedback(id);
      this.interactions.get(id).version++;
      return feedback;
    }
  }
  const adapter = new ConversationDrift({ outcome: "request_revision" });
  const result = await runWorkflow({ adapter, workflow, timeoutMs: 20 });
  assert.equal(result.stop, "revision_submitted");
  assert.equal(result.interaction.version, 3);
});

test("retry hints are honored and waits cannot exceed the remaining budget", async () => {
  let clock = 0;
  const calls = [];
  const pauses = [];
  const adapter = { async decisionWait(id, input) {
    calls.push(input.waitMs);
    if (calls.length === 2) return { data: { id: "ixd_result" } };
    clock += 20;
    return { data: null, polling: { retryAfterMs: 80 } };
  } };
  await pollDecision(adapter, { id: "ixn_fixture" }, {
    timeoutMs: 150, intervalMs: 10, now: () => clock,
    pause: async (ms) => { pauses.push(ms); clock += ms; },
  });
  assert.deepEqual(pauses, [80]);
  assert.deepEqual(calls, [10, 10]);
  let requested;
  await pollDecision({ async decisionWait(id, input) { requested = input.waitMs; return { data: { id: "ixd" } }; } },
    { id: "ixn" }, { timeoutMs: 5, intervalMs: 10_000, now: () => 0 });
  assert.equal(requested, 5);
});

test("transport failures are preserved rather than reported as timeouts", async () => {
  const failure = Object.assign(new Error("scope denied"), { code: "insufficient_scope", retryable: false });
  await assert.rejects(pollDecision({ async decisionWait() { throw failure; } }, { id: "ixn" }), (error) => error === failure);
});

test("interruption retains the request without automatic cancellation", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  const controller = new AbortController();
  class Interrupted extends FixtureAdapter {
    async decisionWait() { controller.abort(); throw controller.signal.reason; }
    async cancel() { throw new Error("must not cancel"); }
  }
  const result = await runWorkflow({ adapter: new Interrupted(), workflow, timeoutMs: 20, signal: controller.signal });
  assert.equal(result.stop, "interrupted");
  assert.ok(result.interaction.id);
});

test("changed payloads have distinct operation identities and exact retries replay", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  const adapter = new FixtureAdapter();
  const first = { ...workflow, initialState: "active", idempotencyKey: "same-key" };
  const replay = await adapter.create(first);
  assert.equal((await adapter.create(first)).id, replay.id);
  await assert.rejects(adapter.create({ ...first, content: { ...first.content, title: "Changed" } }), /Idempotency key reused/);
  const changed = structuredClone(workflow);
  changed.content.title = "Changed";
  assert.notEqual((await runWorkflow({ adapter, workflow, timeoutMs: 20 })).interaction.id,
    (await runWorkflow({ adapter, workflow: changed, timeoutMs: 20 })).interaction.id);
  assert.equal(stableId("test", "correlation", { a: 1, b: 2 }), stableId("test", "correlation", { b: 2, a: 1 }));
});

test("Fulfillment records received and started before the final unverified outcome", async () => {
  const workflow = await loadWorkflow(path.join(root, "production-operation/input.json"));
  const adapter = new FixtureAdapter();
  const result = await runWorkflow({ adapter, workflow, timeoutMs: 20, executeFixture: true });
  assert.equal(result.stop, "fixture_fulfillment_reported");
  assert.deepEqual(adapter.reports.map((report) => report.status), ["received", "started", "completed"]);
  assert.ok(adapter.reports.every((report) => report.verified === false));
  assert.equal(result.consequence, workflow.content.actions[0].payload.consequence);
  assert.notEqual(result.decision.proposalFingerprint, result.interaction.revisions[0].proposalFingerprint);
});

test("non-fixture adapters cannot execute or fabricate Fulfillment", async () => {
  const workflow = await loadWorkflow(path.join(root, "email-draft/input.json"));
  const adapter = new FixtureAdapter();
  adapter.isFixture = false;
  assert.equal((await runWorkflow({ adapter, workflow, timeoutMs: 20, executeFixture: true })).stop, "external_execution_unavailable");
  assert.deepEqual(adapter.reports, []);
});
