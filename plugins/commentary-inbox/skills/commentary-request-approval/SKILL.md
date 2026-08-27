---
name: commentary-request-approval
description: Request an authorized human Decision in Commentary Inbox for a precisely described proposal and consequence. Use when execution must be gated by durable approval; do not use for opinions, self-approval, or vague permission unbound to an immutable revision.
---

# Commentary Request Approval

Approval records human intent for one exact proposal. It does not execute, schedule, or verify an action.

## Safe workflow

1. Discover MCP `interaction` or `/api/v1/interactions`. Use configured least-privilege create/read/update/cancel access on the Resource; never solicit or bundle credentials. Confirm the server-authorized reviewer and external executor. An agent cannot write a Decision, approve itself, invent an approver, or expand authority.
2. State action, target, scope, side effects, rollback limits, and exact consequence in an immutable proposal. Production, financial, security, deletion, publication, and broad communication requests require explicit consequences and a stop before execution.
3. Create with stable correlation/idempotency keys via MCP `action: "create"` or HTTP `POST /api/v1/interactions` with `Idempotency-Key` and `X-Correlation-Id`.
4. Poll MCP `status`, bounded `decision_wait`, and `decision_get` fallback, or HTTP status and `/decisions?after=...&waitMs=...`. Cap each wait at 10 seconds, honor retry hints, and return the durable handle on timeout.
5. Decision actions are read-only for agents. Rejection stops; feedback or `request_revision` goes through `commentary-submit-revision`. Before separately authorized execution, refetch status and require Decision `revisionId`, `actionId`, and 64-character `proposalFingerprint` to match the current proposal. Changed revision, stale version, terminal state, missing field, or mismatch stops and requires a new Decision. Never silently retarget approval.
6. Pass only the Decision tuple and exact consequence to a separately configured executor. Commentary approval does not configure a connector. After execution, MCP `fulfillment_report`/`fulfillment_get` or `POST /api/v1/interactions/{id}/fulfillment` may report `received`, `started`, `completed`, `failed`, or `unknown` with bounded secret-free evidence. Fulfillment is self-reported and unverified; uncertainty is never completed.

Retry only retryable transport failures with the same key; on conflict refetch and reconsider. Stop for credentials, access, authority, target, consequence, fingerprint, timeout, or external boundary issues. Referenced free-preview keys remain usable during no-billing preview; Commentary owns Pro notices.
