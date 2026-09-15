---
name: commentary-inbox-triage
description: Inspect and prioritize authorized Commentary Inbox requests and updates using active/history feeds, filters, ranking explanations, and bounded pagination; hand off to canonical workflows. Use for attention triage, not human Decision authoring or source edits.
---

# Commentary Inbox Triage

Inbox is an account-level attention feed in the browser; Workspace is a separate workbench. Agent API reads are restricted to the credential-granted workspace. Read [references/operating-surfaces.md](references/operating-surfaces.md) before CLI/HTTP discovery.

## Inspect attention

```bash
commentary --profile team --workspace ws_123 --json inbox list --mode active --sort recommended --limit 25
commentary --profile team --json inbox get ws_123 inb_123
commentary --profile team --workspace ws_123 --json inbox list --mode history --sort newest --limit 25
```

Use installed command help for supported filters. HTTP `/api/v1/inbox` also supports typed Resource/source/agent/status/deadline/assignment/Interaction-type/priority filters. Recommended, Newest, and Due soon are server-defined sorts; do not silently reorder the feed or portray one granted workspace as the complete account. Pass opaque cursors unchanged with the same workspace and filters; bound pages and items.

Summarize requested response, sender/reason, consequence, due context, and next owner. Inspect authorized item detail before recommending action. Empty pages, invalid cursors, source-access loss, partial failure, and successful caught-up state have different meanings; report returned state honestly.

## Route work

- Questions and choices use durable answers. Exact approvals use current-policy validation, not attention rank.
- Revision requests need revision-bound feedback and creator authority. Ordinary replies and future guidance are separate.
- Review, Form, Research, Brain, or Preview updates lead back to canonical Resources and dedicated tools. Reuse correlated requests instead of creating duplicate attention posts.
- Queue assignment is attention ownership, not approval eligibility or provider permission. Use `commentary-workspace` for Resource discovery when available.

Active includes accessible requests, updates, and waiting items. History includes completed and recipient-dismissed items. Dismissal/restore, snooze, pin, and read state are recipient presentation controls, not rejection or cancellation. These discovery reads do not mark items read, dismiss them, or write human Decisions. Do not substitute a browser mutation for an unavailable agent operation.

Read [references/attention-proposals.md](references/attention-proposals.md) only for saved views, typed policy proposals/simulation, trust insights, or notification history.
