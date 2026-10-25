---
name: commentary-custom-renderer-development
description: Develop an isolated Commentary Tracker renderer using the capability-broker SDK when native or declarative views are insufficient; not privileged application scripts.
---

# Commentary Custom Renderer Development

Prefer a native view or declarative commentary-tracker embed for ordinary layout. When custom interaction is required, inspect deployed renderer/SDK protocol capabilities and the exact grants before implementation. The framework-neutral Tracker SDK is distinct from Forms submission and the Agent SDK.

Implement schema/permissions reads, bounded record queries, server validation diagnostics, conditional writes, event gap reconciliation and teardown using the SDK. Keep a readable native fallback. Never include API bearer tokens, cookies, unrestricted origins, arbitrary privileged scripts or a human Decision operation in the renderer.

Review a hosted immutable executable bundle or an external renderer at an explicitly disclosed HTTPS origin. Bind channel/version, source window, mount nonce and request correlation. An opaque sandbox requires the expected window/channel/nonce; never relax isolation to fix a failed mount. Use only granted navigation and narrow static assets. Cancellation/revocation clears pending calls. See the renderer reference for a validated SDK example and attack tests.

Read [references/operating-contracts.md](references/operating-contracts.md) before transport selection or recovery. Use [references/worked-example.md](references/worked-example.md) for the validated renderer workflow and its limits.
