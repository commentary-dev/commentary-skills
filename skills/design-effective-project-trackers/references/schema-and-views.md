# Schema and view choices

Ask what decision a field changes and who maintains it. If neither is clear, omit it. Use text for the outcome, boolean for completion, a defined enum for workflow status, typed dates only when known, and original Resource references for review context. An optional Project organizes Resources without copies or source-access grants.

Mappings: checklist title=text/completed=boolean; board status=enum; calendar requires a date; Gantt needs date bounds and meaningful dependency references. Keep readable native alternatives and keyboard operations. Validate the portable contract before writes; do not silently coerce invalid mappings.

A finished implementation may still await review, have stale exact acceptance, or lack independent verification. Keep these dimensions readable without inventing percentage completion. Git authority conflicts require an explicit preview/reconciliation and authorized write; Azure offers read/import/CI observation with unsupported-write diagnostics. Never commit or create a PR merely because the Tracker is ready.
