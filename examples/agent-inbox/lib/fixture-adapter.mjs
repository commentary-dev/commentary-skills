import { createHash } from "node:crypto";
import { stableId } from "./workflow.mjs";

export class FixtureAdapter {
  constructor({ outcome = "approve", fulfillment = "completed", staleFingerprint = false, noDecision = false } = {}) {
    this.options = { outcome, fulfillment, staleFingerprint, noDecision };
    this.interactions = new Map();
  }
  async create(input) {
    const id = stableId("ixn", input.correlationId, input.idempotencyKey);
    if (this.interactions.has(id)) return this.interactions.get(id);
    const currentRevisionId = stableId("ixr", input.correlationId, "revision-1");
    const actionId = stableId("ixa", input.correlationId, "action-1");
    const proposalFingerprint = createHash("sha256").update(JSON.stringify({ id, currentRevisionId, actionId, content: input.content })).digest("hex");
    const interaction = { id, version: 1, state: "waiting_for_human", currentRevisionId, actionId, proposalFingerprint };
    this.interactions.set(id, interaction);
    return interaction;
  }
  async status(id) { return structuredClone(this.#get(id)); }
  async decisionWait(id) {
    const item = this.#get(id);
    if (this.options.noDecision) return { data: null, retryAfterMs: 1 };
    return { data: { id: stableId("ixd", id, "decision"), revisionId: this.options.staleFingerprint ? stableId("ixr", id, "stale") : item.currentRevisionId, actionId: item.actionId, proposalFingerprint: item.proposalFingerprint, outcome: this.options.outcome } };
  }
  async feedback(id) { return [{ id: stableId("ixf", id, "feedback"), type: "request_revision", body: "Clarify the rollback and retry boundary." }]; }
  async revise(id) { const item = this.#get(id); Object.assign(item, { version: item.version + 1, state: "waiting_for_human", currentRevisionId: stableId("ixr", id, `revision-${item.version + 1}`) }); return structuredClone(item); }
  async cancel(id) { const item = this.#get(id); Object.assign(item, { version: item.version + 1, state: "canceled" }); return structuredClone(item); }
  async executeFixture(workflow) { return { status: this.options.fulfillment, evidence: { adapter: "deterministic_fixture", operation: workflow.name, externalSideEffect: false } }; }
  async reportFulfillment(id, report) { const item = this.#get(id); item.fulfillment = { ...report, selfReported: true, verified: false }; return item.fulfillment; }
  #get(id) { const item = this.interactions.get(id); if (!item) throw new Error("Fixture Interaction not found."); return item; }
}
