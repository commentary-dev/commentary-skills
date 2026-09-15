# Async delivery and SDK continuation

## Webhooks are wakeup signals

Use webhooks for a requested service integration with a configured receiver; bounded polling remains universal fallback. Subscription management and redacted diagnostics use HTTP or supported CLI, not invented MCP actions.

Owners/admins need webhook read/write scopes. Create/update/disable/secret rotation/replay stays within task authorization. Creation requires idempotency; conditional mutations require exact ETags.

```bash
commentary --json webhook list
commentary --json webhook deliveries list whs_123 --status failed
commentary --json webhook deliveries replay whs_123 whd_123 --yes
```

Replay resends an external notification; it is not read-only diagnostics.

Creation/rotation reveals signing material once. CLI `--secret-file` must be a new file outside the project, with an existing parent directory; secrets are excluded from output. Use configured private storage, never repository content or chat. Replayed creation cannot reveal a secret again.

Verify receiver signatures/timestamps against the current public webhook contract, deduplicate delivery/event ids, and tolerate retries/out-of-order events. Retrieve authoritative request/Decision/Fulfillment state using scoped credentials after verification. Minimal event references are neither approval nor verified outcomes. Recheck newer revisions and current approval before execution.

## Agent SDK

Use `@commentary-dev/agent-sdk` for code integration only when the installed published package and configured server expose the needed binding. Discover OpenAPI capabilities and inspect actual methods/types; SDK coverage is not automatically CLI/MCP coverage.

Supply credentials externally; never bundle long-lived bearer tokens in public browser code. Bound pagination/polling, support abort, and retain ETags/correlation/idempotency. Human feedback/guidance bindings require browser authentication, not agent writes. Validate current create envelopes `{ resource, content }` rather than copying an obsolete quick start.

The SDK is a transport helper. Server authorization, lifecycle, approval, retention, and licensing remain authoritative.
