---
name: commentary-ask-human
description: Create a durable Commentary Inbox question when the answer must survive the current chat, reach an authorized person asynchronously, or be resumed by another agent. Do not use for ordinary chat questions, immediate clarification, or ephemeral MCP Elicitation.
---

# Commentary Ask Human

Use this only for a durable response. Prefer chat for immediate clarification and MCP Elicitation for a same-session structured prompt; neither creates an Inbox record.

## Safe workflow

1. Discover consolidated MCP `interaction` or the shipped `/api/v1/interactions` API. Use configured credentials limited to required Interaction actions and the selected Resource. Never ask for a token in chat, embed it in content, or broaden access. Confirm server-authorized recipient routing; agents do not appoint approvers.
2. Write one bounded question with context, blocker, safe deadline, and response choices when helpful. Exclude secrets and unnecessary customer data. Derive stable correlation and idempotency keys; reuse them only for an exact retry.
3. MCP: call `interaction` with `action: "create"`, Resource, content, `initialState: "active"`, and the keys. HTTP: `POST /api/v1/interactions` with `Idempotency-Key` and `X-Correlation-Id`. Retain the returned id/handle.
4. Poll MCP `status` then bounded `decision_wait`, falling back to `decision_get`; HTTP uses `GET /api/v1/interactions/{id}` and `GET /api/v1/interactions/{id}/decisions?after=...&waitMs=...`. Honor `retryAfterMs`, cap waits at 10 seconds, and bound total polling. Timeout leaves the request durable: return its handle and never infer an answer.
5. Rejection stops. Feedback or `request_revision` requires reading durable messages and creating a new immutable revision with the exact current version; never edit in place. Verify any Decision revision id and proposal fingerprint match current status.

An answer is input, not authority for unstated consequences. Fulfillment, if later reported, is append-only, self-reported, and unverified. On interruption fetch current version before optional idempotent cancel. Stop for missing credentials, Resource access, recipient authority, unclear scope or consequence, stale state, timeout, or external action. Referenced Core/free-preview Interaction, Decision, Feedback, Fulfillment, Escalation, and MCP keys are usable during no-billing preview; Commentary owns Pro notices.
