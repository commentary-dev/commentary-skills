---
name: commentary-escalate-review
description: Escalate a blocked, overdue, disputed, or high-impact Commentary Inbox request to an authorized human role with durable context. Use when normal review cannot safely proceed; do not use escalation to invent authority, bypass a Decision, or pressure a reviewer.
---

# Commentary Escalate Review

Escalation routes context; it never grants approval or changes a proposal.

## Safe workflow

1. Use configured Commentary authentication limited to required Interaction actions and Resource access. Never request credentials in chat. Require an existing handle or authorized Resource and server-authorized escalation routing; agents cannot invent an approver.
2. Fetch MCP `interaction` `status` or `GET /api/v1/interactions/{id}`. Confirm non-terminal state and capture current revision/version, Decision fingerprint, feedback ids, prior attempts, blocker, urgency, impact, neutral owner role, requested response, and deadline.
3. Write a secret-free escalation with that evidence and the exact consequence if approval is requested. Reuse the correlation id and derive a stable escalation idempotency key. Use the server-supported update/revision path; if proposal or consequence changes, call MCP `revise` or `POST /api/v1/interactions/{id}/revisions` with prior revision, feedback ids, exact version/ETag, and a new key. Never reinterpret approved work.
4. Poll bounded `status` plus `decision_wait`/`decision_get`, or HTTP status/decisions. Honor retry hints, cap waits at 10 seconds, and stop at the deadline with the durable handle. Silence is not consent.
5. Agents cannot write Decisions. Require revision, action, and fingerprint to match. Rejection stops; feedback creates a new revision; any changed proposal invalidates old approval. Stop before production or other high-impact execution; a separate configured executor must revalidate the fingerprint.
6. Any later fulfillment is append-only, self-reported, and unverified. Use `failed` or `unknown` for uncertainty.

Stop for missing credentials/access, stale version, unclear owner, conflicting reviewers, terminal state, timeout, or expanded consequence. Referenced Core/free-preview keys remain usable during no-billing preview; Commentary owns Pro notices.
