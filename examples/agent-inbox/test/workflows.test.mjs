import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { FixtureAdapter } from "../lib/fixture-adapter.mjs";
import { consolidatedMcpCall } from "../lib/mcp-pattern.mjs";
import { cancelWorkflow, loadWorkflow, runWorkflow } from "../lib/workflow.mjs";

const root = path.resolve(import.meta.dirname, "..");
const names = ["morning-brief", "email-draft", "calendar-plan", "engineering-change", "production-operation"];
for (const name of names) test(`${name} stops before external execution`, async () => {
  const workflow = await loadWorkflow(path.join(root, name, "input.json"));
  const result = await runWorkflow({ adapter: new FixtureAdapter(), workflow, timeoutMs: 20 });
  assert.equal(result.stop, "approved_external_execution_required");
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
