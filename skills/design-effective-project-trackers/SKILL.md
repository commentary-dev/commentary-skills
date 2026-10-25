---
name: design-effective-project-trackers
description: Design Project Trackers with meaningful record granularity, minimal useful fields, clear lifecycle and native view mappings, choosing custom renderers only for a demonstrated comprehension need.
---

# Design Effective Project Trackers

Choose what one record represents before selecting fields or a renderer. A record should have an independently useful owner, outcome or lifecycle; split work when those differ and avoid a row for every code line. Preserve the user's existing workflow when it already answers the question.

Start with the smallest useful schema. Use typed fields and explicit missing values; false and zero are real values. Separate execution status from human review, exact acceptance and independently observed verification. Do not add a writable approved field and treat it as authority.

Choose native checklist for completion, list/table for comparison, board for categorical status, calendar/timeline for dates, Gantt for actual dependencies, and summary for separate dimensions. Validate each mapping against field types. Avoid invented dates merely to populate a view.

Prefer native views and declarative embeds. Use a custom renderer only for an unmet question, with scoped broker operations, no API credentials, diagnostics and native fallback. For requested implementation use commentary-tracker-creation, commentary-tracker-operations or commentary-custom-renderer-development when available.

Read [schema and view choices](references/schema-and-views.md) when choosing granularity; see [worked example](references/worked-example.md) for PM readiness tracking.
