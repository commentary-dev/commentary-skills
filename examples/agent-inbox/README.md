# Connector-neutral agent Inbox workflows

These five Node 22+ examples create durable Commentary Interactions for morning brief choices, email draft approval, calendar planning, engineering change review, and production operations. They share a lifecycle implementation and JSON input. No connector, credential, or automatic external action is bundled.

## Quick start

Run a deterministic dry run from the repository root:

```sh
node examples/agent-inbox/run.mjs --workflow examples/agent-inbox/email-draft/input.json
```

An exact approval with satisfied current policy ends at `"stop": "approved_external_execution_required"`. Its handoff identifies the immutable revision, action, fingerprint, and consequence taken from the current action payload. The example performs no email, calendar, repository, cloud, or production operation.

Morning brief `choose` responses end at `"stop": "response_received"` with `executionAuthorized: false`. Answers and acknowledgments have the same informational boundary. They are useful human input, not approval.

Only the deterministic fixture can simulate execution:

```sh
node examples/agent-inbox/run.mjs --workflow examples/agent-inbox/production-operation/input.json --execute-fixture --fulfillment unknown
```

Its evidence includes `"externalSideEffect": false`. It reports `received`, then `started`, then the requested permitted outcome. Fulfillment is append-only, self-reported, and unverified. The fixture models transport shapes and failure cases; it is not the server's complete team-policy implementation.

Use `--outcome request_revision`, `--outcome reject`, or `--fulfillment failed` to inspect other paths. Fixture runs are memory-only and create no files or remote records.

## Live HTTP configuration

Set secret-safe environment variables; never put credentials in input JSON or commit them:

```sh
COMMENTARY_BASE_URL=https://your-commentary-host.example \
COMMENTARY_TOKEN=your-account-scoped-token \
node examples/agent-inbox/run.mjs --adapter http --workflow examples/agent-inbox/morning-brief/input.json
```

Replace fixture Resource ids with authorized Commentary Resources. Request only advertised scopes needed for the actions used: `commentary.interactions.create`, `.read`, `.update`, `.cancel`, and `.fulfillment`. Commentary remains authoritative for token grants, workspace membership, Resource access, and action authority.

The adapter discovers whether the configured server advertises the Decision `approval` query in OpenAPI. Approval workflows return `approval_unavailable` if that current-policy read is missing. A historical positive receipt alone cannot satisfy current membership, policy, expiry, or revocation checks. Local CLI/server additions do not guarantee their availability on a deployment; consult actual CLI help and server discovery.

Writes use payload-bound idempotency keys and exact server ETags. Polling defaults to 60 seconds, limits each long poll to the remaining budget, and respects server retry hints. Timeout returns the durable Interaction handle for continuation. Transport errors retain status, retryability, correlation id, and retry delay without exposing payloads or tokens.

The HTTP adapter cannot execute external work. Handoff requires a configured connector and established authorization for the exact current action. A descriptive `expectedConsequence` in example input does not authorize an operation or replace its immutable payload.

To cancel an authorized nonterminal live request, fetch its current state and use the exact `If-Match` with a payload-bound `Idempotency-Key`. Aborting a wait does not cancel the Interaction. Terminal records follow Commentary retention policy.

## Consolidated MCP equivalent

`lib/mcp-pattern.mjs` builds stateless `interaction` calls with matching `MCP-Method`, `MCP-Name`, and `MCP-Param-Action` headers. The helper describes transport shape; it does not send credentials or implement current-policy approval evaluation.

Use `get` for revisions, actions, and messages; `status` returns lifecycle/version fields only. Use `decision_wait` with `waitMs: 0` for an immediate receipt read, or `decision_get` when a Decision id is already known. Raw MCP receipts omit answer values and human/policy details and cannot establish current execution authorization.

Use `revise` with fresh context and only declared schema arguments. Old approvals do not carry forward to a new revision. Human Decisions, current-task replies, and future guidance are distinct. Retrieve and acknowledge delivered guidance through the advertised surface; acknowledgment proves receipt, not application or learning.

## Failure handling and verification

- Rejection stops; revision feedback creates a new immutable revision and new action fingerprints.
- Wrong action, changed revision, stale fingerprint, purged or expired receipt, terminal state, unsupported approval policy, and timeout stop before execution.
- A partially satisfied team chain remains pending. Recheck server policy and fresh lifecycle after waiting.
- Retry only retryable failures with the same key for the same payload. On conflict, fetch context and reconsider rather than silently retargeting.
- Report uncertain execution as `failed` or `unknown`. Evidence stays bounded and secret-free.

Tests cover informational outcomes, receipt/action binding, changes during waits, current-policy results, revision conflicts, retry hints and budgets, cancellation, exact ETags, idempotency, Fulfillment ordering, and mocked HTTP compatibility. They make no live requests or external side effects. Forward-test catalog validation is separate from behavioral agent evaluation.

```sh
npm run examples:agent-inbox
npm run verify
```
