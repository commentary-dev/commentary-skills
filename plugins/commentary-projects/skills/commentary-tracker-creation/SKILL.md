---
name: commentary-tracker-creation
description: Create and validate portable Commentary Tracker schemas, initial records and native view mappings; not Forms submissions or human approval records.
---

# Commentary Tracker Creation

Choose the smallest useful collection for the requested work. Author Tracker Contract v1 JSON or core YAML with stable field ids, labels, required/default semantics and native views. Use the linked checklist example as a starting point, not a mandatory process. Native checklist/list/table/board/timeline/calendar/Gantt/summary views share records; validate each renderer mapping against compatible fields.

Run validate before create. Fix reported diagnostic paths without stripping invalid fields silently. Record values are separate from schema and system versions. Apply defaults only at creation; false and zero are meaningful. An execution field is user-reported progress, never acceptance. Keep ordinary records writable and human receipts outside values.

Create in one authorized initial workspace, read the returned schema revision, then create bounded records against it. Optionally associate the original Tracker with a Project using project-management. Preserve local JSON/YAML when access, semantics or reference resolution fails.

Read [references/operating-contracts.md](references/operating-contracts.md) before transport selection or recovery. Use [references/worked-example.md](references/worked-example.md) for the validated pm-tracker workflow and its limits.
