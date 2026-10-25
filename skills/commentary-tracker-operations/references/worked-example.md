# Tracker Operations example

Read the [portable workflow source](https://github.com/commentary-dev/commentary-skills/tree/main/examples/projects) for the tracker-edit fixture and CLI-capable/MCP-only adapters. Version 0.1.0 is tested with Projects Contract v1, CLI 0.2.0 and Agent SDK 0.2.0. The fixture validates requests and recovery; it is not live provider, browser isolation or genuine human acceptance evidence.

The executable fixtures preserve exact versions and report awaiting_human. Use the deployed schemas for real identifiers and upload limits.

## Exact workflow

CLI tracker records update record-1 --tracker tracker-1 --stdin --etag <current> --idempotency-key patch-1 maps to records_patch. Input body is { schemaRevisionId, patch: { values, unset? } }. Query and order have their own bounded schemas. Preview imports/schema changes before explicit apply; partial bulk outcomes and pending Git proposals remain unresolved until confirmed.
