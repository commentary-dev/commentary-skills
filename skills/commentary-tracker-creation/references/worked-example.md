# Tracker Creation example

Read the [portable workflow source](https://github.com/commentary-dev/commentary-skills/tree/main/examples/projects) for the pm-tracker fixture and CLI-capable/MCP-only adapters. Version 0.1.0 is tested with Projects Contract v1, CLI 0.2.0 and Agent SDK 0.2.0. The fixture validates requests and recovery; it is not live provider, browser isolation or genuine human acceptance evidence.

The executable fixtures preserve exact versions and report awaiting_human. Use the deployed schemas for real identifiers and upload limits.

## Exact workflow

Validate { contract } through commentary_trackers.validate; create { workspaceId, contract }; read returned schemaRevisionId before records_create { trackerId, schemaRevisionId, values }. The checklist maps title to a required text field and completed to done:boolean. Core YAML rejects duplicate keys, aliases and custom tags. Table uses compatible columns; board uses status; schedules require dates and dependencies.
