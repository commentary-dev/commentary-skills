---
name: design-effective-interactions
description: Design clear Commentary Inbox notifications, durable questions, choices, and exact approval requests with concise context, useful labels, proportional consequences, and deliberate full Review handoffs. Use for request quality, not API transport or human Decision authoring.
---

# Design Effective Interactions

Make the decision understandable before choosing a transport. Preserve the user's task, audience, and established authorization. Use an available technical skill for creation/retrieval.

## Choose the interaction

| Human need | Design |
| --- | --- |
| Awareness without a response | Notification with a useful source link |
| Missing factual input | One durable question with an answer action |
| Selection among alternatives | Stable choice ids and meaningful tradeoffs |
| Confirmation of receipt | Acknowledge, without implied execution approval |
| Permission for an exact consequence | Approval bound to the immutable action |
| Careful reading or substantial structured input | Canonical Review or source-backed Form |

Use chat for immediate clarification. Explain why a persistent request needs durable attention; do not turn every update or low-impact choice into an approval gate.

## Compose the request

- Title the decision, not internal agent process. Lead with what needs a response, then the facts needed to decide and one plain-language reason.
- Give choices distinct outcomes and useful labels. State tradeoffs and provide explicit deferral/revision where supported. Avoid manufactured urgency, leading wording, or bundling unrelated decisions.
- Bind approval's exact target, payload, audience, side effects, and consequence in its action proposal. Scale warnings to impact; do not promise rollback or independent verification the executor cannot provide.
- Use supported version-1 blocks: Markdown for explanation, facts for evidence, choices for alternatives, proposed_message for exact text, code for inert excerpts, warning for consequences, and Resource/review links for canonical context. Do not supply custom components, styles, icons, or executable payloads. Source-authorized raster images need safe alt text and actual transport support.
- Keep copied context bounded and necessary. Link authorized sources rather than copying whole documents, conversations, or customer records.

## Check the conceptual model

Requested actions capture Decisions for this instance. Reply discusses this instance. Teach this agent gives future guidance. Explain them separately; Reply or guidance acknowledgment must not imply approval or completion.

Human response completion, team-chain completion, global lifecycle, and reported execution are separate. State the next responsible party plainly. Use “Agent-reported completion”; never present Fulfillment as independently verified.

Keep brief items independently actionable. Digests link original requests rather than duplicating approvals. Responses and revisions stay with the originating Interaction. Explain when careful reading needs full Review and let the eligible human confirm its destination.
