---
name: commentary-tracker-operations
description: Query and conditionally edit Commentary Tracker records, views and schemas, or reconcile portable Git proposals; not provider authority migration or human Decisions.
---

# Commentary Tracker Operations

Read schema and permissions, query bounded pages with opaque cursors, and read exact record versions before editing. Patch only provided values; use unset for optional fields, not null. Bulk operations must inspect every result; a successful subset is not a successful batch. Reordering has its own version/rank preconditions and must preserve concurrent moves.

Preview schema evolution and imports; inspect incompatible fields, dropped values and references before explicit apply. Keep canonical exports and stable ids. Human-only authority migration and source binding require a human path even when their schemas exist.

For Git mode stage versioned proposals, preview current source and reconcile conflicts explicitly. GitHub dispatch needs current source write authority, writeback scope and explicit provider intent. Azure writes are unsupported; reads/import/source/CI observations remain supported. Do not commit locally, force-push or declare a pending commit synchronized. The exact server/provider confirmation establishes synchronization. Report execution independently of human acceptance.

When tracking review readiness, read the authorized review-progress projection and exact record-to-review relation before changing status. Use advertised `configureTrackerReviewRelation` operations only for requested bindings, with the current relation/record preconditions and exact acceptance target. Reconciliation can return applied, suggestion, conflict or unchanged; inspect each result. Never infer human acceptance or passing verification from execution status, or infer whole-Project completion from a bounded page.

Read [references/operating-contracts.md](references/operating-contracts.md) before transport selection or recovery. Use [references/worked-example.md](references/worked-example.md) for the validated tracker-edit workflow and its limits.
