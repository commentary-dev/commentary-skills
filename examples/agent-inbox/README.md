# Connector-neutral agent Inbox workflows

These five maintained Node 22+ examples create durable Commentary Interactions for morning brief triage, email draft approval, calendar planning, engineering change review, and production operations. They share one lifecycle implementation and use JSON input. No connector, provider SDK, credential, or automatic external action is bundled.

## Quick start

Run a deterministic dry run from the repository root:

```sh
node examples/agent-inbox/run.mjs --workflow examples/agent-inbox/email-draft/input.json
```

Expected output ends at `"stop": "approved_external_execution_required"`. That is the safety boundary: the output contains the exact immutable Decision fingerprint and consequence an independently configured agent would need, but the example performs no email, calendar, repository, cloud, or production operation.

The only executable adapter is the deterministic fixture, selected explicitly:

```sh
node examples/agent-inbox/run.mjs --workflow examples/agent-inbox/production-operation/input.json --execute-fixture --fulfillment unknown
```

Its evidence always includes `"externalSideEffect": false`. Use `--outcome request_revision`, `--outcome reject`, `--fulfillment failed`, or `--fulfillment unknown` to inspect failure paths. Clean up fixture runs by exiting; they are memory-only and create no files or remote records.

## Live HTTP configuration

Set secret-safe environment variables; never put them in input JSON or commit them:

```sh
COMMENTARY_BASE_URL=https://your-commentary-host.example \
COMMENTARY_TOKEN=your-account-scoped-token \
node examples/agent-inbox/run.mjs --adapter http --workflow examples/agent-inbox/morning-brief/input.json
```

Replace the fixture Resource id with an owned Commentary Resource. The token needs only the actions used: `commentary.interactions.create`, `.read`, `.update`, `.cancel`, and `.fulfillment`. Commentary remains authoritative for token scope and Resource access. HTTP writes use stable correlation/idempotency keys and exact strong ETags. Polling is bounded; a timeout leaves the durable Interaction available for later polling. To clean up a non-terminal live example, fetch its current version and `DELETE /api/v1/interactions/{id}` with the exact `If-Match` and a new stable `Idempotency-Key`; terminal records are retained under Commentary policy.

The HTTP adapter deliberately cannot execute external work. Approved output must be passed to a separately configured connector only after comparing `decision.proposalFingerprint` to the current proposal fingerprint. Never log raw proposal payloads or bearer tokens.

## Consolidated MCP equivalent

`lib/mcp-pattern.mjs` builds the equivalent stateless `interaction` tool call with matching `MCP-Method`, `MCP-Name`, and `MCP-Param-Action` headers. Use the same business sequence: `create`, `status`, `decision_wait`/`decision_get`, `revise` or `cancel`, then—only after separate execution—`fulfillment_report` and `fulfillment_get`. MCP Decision actions are read-only. The helper centralizes transport shape; it does not duplicate workflow rules or send credentials.

Production approval is intentionally high-friction. Its exact consequence names the target and capacity change and requires `REDUCE GROUP A TO 4 INSTANCES`. Approval records human intent only: it does not mean Commentary performed, scheduled, or verified the operation. Fulfillment is an append-only, self-reported and unverified status (`received`, `started`, `completed`, `failed`, or `unknown`).

## Failure handling and contract map

- Rejection stops; revision feedback creates a new immutable revision with new action fingerprints. Old approvals never carry forward.
- A stale fingerprint, terminal state, unsupported Decision, cancellation, or timeout stops before execution.
- Retry only retryable transport failures with the same idempotency key. On a version conflict, fetch status and reconsider instead of silently retargeting.
- Report partial or uncertain execution as `failed` or `unknown`, not `completed`. Evidence must be bounded and secret-free.
- An interrupt may abort polling. Safe cancellation first fetches current state/version and never tries to cancel a terminal Interaction.

The deterministic tests map to shipped scenarios: durable create/idempotency/poll/cancel (`INTERACTION-003`), consolidated MCP equivalence and bounded wait (`INTERACTION-004`), exact immutable Decision fingerprint retrieval and stale rejection (`INTERACTION-005` and `INTERACTION-006`), failed/unknown unverified fulfillment (`INTERACTION-007`), and rejection/feedback/revision invalidation (`INTERACTION-008`). Run:

```sh
npm run examples:agent-inbox
npm run verify
```
