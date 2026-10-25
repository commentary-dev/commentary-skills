# Project Management example

Read the [portable workflow source](https://github.com/commentary-dev/commentary-skills/tree/main/examples/projects) for the pm-tracker fixture and CLI-capable/MCP-only adapters. Version 0.1.0 is tested with Projects Contract v1, CLI 0.2.0 and Agent SDK 0.2.0. The fixture validates requests and recovery; it is not live provider, browser isolation or genuine human acceptance evidence.

The executable fixtures preserve exact versions and report awaiting_human. Use the deployed schemas for real identifiers and upload limits.

## Exact workflow

Read the granted workspace and Project first. CLI project get --project project-1 maps to commentary_projects { action: get, input: { projectId: project-1 } }. Use resources_link with input.target (not resource) and current ETag. For a new Project use create with workspaceId/name; archive/restore remain human-only even when discoverable.
