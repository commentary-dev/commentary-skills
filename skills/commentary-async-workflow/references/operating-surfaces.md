# Inbox and Workspace operating surfaces

## Discover before choosing a transport

Use installed MCP tools when they advertise the operation, CLI for terminal automation, and HTTP for an explicitly configured API integration. Never duplicate a mutation across transports.

Resolve CLI with `commentary --help`, then an available project-local binary, then `npx -y @commentary-dev/cli` when installation is appropriate. Inspect subcommand help before newer flags. Use `--json` and payload files/stdin rather than content-bearing arguments.

Read the configured server's `/openapi.json` and OAuth metadata, or MCP discovery/input schemas, before relying on capabilities. Package/server versions or local source alone do not prove support. Missing routes/scopes/arguments need a supported alternative or durable handoff, not invented APIs. Public Inbox/Workspace reads and current-policy approval waits need a compatible deployment; older servers may expose Interactions without them.

## Identity and scopes

Use configured credentials. CLI `whoami --json` checks authentication; OAuth `login --no-open` supports setup. Request only task-required advertised `login --scope` values; explicit scopes replace defaults. Never solicit tokens in chat or put them in content, repository files, or logs.

| Operation | Scope |
| --- | --- |
| Interaction creation / view or policy proposal | `commentary.interactions.create` |
| Request/messages/Decision/guidance/Fulfillment reads | `commentary.interactions.read` |
| Revision, lifecycle update, agent message, guidance acknowledgment | `commentary.interactions.update` |
| Cancel | `commentary.interactions.cancel` |
| Fulfillment report | `commentary.interactions.fulfillment` |
| Inbox/view/policy/insight/notification reads and simulation | `commentary.inbox.read` |
| Workspace/Resource/team queue reads | `commentary.workspaces.read` |
| Resource linking / authorized review rename | `commentary.workspaces.resources.write` |
| Webhook diagnostics / mutations | `commentary.webhooks.read` / `commentary.webhooks.write` |

Scopes do not replace current membership, source/Resource access, creator/owner authority, governance, or server feature checks. Use account-scoped credentials where required. External creation addresses the credential owner. Registered-agent type/priority/rate limits, mute and disable controls cannot be bypassed by switching credentials.

Browser Inbox spans authorized workspaces; agent reads are credential-workspace-bound. `--workspace` cannot switch browser selection or broaden the grant. Separate workspaces need separately authorized profiles; a missing named profile never falls back. Workspace plus Interaction read scopes enable authorized workspace conversations, not another creator's Decision/guidance/Fulfillment authority.

## Transport contracts

MCP `interaction` supports advertised create/get/list/revise/cancel/status, Decision reads/waits, Fulfillment, and guidance. It does not advertise agent message writes, lifecycle updates, human Decisions, or Review escalation. Use supported CLI/HTTP agent operations; browser-only actions stay human-controlled. Send declared arguments only, even if a handler supports more.

MCP wraps domain output in `structuredContent.result`, with separate `data` and `polling`. `status` omits actions/feedback/fingerprints; `get` supplies full context. `decision_get` needs a known id; immediate next-receipt reads use `decision_wait` with `waitMs: 0`.

HTTP create POSTs `{ resource, content, initialState?, interactionType?, priority? }` to `/api/v1/interactions`. CLI creation files/stdin contain just content; Resource/type/priority/keys use flags. Revisions may use `{ content, priorRevisionId, addressedFeedbackIds }`. CLI item JSON uses `interaction`/`decision`; newer agent groups preserve API `data`. Do not assume identical shapes.

MCP/HTTP schemas differ, including images and provenance. Domain limits can be stricter than declaration limits: 256 KiB requests, 64 KiB body, 32 blocks, 10 actions, 20 links, and at most four authorized raster images where supported. Prefer small payloads and server validation.

## Polling and concurrency

Default foreground waits to 60 seconds unless another bounded budget is requested. Each HTTP/MCP wait is at most 10 seconds and the remaining budget. Honor `polling.retryAfterMs` and retry headers/hints, abort promptly, and return stable handles on timeout/interruption. These outcomes neither cancel a request nor supply consent.

Pass opaque ids/cursors unchanged. HTTP writes use the exact returned strong `If-Match` ETag and stable `Idempotency-Key`; MCP uses exact `expectedVersion` and `idempotencyKey`. Correlation belongs in transport metadata. Reuse identities only for unchanged retries; changes require new keys. On 412/428/conflict refetch and reconcile instead of silently altering retries.

CLI `decision wait --approval` requires current-policy satisfaction; ordinary positive receipts do not establish executable approval. Action fingerprints differ from revision content hashes. Human Decisions, feedback/guidance authoring, reply editing, and Review escalation stay browser-only.

CLI waits distinguish timeout 124, interruption 130, and negative outcome 10. Auth/scope 3, precondition 7, and validation/conflict 8 require appropriate recovery. Report acceptance may exit zero for failed/unknown Fulfillment. Follow actual command error JSON and server retryability.

Commentary owns Core/free and Pro-preview availability and no-billing notices; do not add client-side tier enforcement or claim licensing grants authority.
