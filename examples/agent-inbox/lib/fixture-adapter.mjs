import { createHash } from "node:crypto";
import { stableId } from "./workflow.mjs";

const nextReport = {
  received: ["started", "completed", "failed", "unknown"],
  started: ["completed", "failed", "unknown"],
  completed: ["failed", "unknown"],
  failed: ["received", "started", "completed", "unknown"],
  unknown: ["received", "started", "completed", "failed"],
};

/** Deterministic in-memory transport fixture, not server policy implementation. */
export class FixtureAdapter {
  isFixture = true;
  constructor({ outcome, fulfillment = "completed", staleFingerprint = false, noDecision = false, approvalState = "approved" } = {}) {
    this.options = { outcome, fulfillment, staleFingerprint, noDecision, approvalState };
    this.interactions = new Map();
    this.retries = new Map();
    this.reports = [];
  }
  async create(input) {
    const key = `create:${input.idempotencyKey}`;
    const payload = { resource: input.resource, content: input.content, initialState: input.initialState };
    return this.#retry(key, payload, () => {
      const id = stableId("ixn", input.correlationId, input.idempotencyKey);
      const item = { id, version: 1, state: "waiting_for_human", currentRevisionId: stableId("ixr", id, "revision-1"), revisions: [], messages: [] };
      item.revisions.push(this.#revision(item, input.content));
      this.interactions.set(id, item);
      return structuredClone(item);
    });
  }
  async status(id) { const item = this.#get(id); return structuredClone({ ...item, etag: `"${id}:v${item.version}"` }); }
  async decisionWait(id, { approval = false, decisionId } = {}) {
    const item = this.#get(id);
    if (this.options.noDecision) return { data: null, polling: { retryAfterMs: 1 } };
    const revision = item.revisions.find((entry) => entry.id === item.currentRevisionId);
    const action = revision.actions[0];
    if (!action) return { data: null, polling: { retryAfterMs: 1 } };
    const receipt = {
      id: stableId("ixd", item.currentRevisionId, action.id), interactionId: id,
      revisionId: this.options.staleFingerprint ? "ixr_stale" : item.currentRevisionId,
      actionId: action.id, semanticAction: action.semanticAction,
      proposalFingerprint: this.#actionFingerprint(item, action),
      outcome: this.options.outcome ?? action.semanticAction, expiresAt: null, terminalState: "recorded", purged: false,
    };
    if (!approval) return { data: receipt };
    const state = this.options.approvalState;
    return {
      data: state === "approved" && receipt.outcome === "approve" && (!decisionId || decisionId === receipt.id) ? receipt : null,
      polling: { retryAfterMs: 1, approval: { state, approvals: state === "approved" ? 1 : 0, required: 1, completedSteps: 0, totalSteps: 1 } },
    };
  }
  async feedback(id) {
    const item = this.#get(id);
    return [{ id: stableId("ixm", id, "feedback"), revisionId: item.currentRevisionId, feedbackType: "request_revision", body: "Clarify rollback and retry boundaries." }];
  }
  async revise(id, input) {
    const item = this.#get(id);
    const { expectedVersion, etag, idempotencyKey, signal, ...payload } = input;
    return this.#retry(`revise:${id}:${idempotencyKey}`, payload, () => {
      this.#version(item, expectedVersion);
      if (payload.priorRevisionId !== item.currentRevisionId) throw new Error("Prior revision is stale.");
      item.version++;
      item.currentRevisionId = stableId("ixr", id, `revision-${item.version}`);
      item.revisions.push(this.#revision(item, payload.content));
      item.state = "waiting_for_human";
      return structuredClone(item);
    });
  }
  async cancel(id, input) {
    const item = this.#get(id);
    return this.#retry(`cancel:${id}:${input.idempotencyKey}`, { expectedVersion: input.expectedVersion }, () => {
      this.#version(item, input.expectedVersion);
      if (["completed", "rejected", "canceled", "expired", "failed"].includes(item.state)) throw new Error("Terminal Interaction cannot be canceled.");
      item.version++;
      item.state = "canceled";
      return structuredClone(item);
    });
  }
  async executeFixture(workflow) {
    return { status: this.options.fulfillment, evidence: { adapter: "deterministic_fixture", operation: workflow.name, externalSideEffect: false } };
  }
  async reportFulfillment(id, report) {
    const item = this.#get(id);
    const { idempotencyKey, signal, ...payload } = report;
    return this.#retry(`fulfill:${id}:${idempotencyKey}`, payload, () => {
      const action = item.revisions.find((revision) => revision.id === item.currentRevisionId).actions.find((entry) => entry.id === report.actionId);
      if (!action || report.revisionId !== item.currentRevisionId || report.proposalFingerprint !== this.#actionFingerprint(item, action)
        || this.options.approvalState !== "approved" || (this.options.outcome ?? action.semanticAction) !== "approve") throw new Error("Fulfillment requires exact approved action.");
      if (!item.fulfillment && report.status !== "received") throw new Error("First Fulfillment report must be received.");
      if (item.fulfillment && !nextReport[item.fulfillment.status].includes(report.status)) throw new Error("Invalid Fulfillment transition.");
      item.fulfillment = { ...payload, selfReported: true, verified: false };
      this.reports.push(structuredClone(item.fulfillment));
      item.version++;
      return structuredClone(item.fulfillment);
    });
  }
  #revision(item, content) {
    return {
      id: item.currentRevisionId, content: structuredClone(content),
      // Revision hashes deliberately differ from exact action fingerprints.
      proposalFingerprint: createHash("sha256").update(stableId("revision-content", item.id, content)).digest("hex"),
      actions: (content.actions ?? []).map((action, index) => ({
        id: stableId("ixa", item.currentRevisionId, index), semanticAction: action.type,
        label: action.label, payload: structuredClone(action.payload ?? {}),
      })),
    };
  }
  #actionFingerprint(item, action) {
    const seed = stableId("action", item.currentRevisionId, action);
    return createHash("sha256").update(seed).digest("hex");
  }
  #retry(key, payload, execute) {
    const hash = stableId("payload", key, payload);
    if (this.retries.has(key)) {
      const prior = this.retries.get(key);
      if (prior.hash !== hash) throw new Error("Idempotency key reused with changed request.");
      return structuredClone(prior.value);
    }
    const value = execute();
    this.retries.set(key, { hash, value: structuredClone(value) });
    return value;
  }
  #version(item, expected) { if (expected !== item.version) throw new Error("Fixture precondition failed."); }
  #get(id) { const item = this.interactions.get(id); if (!item) throw new Error("Fixture Interaction not found."); return item; }
}
