# Deployed contracts and recovery

## Context and transport

Use least-privilege configured credentials, never tokens pasted into examples/chat. Resolve the credential-granted workspace, Project/Resource identity, exact version and current independent source access. Read the deployed OpenAPI or MCP tools/list schemas and operation capabilities before constructing parameters. A catalog entry or scope does not imply current authority. The portable v1 snapshot shipped with the example is for deterministic validation, not deployment discovery.

Prefer CLI when terminal/filesystem collection, hashes, synchronization or watch are needed. Otherwise use discovered hosted MCP operations. The six groups are commentary_projects, commentary_trackers, review_package, project_review_session, codebase_review and project_evidence. Their domain envelope is { action, input, etag?, idempotencyKey? }; input includes path ids and nested domain actions. Existing review_comments/interaction tools have their own schemas; do not impose this envelope on them. No persistent process, framework or harness is required.

HTTP uses canonical /api/v1 routes, If-Match and Idempotency-Key. Agent SDK 0.2.0 has projects/trackers/reviewPackages/projectReviews/sourceSnapshots/evidence groups and operations.capabilities(). For example, after confirming createProject is supported, await client.projects.create({ workspaceId, name: 'Feature readiness' }, { idempotencyKey: 'feature-create-1' }). Credentials belong only in the host transport. Exact schemas may add fields; inspect deployed schemas rather than guessing.

## Writes and failures

Store content-free ids/cursors/receipt versions and preserve the user's local draft privately. Never place customer source or secrets in repository memory. Retry only identical intent with the same key. Changed intent needs a new key. Mutations use the exact strong returned ETag; successful response data and etag are distinct.

- Missing credentials or 401/403: stop this operation, name the missing grant/source authority and safe setup path; do not switch profiles or bypass denial.
- Unsupported operation/version: prepare portable input and report the missing capability; do not invent another tool or claim success.
- Schema/record validation: report diagnostic paths, fix only the intended data and revalidate. Preserve failed input.
- Stale ETag: keep input and original key/ETag, refetch current schema/record/revision and reconcile explicitly before a fresh-key write. No implicit overwrite.
- Git conflict: retain proposal/base/source versions, preview current authority and resolve explicitly. Azure writeback is unsupported. Source binding and authority migration remain human-only.
- Interrupted upload: read status with the original upload id, compare confirmed hashes/offsets and resend only missing exact chunks. Expired upload needs new preparation; checksum mismatch is not a successful transfer.
- Events: bound waits/pages, deduplicate event ids, retain opaque cursors, and refetch authorized current state on gap/expiry. Events carry hints, not authority or acceptance.
- Timeout/abort: return stable handles and unresolved state. Never interpret silence as approval or run a perpetual poll.

CLI JSON preserves ok/data/etag/correlationId/idempotencyReplayed; replay may be null when the header is absent. Exit codes are usage 2, auth 3, network 4, API 5, safety 6, stale 7, validation 8, server 9, terminal-negative 10, timeout 124 and interrupted 130.

## Entitlements and authority

Core organization, native views, portability and agent access use domain Free keys: projects.basic/agent_api, trackers.basic/native_views/portability/agent_api/git_source, review_packages.basic/agent_api, project_reviews.basic/agent_api, review.source_explorer and projects.evidence.basic. Custom rendering/hosting, authorized Git writeback and advanced evidence/impact use trackers.custom_renderer/renderer_hosting/git_writeback and project_reviews.advanced_evidence/advanced_impact Pro-preview. They remain usable during no billing. Discover availability; do not invent a paid blockade. SDK broker permissions are independent of Agent bearer scopes.

Agents request/read exact acceptance but cannot create human Decisions, reviewer eligibility, provider authority or independent verification receipts. Project links never grant source access. Execution, artifact existence, review, acceptance and independently observed verification are separate.
