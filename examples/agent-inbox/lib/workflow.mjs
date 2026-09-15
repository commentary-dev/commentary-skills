import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const terminal = new Set(["completed", "rejected", "canceled", "expired", "failed"]);
const negativeApproval = new Set(["rejected", "expired", "unsatisfiable"]);
const informational = new Set(["answer", "choose", "acknowledge"]);
const fingerprint = /^[a-f0-9]{64}$/u;

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export const stableId = (prefix, correlationId, value) => `${prefix}-${createHash("sha256").update(stableJson([correlationId, value])).digest("hex").slice(0, 20)}`;

export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(signal.reason ?? new Error("Polling canceled.")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
  });
}

export async function loadWorkflow(file) {
  const value = JSON.parse(await readFile(file, "utf8"));
  for (const key of ["name", "correlationId", "resource", "content", "expectedConsequence"]) {
    if (!value[key]) throw new Error(`Workflow field ${key} is required.`);
  }
  return value;
}

export class DecisionTimeout extends Error {
  constructor(id) { super("Decision polling timed out; the Interaction remains durable."); this.name = "DecisionTimeout"; this.interactionId = id; }
}

export async function pollDecision(adapter, interaction, {
  timeoutMs = 60_000, intervalMs = 2_000, signal, approval = false, decisionId,
  now = Date.now, pause = sleep,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error("Polling timeout and interval must be positive finite milliseconds.");
  }
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    signal?.throwIfAborted();
    const remaining = Math.max(1, Math.floor(deadline - now()));
    const requestSignal = AbortSignal.timeout(remaining);
    const combined = signal ? AbortSignal.any([signal, requestSignal]) : requestSignal;
    let result;
    try {
      result = await adapter.decisionWait(interaction.id, {
        waitMs: Math.min(intervalMs, 10_000, remaining), signal: combined, approval, decisionId,
      });
    } catch (error) {
      if (!signal?.aborted && (requestSignal.aborted || now() >= deadline)) throw new DecisionTimeout(interaction.id);
      throw error;
    }
    if (now() > deadline) throw new DecisionTimeout(interaction.id);
    if (approval) {
      const current = result.polling?.approval;
      if (!current || !["pending", "approved", ...negativeApproval].includes(current.state)) {
        return { data: null, polling: { approval: { state: "unavailable" } } };
      }
      if (negativeApproval.has(current.state) || (current.state === "approved" && result.data?.outcome === "approve")) return result;
    } else if (result.data) return result.data;
    const hint = result.retryAfterMs ?? result.polling?.retryAfterMs ?? intervalMs;
    const delay = Number.isFinite(hint) && hint >= 0 ? Math.max(hint, intervalMs) : intervalMs;
    const budget = deadline - now();
    if (budget <= 0) break;
    await pause(Math.min(delay, budget), signal);
  }
  throw new DecisionTimeout(interaction.id);
}

function currentAction(status, decision) {
  if (decision.interactionId !== status.id || decision.revisionId !== status.currentRevisionId
    || !fingerprint.test(decision.proposalFingerprint ?? "") || decision.purged || decision.contentPurgedAt) return null;
  const revision = status.revisions?.find((item) => item.id === status.currentRevisionId);
  if (!revision || !revision.content || revision.contentPurgedAt) return null;
  const action = revision.actions?.find((item) => item.id === decision.actionId);
  if (!action || action.contentPurgedAt || action.semanticAction !== decision.semanticAction) return null;
  return action;
}

function waitStop(error, signal, interaction, stop) {
  if (signal?.aborted) return { stop: "interrupted", interaction };
  if (error instanceof DecisionTimeout) return { stop, interaction, error: error.message };
  throw error;
}

export async function runWorkflow({ adapter, workflow, timeoutMs = 60_000, signal, executeFixture = false }) {
  const createPayload = { resource: workflow.resource, content: workflow.content, initialState: "active" };
  const created = await adapter.create({
    ...createPayload, idempotencyKey: stableId("create", workflow.correlationId, createPayload), correlationId: workflow.correlationId, signal,
  });
  let status = await adapter.status(created.id, { signal });
  if (terminal.has(status.state)) return { stop: "interaction_terminal", interaction: status };
  const deadline = Date.now() + timeoutMs;
  let decision;
  try { decision = await pollDecision(adapter, created, { timeoutMs, signal }); }
  catch (error) { return waitStop(error, signal, created, "decision_timeout"); }
  status = await adapter.status(created.id, { signal });
  if (terminal.has(status.state)) return { stop: "interaction_terminal", interaction: status, decision };
  let action = currentAction(status, decision);
  if (!action) return { stop: "stale_fingerprint", interaction: status, decision };
  if (decision.outcome === "reject") return { stop: "human_rejected", interaction: status, decision };
  if (decision.outcome === "request_revision") {
    const feedback = (await adapter.feedback(created.id, { signal })).filter((item) => item.revisionId === status.currentRevisionId);
    if (!workflow.revision) return { stop: "revision_required", interaction: status, decision, feedback };
    const current = await adapter.status(created.id, { signal });
    if (current.currentRevisionId !== status.currentRevisionId || terminal.has(current.state)) {
      return { stop: "revision_conflict", interaction: current, decision };
    }
    const revisionPayload = { content: workflow.revision, priorRevisionId: current.currentRevisionId, addressedFeedbackIds: feedback.map((item) => item.id) };
    const revised = await adapter.revise(created.id, {
      ...revisionPayload, expectedVersion: current.version, etag: current.etag,
      idempotencyKey: stableId("revise", workflow.correlationId, revisionPayload), signal,
    });
    return { stop: "revision_submitted", interaction: revised, decision, feedback };
  }
  if (informational.has(decision.outcome)) {
    return { stop: "response_received", interaction: status, decision, executionAuthorized: false };
  }
  if (decision.outcome !== "approve" || action.semanticAction !== "approve") {
    return { stop: "decision_not_executable", interaction: status, decision };
  }
  let approved;
  try {
    approved = await pollDecision(adapter, created, {
      timeoutMs: Math.max(1, deadline - Date.now()), signal, approval: true, decisionId: decision.id,
    });
  } catch (error) { return waitStop(error, signal, created, "approval_timeout"); }
  const approvalState = approved.polling.approval.state;
  if (approvalState !== "approved") return { stop: `approval_${approvalState}`, interaction: status, decision };
  const receipt = approved.data;
  if (["id", "revisionId", "actionId", "proposalFingerprint"].some((key) => receipt[key] !== decision[key])) {
    return { stop: "stale_fingerprint", interaction: status, decision: receipt };
  }
  status = await adapter.status(created.id, { signal });
  action = currentAction(status, receipt);
  if (terminal.has(status.state) || !action) return { stop: "stale_fingerprint", interaction: status, decision: receipt };
  if (receipt.expiresAt && (!Number.isFinite(Date.parse(receipt.expiresAt)) || Date.parse(receipt.expiresAt) <= Date.now())) {
    return { stop: "approval_expired", interaction: status, decision: receipt };
  }
  if (!action.payload?.consequence) return { stop: "consequence_unavailable", interaction: status, decision: receipt };
  const approval = { decisionId: receipt.id, revisionId: receipt.revisionId, actionId: receipt.actionId, proposalFingerprint: receipt.proposalFingerprint };
  const packet = { interaction: status, decision: receipt, approval, consequence: action.payload.consequence };
  if (!executeFixture) return { stop: "approved_external_execution_required", ...packet };
  if (adapter.isFixture !== true) return { stop: "external_execution_unavailable", ...packet };
  const report = async (statusName, evidence) => adapter.reportFulfillment(created.id, {
    ...approval, status: statusName, ...(evidence ? { evidence } : {}),
    idempotencyKey: stableId("fulfill", workflow.correlationId, { ...approval, status: statusName, evidence: evidence ?? null }), signal,
  });
  await report("received");
  await report("started");
  const fulfillment = await adapter.executeFixture(workflow, approval);
  await report(fulfillment.status, fulfillment.evidence);
  return { stop: "fixture_fulfillment_reported", ...packet, fulfillment };
}

export async function cancelWorkflow(adapter, interaction, correlationId) {
  const current = await adapter.status(interaction.id);
  if (terminal.has(current.state)) return { canceled: false, reason: "already_terminal", interaction: current };
  return { canceled: true, interaction: await adapter.cancel(interaction.id, {
    expectedVersion: current.version, etag: current.etag, idempotencyKey: stableId("cancel", correlationId, { id: current.id, version: current.version }),
  }) };
}
