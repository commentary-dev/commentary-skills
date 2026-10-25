# Capability-broker renderer

Use @commentary-dev/tracker-sdk 0.1.0 only after deployed commentary-tracker-v1 negotiation. Read the public SDK declaration for exact constructor/transport options; do not create an Agent SDK client in a frame. The validated example in examples/projects/renderer.mjs accepts an already connected SDK controller, reads getPermissions/getSchema/queryRecords, handles diagnostics, and tears down via destroy.

Host handshake pins source window, version/channel, random mount nonce and correlation. Use exact configured origins; opaque frames also require window/channel/nonce checks. Reject origin/nonce mismatch, stale mounts, oversized messages and ungranted operations. Never use wildcard origin, allow-same-origin to bypass the sandbox, cookies or bearer credentials. Broker calls recheck current access.

Native fallback is readable when isolation, framing or protocol negotiation fails. Renderer manifests disclose exact external HTTPS origin or immutable hosted bundle, entry asset and requested operations. Custom host publication is Pro-preview, usable without billing; availability still requires configured isolated hosting.

Bound queries to 100 records/page, 10 in-flight calls, 60 calls/minute/mount, 192 KiB messages and 30-second calls as advertised. Bound changes polling, deduplicate ids and refetch on cursor gaps. No broker human Decision or direct Git write exists. Do not execute uploaded reports or server-build customer JavaScript.
