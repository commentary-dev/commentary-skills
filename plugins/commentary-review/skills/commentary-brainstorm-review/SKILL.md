---
name: commentary-brainstorm-review
description: Use Commentary Brainstorming Reviews from an agent to monitor multi-user consensus, apply accepted changes to reviewed pages, and mark brainstorming threads addressed. Trigger this skill when a user mentions Commentary brainstorming, consensus review, voting on draft changes, accepted consensus, brainstorm status, brainstorm next, applying agreed changes, or when an agent must choose between a remote MCP-only Commentary review and a local file-backed Commentary review using the CLI.
---

# Commentary Brainstorm Review

Use this skill when a Commentary review is in brainstorming mode: multiple users discuss possible changes, cast signals or votes, and the agent updates the reviewed pages only after consensus reaches an actionable state.

Read `references/operating-surfaces.md` before choosing the remote MCP or local CLI branch.

The business logic is the same for every environment. Choose the technical branch based on the available editing surface:

- **Remote MCP-only**: no local filesystem access, no CLI, and Commentary is the only source of truth.
- **Local mirror**: local Markdown, MDX, HTML, plain text, or directory contents mirror the review and can be edited directly.

## Shared Consensus Rules

Before changing content, inspect the brainstorming status and consensus rule. Process only threads whose consensus state is `accepted_for_change`.

Do not apply threads in these states:

- `pending`
- `blocked`
- `needs_owner_decision`
- `rejected`
- `out_of_scope`
- `applied`
- `resolved`

Do not set agreement, objection, blocker, clarification, or owner-decision signals unless the user explicitly asks the agent to participate in voting or ownership decisions. By default, the agent is the implementer after consensus, not a voter.

When accepted threads conflict, stop and ask the user or review owner for direction instead of guessing. When accepted threads touch independent parts of the same page, batch them into one revision and address every included thread in the upload metadata.

After applying an accepted change:

1. Upload the changed page content as a new review revision.
2. Mark the accepted brainstorming thread addressed with the platform's brainstorming addressed mechanism.
3. Include a concise revision message that states the accepted consensus was applied.

## Branch Selection

Use the remote MCP-only branch when the user says there is no local copy, the agent is operating in a cloud environment without filesystem access, or the user explicitly says Commentary is the only source of truth.

Use the local mirror branch when local files exist, the user names local paths, or the workspace has `.commentary/session.json` for the target review. In this branch, local files are the editing surface and the Commentary CLI is preferred because it manages session metadata, changed-file detection, uploads, and brainstorming thread addressing.

Never send the same mutation through both branches. A CLI-to-MCP handoff is allowed only when each interface owns a distinct operation and both can verify the exact session. If MCP cannot see a CLI-created review, or the CLI cannot restore the remote review, treat it as an auth or resource mismatch and keep using the branch that can access the review. Before addressing a thread or continuing downstream work, inspect its authorship, consensus state, and approval-gate state when a gate is configured.

## Remote MCP-Only Branch

Use only the authenticated Commentary MCP server at `https://commentary.dev/mcp`. Do not use local paths, shell commands, direct API requests, or the CLI in this branch.

At runtime, inspect the connected MCP tools before acting. The MCP surface must expose enough functionality to:

- read the draft review session and its current documents,
- read brainstorming or comment threads with consensus state,
- upload literal UTF-8 page content as a new revision,
- mark one or more accepted brainstorming threads addressed.

If the MCP server does not expose these operations, fail loudly and tell the user the remote-only skill cannot safely apply brainstorming consensus with the currently connected tools. Do not fall back to local files, the CLI, or ad hoc HTTP calls.

Remote workflow:

1. Read the target draft review by session id or review URL.
2. Confirm the review is in brainstorming mode.
3. Read the consensus rule and current brainstorming status.
4. Fetch the next `accepted_for_change` thread, including page path, anchor or selected text, discussion summary, requested change, and any blocking signals.
5. Fetch the current page contents from Commentary through MCP.
6. Edit the literal page content in memory.
7. Upload a revision containing the changed page contents and the addressed thread id.
8. Re-read status and continue until no accepted threads remain, the user stops the loop, or a conflict requires owner direction.

Remote source-of-truth rules:

- Treat Commentary content as authoritative.
- Never claim to edit or inspect a local file.
- Never invent file contents from path names or anchors; fetch the full current page content before editing.
- Preserve unchanged reviewed pages unless the accepted thread requires a cross-page update.

## Local Mirror Branch

Resolve the Commentary CLI command runner in this order:

1. Use `commentary` when `commentary --help` succeeds.
2. Use the project-local binary when present:
   - POSIX: `./node_modules/.bin/commentary`
   - Windows PowerShell: `.\node_modules\.bin\commentary.cmd`
3. Otherwise use `npx -y @commentary-dev/cli`.

Use `--json` whenever command output will be parsed by the agent.

### Authentication

Check auth before creating, restoring, or reading reviews:

```bash
commentary whoami --json
```

If authentication is missing, help the user authenticate without storing secrets:

```bash
commentary login --no-open
```

Use `COMMENTARY_TOKEN` for automation when the user supplies a token for that purpose. Never write tokens, share links, private review URLs, reviewer emails, or customer content into repo files, skill memory, or comments.

### Start Or Restore A Brainstorming Review

For a new local brainstorming review:

```bash
commentary review ./docs/spec.md --mode brainstorming --title "Product spec" --git-base auto
```

For a directory review, use `--root`, `--include`, and `--exclude` so only intended supported files are tracked.

For an existing linked draft review that should become a brainstorming review:

```bash
commentary brainstorm enable --json
```

When the user provides only a session id and local files are present, restore safely first:

```bash
commentary restore <session-id> --dry-run --json
```

Then restore only after confirming the target review and local root are correct:

```bash
commentary restore <session-id>
```

Use `--no-sync` when restoring metadata only. Use `--yes` only when intentionally replacing existing local session metadata.

### Consensus Loop

Inspect the current rule and status:

```bash
commentary brainstorm rule --json
commentary brainstorm status --json
```

Wait for accepted consensus with short bounded waits:

```bash
commentary brainstorm next --consensus-state accepted_for_change --timeout 60s --json
```

When an accepted thread arrives:

1. Inspect the thread id, consensus state, file path, selected text or anchor, discussion summary, and requested change.
2. Edit the local file or files directly.
3. Run a dry-run sync when useful to confirm the changed paths:

   ```bash
   commentary sync --dry-run --json
   ```

4. Upload the revision and attach every addressed brainstorming thread id:

   ```bash
   commentary sync --message "Apply brainstorming consensus" --addressed-thread <thread-id>
   ```

5. Re-check brainstorming status and continue.

For multiple accepted threads in one revision, repeat `--addressed-thread`:

```bash
commentary sync --message "Apply brainstorming consensus" --addressed-thread <thread-a> --addressed-thread <thread-b>
```

Use `commentary brainstorm next --consensus-state blocked --timeout 60s --json` only when the user asks the agent to monitor blocked work or summarize what prevents consensus.

### Signals And Owner Decisions

Use these commands only when the user explicitly asks the agent to participate in voting or make an owner decision:

```bash
commentary brainstorm signal <thread-id> agree --alias "Docs agent"
commentary brainstorm signal <thread-id> object --alias "Docs agent"
commentary brainstorm signal <thread-id> blocker --alias "Docs agent"
commentary brainstorm signal <thread-id> needs_clarification --alias "Docs agent"
commentary brainstorm decide <thread-id> accepted_for_change --reason "Owner approved this change."
commentary brainstorm decide <thread-id> rejected --reason "Owner rejected this change."
```

The `addressed` signal is owner-only. Prefer `commentary sync --addressed-thread <thread-id>` after applying content changes instead of setting `addressed` manually.

### Pulling Remote Content Into The Mirror

Prefer editing local files and syncing revisions. Use `pull` only when the user asks to bring Commentary-side content back to disk or the local mirror is stale.

Start safely:

```bash
commentary pull --dry-run
```

Then choose a non-destructive option unless the user explicitly wants overwrites:

```bash
commentary pull --output reviewed
commentary pull --backup --yes
```

## Operational Guardrails

- Keep the same consensus business logic in both branches.
- Use Commentary for review transport and consensus state; do not create git branches, commits, pull requests, or provider reviews unless the user separately asks.
- Preserve `.commentary/session.json`; it stores review metadata but must never contain secrets.
- Do not store private review URLs, reviewer identities, access grants, or brainstorming decisions in repository files unless the user explicitly asks to document them.
- Respect draft-review limits: at most 20 files, 512 KiB per file, and 2 MiB total per revision.
- Stop the loop promptly when the user says the brainstorming review is done, paused, or no longer needs agent changes.
