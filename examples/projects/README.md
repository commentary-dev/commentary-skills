# Portable Projects workflows

Run Node 24: node examples/projects/run.mjs cli pm-tracker or node examples/projects/run.mjs mcp package. Run npm run examples:projects for both adapters plus HTTP requests, recovery and refusal. All outputs are deterministic adapter fixtures; no hosted mutation or human Decision is made.

CLI adapters accept an injected runner receiving argv and structured stdin. Serialize stdin to JSON and invoke the installed CLI without a shell. MCP adapters accept an injected tools/call invoker and discovered operation ids. HTTP examples show canonical methods/paths/headers; use host-configured authentication, never renderer credentials. Validate exact inputs through deployed schemas. Failed drafts are returned in WorkflowError.recovery; keep them private and refetch before reconciliation.

## PM checklist

checklist.json and checklist.yaml are equivalent portable Tracker Contract v1 sources. pm-tracker validates, creates a collection, creates a record using the returned schema revision, then links the original Tracker. Fixture identifiers are neutral; a real runner must use actual returned ids and ETags, not fixture placeholders. No human governance/approval is fabricated.

## Directory package

walkthrough contains a two-page static package. With installed CLI and a granted profile:

```bash
commentary --json package validate ./examples/projects/walkthrough --manifest ./examples/projects/walkthrough/commentary.package.json
commentary --profile team --workspace workspace-1 --json package publish ./examples/projects/walkthrough --manifest ./examples/projects/walkthrough/commentary.package.json --idempotency-key walkthrough-1 --no-open
```

Use package sync with a fresh key after edits. --dry-run does not publish. Watch only within the requested foreground budget. Preserve .commentary/package.json for resume; it is metadata, not an access grant. Dedicated collectors reject secret-bearing files, unsafe paths/symlinks and unsupported MIME; they do not execute builds.

MCP-only package steps prepare a bounded literal README, read upload status, send one checksum chunk, finalize and publish the immutable upload. Real workflows substitute server ids, verify completed byte/hash receipts, and fetch package readiness before success. Upload capability absence returns a portable bundle; no invented publication. resumeChunk skips only a matching confirmed exact chunk; interrupted/expired/conflicting transfer requires explicit recovery.

## Engineering and feedback

evidence pins source provenance, composes a Session, defines an exact requirement and attaches an inert self-reported report. Independent verification must be requested/read separately from project_evidence when deployed; this fixture has no provider receipt. feedback republishes a package, recomposes exact targets and requests acceptance with the returned server fingerprints. It always returns awaiting_human. Conversation, contextual comments, typed revision feedback and future guidance keep their existing authority.

## Renderer

renderer.mjs accepts an already negotiated @commentary-dev/tracker-sdk controller, checks protocol/capabilities, reads bounded records and destroys the controller. Native fallback is explicit. The app SDK/security tests own actual window/origin/nonce attack enforcement; fixture controller tests do not prove deployed origin isolation.

Core workflows remain Free. Renderer hosting/writeback/advanced evidence remain available Pro-preview without billing; discovered authorization and operational limits still apply.

## Fixture boundaries and real bindings

makeAdapter requires a validator compiled from canonical/deployed operation schemas. The run.mjs trace deliberately passes an explicit no-op validator because it is a transport fixture; it cannot validate real data or claim a hosted result. App test/project-technical-skills-contract.test.ts validates every fixture input against CP-033; scripts/project-skills-smoke.ts executes installed portable copies with the actual validator.

The PM fixture demonstrates a new initiative. For an existing project id, get that authorized Project instead of createProject. Before resources_link independently read the original Resource and refetch the Project ETag. Read actual returned tracker/schema/record ids. Never send the literal fixture ids to a live deployment.

The feedback trace assumes upload-2 is already finalized. A live adapter must first read Package/Session and exact native comments; prepare/transfer/finalize the correction; then sync with explicit --package and --etag (or previously acknowledged metadata). Get the ready Package revision/digest, replace only its corresponding Session target while preserving all other targets, refetch the Session before revise, then refetch again before acceptance_request. Copy target.sessionRevisionId, manifestSha256 and revisionSetFingerprint from the server, never compute or reuse the fixture fingerprints. Old acceptance remains historical. Conversation and future guidance alone do not warrant changing the proposal.

editRendererRecord uses getRecord's ETag and schema revision for patchRecord, preserving path diagnostics and draft on failure. watchRenderer uses the SDK's bounded polling and a finite foreground timer; gaps refetch schema/permissions/views/query. The host owns identity/nonce/origin enforcement, not the example controller.

## Bounded feedback turns

feedback.mjs exports networkAdapter for host-side HTTP, stateless MCP tools/call and an injected installed-CLI runner, plus feedbackTurn for one foreground PM/engineering correction. Discovery and canonical validation are required callbacks. The CLI runner accepts argv/structured stdin without a shell and receives the host credential separately; set it via environment, never logs or renderer messages.

The native feedback reader fetches current authorized threads with bounded pages and selects actionable unresolved feedback; events are hints, not content or approval. The correction publisher must finalize upload, wait for a ready immutable revision and recover its idempotency receipt after timeout. Return the actual exact target. The turn retains unaffected Session targets, refetches the current manifest/ETag and requests an eligible human Decision. It never creates a Decision or resolves another author's thread.

WorkflowError.recovery retains phase/cursor and asks for refetch. Keep it private; reconnect with current credentials/capabilities and reconcile current state before continuing. A pre-write timeout continuation is tested; unknown outcomes after a sent write require durable receipt reconciliation, not blind changed-intent retries. The canonical event_cursor_resync_required diagnostic triggers bounded native snapshot retrieval. A caller's operation key denotes exact intent; use a fresh key after explicit changed-intent reconciliation.

fixture-server.mjs is a short-lived loopback fixture, not the product service or an authorizer. Feedback tests execute HTTP/MCP wire loops and injected CLI failure paths. Commentary project-skills-smoke executes real installed CLI commands against this fixture and validates canonical request schemas. Neither test proves hosted persistence or native plugin installation. Test responses are illustrative, not full output-schema fixtures.
