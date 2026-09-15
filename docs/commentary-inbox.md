# Commentary Inbox and Workspace skills

The `commentary-inbox` plugin packages eight portable skills:

| Skill | Purpose |
| --- | --- |
| `commentary-ask-human` | Durable questions and choices when chat or ephemeral Elicitation is insufficient |
| `commentary-request-approval` | Exact immutable action approval and current team-policy satisfaction |
| `commentary-submit-revision` | Revision-bound corrections with fresh action approvals |
| `commentary-escalate-review` | Human-confirmed canonical full Review handoff |
| `commentary-async-workflow` | Messages, guidance, bounded waits, continuation and honest Fulfillment |
| [Commentary Inbox Triage](commentary-inbox-triage.md) | Inspect attention and route work to its canonical Resource |
| [Commentary Workspace](commentary-workspace.md) | Granted workspace discovery, queues, linking and authorized rename |
| [Design Effective Interactions](design-effective-interactions.md) | Clear requests, meaningful choices and proportional consequences |

## Product model

Inbox is the account-level attention feed; Workspace is a separate personal/team workbench. Agent discovery is restricted to the credential's granted workspace, not the whole browser account. Sources are linked content and provider connections, not workspace identity.

Requested actions capture exact Decisions for this instance. Reply discusses this instance. Teach this agent delivers future-facing guidance without changing its task. Acknowledgment means receipt, not learning or application. Human response completion, whole team-chain completion, lifecycle and reported execution remain distinct.

Active and History organize attention. Read, snooze, dismissal and assignment do not approve, reject, cancel or grant source access. Full Review remains the canonical artifact surface; corrections return through immutable request revisions.

## Install and compatibility

Use marketplace commands in the README or install a canonical `skills/` folder directly. Generated wrappers target Codex, Claude Code and GitHub Copilot; canonical skills also target OpenClaw and compatible hosts. Generic MCP clients use `https://commentary.dev/mcp` and discovered consolidated tools.

Choose the available CLI, MCP or HTTP operation; these transports do not expose identical actions or JSON shapes. Discover configured-server OpenAPI/OAuth scopes and MCP input schemas, and check installed CLI subcommand help. New public Inbox/Workspace operations or current-policy approval waits may be missing on an older deployment. Capability discovery, not version strings alone, determines availability.

External request creation addresses the credential owner. Workspace membership, token grant, source access, owner/creator authority and approval roles are separate checks. Existing configured credentials stay secret; request only advertised scopes needed for the task. Commentary owns licensing/no-billing notices; skills do not enforce tiers.

## Execution and verification

Agents cannot write human Decisions, self-approve, use acknowledgments as approval, or reuse superseded approvals. Current-policy approval reads must establish exact revision/action/fingerprint, expiry, revocation and team-chain satisfaction. MCP raw receipts alone do not establish this.

Review escalation, human feedback/guidance authoring and reply editing remain human browser actions. A Review's artifact acceptance does not approve its external consequence. External execution requires established exact-action authorization and a configured connector.

Fulfillment is append-only, self-reported and unverified. First report `received`, then `started` and an honest permitted outcome. Timeout returns the durable handle rather than approval or cancellation.

`examples/agent-inbox/` demonstrates fixture and HTTP continuation with no external execution. Its tests include stale-action/revision checks, informational responses, pending policies, retry hints, exact ETags and report ordering. Forward-test catalog validation does not itself run a behavioral agent evaluation.

Generated manifests and plugin copies come from catalogs and canonical skills. Regenerate deterministically and run `npm run verify` before handoff.
