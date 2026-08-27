import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const terminal = new Set(["completed", "rejected", "canceled", "expired", "failed"]);
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("Polling canceled.")); }, { once: true });
});
export const stableId = (prefix, correlationId, suffix) => `${prefix}-${createHash("sha256").update(`${correlationId}:${suffix}`).digest("hex").slice(0, 20)}`;

export async function loadWorkflow(file) {
  const value = JSON.parse(await readFile(file, "utf8"));
  for (const key of ["name", "correlationId", "resource", "content", "expectedConsequence"]) {
    if (!value[key]) throw new Error(`Workflow field ${key} is required.`);
  }
  return value;
}

export async function pollDecision(adapter, interaction, { timeoutMs = 5_000, intervalMs = 50, signal } = {}) {
  const deadline = Date.now() + timeoutMs;
  let after;
  while (Date.now() <= deadline) {
    const result = await adapter.decisionWait(interaction.id, { after, waitMs: Math.min(intervalMs, 10_000), signal });
    if (result.data) return result.data;
    after = result.after ?? after;
    await sleep(Math.min(result.retryAfterMs ?? intervalMs, intervalMs), signal);
  }
  throw new Error(`Decision polling timed out after ${timeoutMs}ms; the Interaction remains durable.`);
}

export async function runWorkflow({ adapter, workflow, timeoutMs, signal, executeFixture = false }) {
  const created = await adapter.create({
    resource: workflow.resource, content: workflow.content, initialState: "active",
    idempotencyKey: stableId("create", workflow.correlationId, workflow.name), correlationId: workflow.correlationId,
  });
  const status = await adapter.status(created.id);
  if (terminal.has(status.state)) return { stop: "interaction_terminal", interaction: status };
  let decision;
  try { decision = await pollDecision(adapter, created, { timeoutMs, signal }); }
  catch (error) { return { stop: "decision_timeout", interaction: created, error: error.message }; }
  if (decision.revisionId !== status.currentRevisionId || !/^[a-f0-9]{64}$/u.test(decision.proposalFingerprint)
    || (status.proposalFingerprint && decision.proposalFingerprint !== status.proposalFingerprint)) {
    return { stop: "stale_fingerprint", interaction: status, decision };
  }
  if (decision.outcome === "request_revision" || decision.outcome === "reject") {
    const feedback = await adapter.feedback(created.id);
    if (!workflow.revision || decision.outcome === "reject") return { stop: "human_rejected", interaction: created, decision, feedback };
    const revised = await adapter.revise(created.id, {
      content: workflow.revision, priorRevisionId: status.currentRevisionId,
      addressedFeedbackIds: feedback.map((item) => item.id), expectedVersion: status.version,
      idempotencyKey: stableId("revise", workflow.correlationId, status.currentRevisionId),
    });
    return { stop: "revision_submitted", interaction: revised, decision, feedback };
  }
  if (decision.outcome !== "approve" && decision.outcome !== "acknowledge") {
    return { stop: "decision_not_executable", interaction: created, decision };
  }
  const approval = {
    decisionId: decision.id, revisionId: decision.revisionId, actionId: decision.actionId,
    proposalFingerprint: decision.proposalFingerprint,
  };
  if (!executeFixture) return { stop: "approved_external_execution_required", interaction: created, decision, approval, consequence: workflow.expectedConsequence };
  const fulfillment = await adapter.executeFixture(workflow, approval);
  await adapter.reportFulfillment(created.id, { ...approval, ...fulfillment, idempotencyKey: stableId("fulfill", workflow.correlationId, fulfillment.status) });
  return { stop: "fixture_fulfillment_reported", interaction: created, decision, fulfillment };
}

export async function cancelWorkflow(adapter, interaction, correlationId) {
  const current = await adapter.status(interaction.id);
  if (terminal.has(current.state)) return { canceled: false, reason: "already_terminal", interaction: current };
  return { canceled: true, interaction: await adapter.cancel(interaction.id, { expectedVersion: current.version, idempotencyKey: stableId("cancel", correlationId, current.version) }) };
}
