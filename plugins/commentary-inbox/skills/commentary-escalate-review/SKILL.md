---
name: commentary-escalate-review
description: Prepare and follow a human-confirmed handoff from an exact Commentary Inbox revision to canonical Document, Form, Brain, or Live Preview Review. Use when a bounded response needs deeper review; not to appoint approvers or reroute them through proposal edits.
---

# Commentary Escalate Review

Escalation opens deeper human review while preserving the originating request. It is not approver appointment, execution authorization, or a lifecycle update. Read [references/operating-surfaces.md](references/operating-surfaces.md) first.

## Prepare the human handoff

Fetch full context with CLI `interaction get`, HTTP GET, or MCP `get`. Identify current revision, exact action fingerprint, source Resource, blocker, evidence, consequence, and requested review outcome. If agent-readable context omits the action fingerprint, the human confirmation surface must obtain its exact server binding; do not substitute a revision content hash or invent a fingerprint.

Explain why a full Review helps and offer the relevant canonical destination:

| Human selection | Resource | Supported handoff |
| --- | --- | --- |
| Document Review | Draft Review | Create or link an accessible Draft |
| Form workflow | Form | Create through source-backed Forms or link |
| Brain review | Knowledge Brain | Link the accessible originating Brain review |
| Live Preview Review | Web App Review | Create through opt-in previews or link |

The eligible signed-in human selects and confirms the destination in Commentary. `/api/v1/interactions/{id}/review-escalation` requires same-origin browser authentication; it is not a bearer-agent operation and no CLI or consolidated MCP escalation action is advertised. Never synthesize cookies or invoke it with an agent token. Confirmation binds exact revision/fingerprint and acknowledges that Review acceptance does not execute the external action.

Approver routing is a separate team capability. Do not use `revise` or `update` as an invented routing/escalation operation.

## Follow the linked Review

After human confirmation, refetch authorized `reviewEscalation` provenance and the canonical destination. Operate that Resource through its available Draft, Form, Brain, or Preview tools. Keep app-native threads authoritative and preserve source permissions; do not create a second review on retry.

Monitor bounded pending/in-review/outcome status. Deleted, inaccessible, canceled, purged, or provider-sync-failed destinations need honest recovery. Provider synchronization failure does not erase app-native history.

Returned corrections create a new immutable Interaction revision, invalidating old action approvals. Accepted Review content means the artifact revision was accepted, not that its external consequence was approved or executed. Separately recheck current-policy action approval before established authorized external execution. Return stable request and Review handles on timeout.
