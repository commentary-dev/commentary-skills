---
name: commentary-async-workflow
description: Orchestrate a durable Commentary Inbox workflow across create, bounded polling, human Decision, feedback revision, external execution boundary, and fulfillment reporting. Use for work that must survive sessions or agents; do not use for ordinary chat questions or MCP Elicitation.
---

# Commentary Async Workflow

Compose the other Inbox skills while keeping one stable Interaction handle across turns.

## Safe workflow

1. Discover consolidated MCP `interaction` and retained protocol compatibility, or use `/api/v1/interactions`. Use configured credentials scoped only to required create/read/update/cancel/fulfillment actions and the Resource. Never bundle, log, or solicit tokens. Define objective, correlation id, timeout, human role, proposal, exact consequence, and separately configured executor. Stop if authority or target is unclear.
2. Create with MCP `action: "create"` or HTTP `POST /api/v1/interactions`, using stable correlation/idempotency keys. Exact retries reuse the key; changed requests do not. Store the handle and stop if status is terminal.
3. Poll `decision_wait` with `decision_get` fallback, or HTTP `/decisions?after=...&waitMs=...`. Honor retry hints, cap waits at 10 seconds, bound total polling, and return the handle on timeout because the Interaction remains durable.
4. Agents never write Decisions. Rejection stops. Feedback or `request_revision` reads durable messages then calls `revise` with `priorRevisionId`, feedback ids, exact expected version/ETag, and a new key. Wait for a new Decision.
5. Before external work refetch status and require Decision revision id, action id, and 64-character proposal fingerprint to match current immutable content. A stale version, changed proposal, missing field, terminal state, or mismatch stops. Never reuse or retarget approval.
6. Production, financial, destructive, security, publication, communication, and other high-impact work always stops here unless the exact action is separately authorized and its executor is configured.
7. After separate execution use MCP `fulfillment_report` then `fulfillment_get`, or HTTP `POST /api/v1/interactions/{id}/fulfillment`, with the Decision tuple and stable key. Fulfillment is append-only, self-reported, and unverified. Partial/uncertain outcomes are `failed` or `unknown`, never verified completion.
8. On interruption fetch current status/version before optional cancel. Retry only retryable errors with unchanged keys; on conflicts/access failures refetch and stop. Escalate only through server-authorized routing.

Durable Inbox is distinct from chat and Elicitation. Missing credentials, access denial, stale revisions, unclear consequences, conflicting feedback, timeout, and external boundaries are human stop conditions. Represented free-preview keys remain usable during no-billing preview; Commentary owns Pro notices.
