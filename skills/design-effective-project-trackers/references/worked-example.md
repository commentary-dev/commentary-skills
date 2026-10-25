# Feature readiness

One record represents a reviewable outcome, such as "Missing dates remain unscheduled". Start with title and done fields and a native checklist, then add owner or status only when coordination needs them. Keep test provenance and exact Session links in the review context.

A PM compares outcomes in a table. An engineer follows selected source and evidence links from one outcome. No calendar is offered for rows with unknown dates. A proposed bespoke board adds no new question, so use the native board if categorical status becomes necessary.

When a concurrent update conflicts, keep the local intent, fetch the current schema/record ETag, show the difference and reconcile. Do not set approved=true or interpret done=true as a human Decision.
