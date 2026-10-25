# Review Package Creation example

Read the [portable workflow source](https://github.com/commentary-dev/commentary-skills/tree/main/examples/projects) for the package fixture and CLI-capable/MCP-only adapters. Version 0.1.0 is tested with Projects Contract v1, CLI 0.2.0 and Agent SDK 0.2.0. The fixture validates requests and recovery; it is not live provider, browser isolation or genuine human acceptance evidence.

The executable fixtures preserve exact versions and report awaiting_human. Use the deployed schemas for real identifiers and upload limits.

## Exact workflow

Use the walkthrough directory and dedicated package validate/publish/sync commands in the source example. MCP input manifest pages retain stable id/path; resumable chunk inputs carry uploadId/offset/sha256/contentBase64. Confirm finalize receipts and ready Package revision. For sync pass the explicit package id and current ETag, plus a fresh exact-intent key.
