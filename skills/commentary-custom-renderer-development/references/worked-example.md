# Custom Renderer Development example

Read the [portable workflow source](https://github.com/commentary-dev/commentary-skills/tree/main/examples/projects) for the renderer fixture and CLI-capable/MCP-only adapters. Version 0.1.0 is tested with Projects Contract v1, CLI 0.2.0 and Agent SDK 0.2.0. The fixture validates requests and recovery; it is not live provider, browser isolation or genuine human acceptance evidence.

Read [renderer-protocol.md](renderer-protocol.md) before building a custom renderer.

## Exact workflow

renderer.mjs demonstrates capability-negotiated reads, getRecord/patchRecord with current ETag/schema revision, preserved diagnostics and finite changes polling with gap refetch. Keep controller construction/origin handshake in the authorized host integration. Hosted and external renderer manifests declare permissions; do not place Agent SDK or API credentials in the frame.
