# Commentary Inbox skills

The `commentary-inbox` plugin packages five portable skills for durable human-in-the-loop work:

- `commentary-ask-human` creates a durable question only when chat or ephemeral MCP Elicitation is insufficient.
- `commentary-request-approval` binds an authorized human Decision to an immutable proposal, exact consequence, and fingerprint.
- `commentary-submit-revision` turns durable feedback into a new revision and new Decision cycle.
- `commentary-escalate-review` routes blocked or high-impact work to a server-authorized human role without granting authority.
- `commentary-async-workflow` composes bounded polling, revision, external boundaries, and honest fulfillment.

## Install and compatibility

Use the host-specific marketplace commands in the README, or copy a canonical `skills/` folder into any Agent Skills-compatible host. Generic MCP clients configure `https://commentary.dev/mcp` and call consolidated `interaction`; generated `.mcp.json` files contain no credentials. The plugin targets Codex, Claude Code, and GitHub Copilot. Canonical skills also target OpenClaw and compatible hosts.

Use configured Commentary authentication with only required Interaction actions and Resource access. Core/free-preview Interaction, Decision, Feedback, Fulfillment, Escalation, and MCP keys are usable during no-billing preview. Commentary presents any Pro notice; skills do not enforce tiers.

Generated manifests and plugin-local copies come from `catalog/*.yaml` and `skills/*`. Run `npm run generate`; never hand-edit generated copies.

## Safety boundary

Agents cannot write Decisions, self-approve, reuse approval after proposal changes, bypass exact revision checks, or claim fulfillment is verified. Production and other high-impact actions stop before execution unless the exact external action is separately authorized and its connector configured. `examples/agent-inbox/` demonstrates API and MCP flows with no external side effect.
