---
name: commentary-async-workflow
description: Resume durable Commentary requests across messages, Decisions, immutable revisions, future guidance retrieval and acknowledgment, external execution handoff, and honest Fulfillment. Use for work spanning sessions; not ordinary chat or ephemeral MCP Elicitation.
---

# Commentary Async Workflow

Keep one stable handle and distinguish the requested human response, whole approval chain, global lifecycle, and external execution. Read [references/operating-surfaces.md](references/operating-surfaces.md) for discovery, scopes, polling, and retry contracts.

## Continue a durable request

1. Discover or resume existing authorized work before creating another request. Retain content-free handles, correlation, receipt/cursor, and operation identities in host-appropriate session state; never put secrets or copied customer context in repository memory.
2. Refetch full context. When available, use `commentary-ask-human` for answers/choices, `commentary-request-approval` for execution gates, `commentary-submit-revision` for proposal changes, and `commentary-escalate-review` for human-confirmed deeper Review. These boundaries still apply without companion skills installed.
3. Inspect messages and typed feedback as well as Decisions. Reply concerns this instance; requested actions capture exact Decisions; guidance concerns future work. Workspace conversation access does not grant creator authority to revise, read Decision receipts, acknowledge guidance, or report Fulfillment.
4. Use CLI/HTTP messages to append an authorized agent reply against exact ETag and revision. It can resume human attention without changing the proposal. Do not edit human messages or invent a consolidated MCP message action. Use immutable revisions for proposal changes.
5. Poll within the foreground budget, respecting retry hints and aborts. Individual approval may leave a team chain pending. Timeout/interruption returns the durable handle without inferred consent or automatic cancellation. Requested cancellation refetches the exact ETag and respects terminal state.
6. Before external execution require established exact-action authorization, a configured executor, current revision/action/fingerprint, and server-confirmed current approval satisfaction where required. Answers and acknowledgments are input, not approval. Missing current-policy evidence prevents execution.
7. Fulfillment first reports `received`, then `started`, followed by an honest permitted outcome. Reports are append-only and self-reported. Corrections follow server transitions; uncertain outcomes are `failed` or `unknown`.

## Future-facing guidance

CLI `interaction guidance list`, HTTP GET `/api/v1/interactions/{id}/guidance`, or MCP `guidance_list` retrieves bounded guidance only for the creating agent. Paginate opaque cursors and inspect scope (`similar_items`, `same_source`, `agent_behavior`, `general`), record id, revision, and purge state separately from current feedback.

Acknowledge an exact readable record through CLI `interaction guidance acknowledge`, HTTP POST `/guidance/{guidanceId}/acknowledgment`, or MCP `guidance_ack` with a stable idempotency key. This proves delivery, not learning, application, approval, or task completion. Assess guidance against user intent and authorization before applying it. Persistent project-instruction, configuration, or memory changes need their own established scope; do not automatically rewrite them.

Read [references/async-delivery.md](references/async-delivery.md) only for webhook continuation, delivery recovery, or SDK integration. Every wakeup rechecks source authorization; events never authorize execution.
