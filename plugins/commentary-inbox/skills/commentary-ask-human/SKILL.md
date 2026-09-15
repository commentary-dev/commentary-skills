---
name: commentary-ask-human
description: Create and retrieve a durable Commentary Inbox question or choice when its answer must survive chat, reach the credential owner asynchronously, or be resumed later. Use chat for immediate clarification and MCP Elicitation for same-session prompts.
---

# Commentary Ask Human

Use Inbox for a durable answer, not implicit permission for another action. Read [references/operating-surfaces.md](references/operating-surfaces.md) to choose an available CLI, MCP, or HTTP operation and understand credential authority.

## Create a useful question

1. Identify the accessible Resource and the person addressed by the configured grant. External creation addresses the credential owner; do not invent recipient or team-routing fields. Discover an existing correlated request before creating another.
2. Write one bounded question with necessary facts, why an answer is needed, and any meaningful deadline. Use an `answer` action for free text or `choose` for a finite choice. Use `design-effective-interactions` for request design when available.
3. Create with stable correlation and an idempotency key for this exact request. CLI `--file` contains the content object; HTTP receives the Resource/content envelope. MCP receives `idempotencyKey`; correlation belongs in transport metadata, not an invented tool argument.

Example content file:

```json
{
  "title": "Which release should we document first?",
  "summary": "Your selection changes the writing order only.",
  "blocks": [{ "version": 1, "type": "choices", "choices": [
    { "id": "stable", "label": "Stable release" },
    { "id": "preview", "label": "Preview release" }
  ] }],
  "actions": [{ "type": "choose", "label": "Choose a release", "payload": {
    "choices": ["stable", "preview"], "consequence": "Record a writing priority only."
  } }]
}
```

```bash
commentary --json interaction create --resource-type draft_review --resource-id draft_123 --file question.json --idempotency-key question-42 --correlation-id writing-42
commentary --json decision wait ixn_123 --timeout 60 --poll-interval 2000
```

## Receive and continue

Poll for the requested response with bounded Decision reads. MCP `status` is only a lifecycle/version read; use `get` for revision, action, and message context. A nonblocking MCP poll is `decision_wait` with `waitMs: 0`; `decision_get` requires a known Decision id.

Refetch after waiting and check the receipt's revision and server-assigned action id. `answer`, `choose`, and `acknowledge` are informational outcomes, not execution approval. Privacy-safe agent receipts may omit response values; retrieve permitted revision-bound messages/context and report unavailable or purged answer content rather than guessing it.

An ordinary Reply can discuss the request without completing its requested response. Read typed feedback before deciding whether an immutable revision is needed; use `commentary-submit-revision` for a proposal change. Rejection stops that proposal. Timeout returns the durable handle without inferring an answer or canceling the request.

Future guidance is separate from the current answer. Creating-agent-only acknowledgment proves receipt, not learning or application. Later external execution needs established exact-action authorization and current approval evidence where approval is required. Fulfillment remains self-reported and unverified.
