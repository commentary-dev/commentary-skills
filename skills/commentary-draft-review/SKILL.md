---
name: commentary-draft-review
description: Use Commentary draft reviews from an agent via the Commentary CLI for live collaborative review of Markdown, MDX, HTML, and plain text artifacts. Trigger this skill when a user asks to create, draft, edit, revise, or review a blog post, spec, proposal, report, documentation page, or other text artifact with Commentary; when they mention Commentary draft reviews, live comments, watch-comment, review it with commentary, or using an agent and human reviewer together; and when the agent needs to set up authentication, create/sync/watch a review, read or wait for comments, reply to comments, resolve threads, or decide whether to use the CLI or an already-installed Commentary MCP server.
---

# Commentary Draft Review

Use this skill to collaborate with a human reviewer on local text artifacts through Commentary draft reviews. Keep the local artifact as the source of truth unless the user explicitly asks to pull reviewed content back from Commentary.

## Command Runner

Use the Commentary CLI by resolving a command runner in this order:

1. Use `commentary` when `commentary --help` succeeds.
2. Use the project-local binary when present:
   - POSIX: `./node_modules/.bin/commentary`
   - Windows PowerShell: `.\node_modules\.bin\commentary.cmd`
3. Otherwise use `npx -y @commentary-dev/cli`.

In examples below, replace `commentary` with the resolved runner. Prefer `--json` when the output will be parsed by the agent.

## Authentication

Check auth before creating or reading reviews:

```bash
commentary whoami --json
```

If authentication is missing or invalid, help the user authenticate without storing secrets in the repo:

```bash
commentary login --no-open
```

Use `commentary login --token <token>` only when the user provides a token directly for that purpose. For automation, prefer an environment variable:

```bash
COMMENTARY_TOKEN=<token> commentary whoami --json
```

Never write tokens into project files, `.commentary/session.json`, source files, docs, shell history snippets, or skill memory.

## Alias And Memory

Give yourself a stable, human-readable alias before replying or resolving comments, for example `Docs agent`, `Draft agent`, or a name based on the artifact. If the platform supports memory, remember the alias for future Commentary sessions. If memory is unavailable, keep it in the current conversation and pass it explicitly:

```bash
commentary reply <thread-id> "Updated this in revision 2." --alias "Docs agent"
commentary resolve <thread-id> --message "Addressed in revision 2." --alias "Docs agent"
```

For repeated shell commands in one session, set `COMMENTARY_AGENT_ALIAS` instead of repeating `--alias`.

## New Review Flow

When the user asks to create an artifact and review it with Commentary:

1. Create or update the local Markdown, MDX, HTML, or text artifact first.
2. If git is available and the workspace is inside a GitHub-backed git repository, default single-file reviews to a real Commentary GitHub base by using `--git-base auto`. This infers the GitHub owner/repo from the local `origin` remote, uses `HEAD`, and uses the repository-relative file path.

   ```bash
   commentary review ./docs/spec.md --title "Product spec" --git-base auto
   ```

   If auto-detection is unavailable but the user provides exact GitHub metadata, use `--git-base-repo <owner/repo>` and `--git-base-sha <sha>`. If no real GitHub base can be resolved, omit git base options and state that no real GitHub base was set. Do not fake this with description text. Do not create branches, commits, pull requests, or provider reviews.

3. Create the review:

   ```bash
   commentary review ./docs/spec.md --title "Product spec" --git-base auto
   ```

4. Share the review URL with the user if the CLI prints one or if `commentary open` is needed in a headless environment.
5. For ongoing sync, either start with `--watch`:

   ```bash
   commentary review ./docs/spec.md --title "Product spec" --git-base auto --watch
   ```

   or create the review once and run:

   ```bash
   commentary watch
   ```

Use `--root`, `--include`, and `--exclude` when reviewing a directory so the review contains only intended supported files.

If a reviewer asks for a new file to be included in an existing review, create the local file and add it to the same review:

```bash
commentary track ./docs/new-page.md --message "Add requested page"
```

Use `track` instead of creating a second review. It uploads a full revision containing the existing tracked files and the new files, then updates `.commentary/session.json`.

## Comment Loop

For existing comments, read open threads:

```bash
commentary comments --format markdown --open
```

For live collaboration, use `next-comment`. It starts the live event stream, checks currently open threads, and waits only when no open threads exist:

```bash
commentary next-comment --timeout 60s --json
```

Use narrower waits when helpful:

```bash
commentary next-comment --file docs/spec.md --timeout 60s --json
commentary next-comment --no-include-replies --json
```

Use short bounded waits for interactive agent loops so the agent can stop promptly when the user says to stop. Use longer waits such as `--timeout 15m` only when the user explicitly asks for unattended listening.

`wait-comment` is future-event-only by default. It is not a substitute for checking open threads and should be used only when the workflow specifically needs a future live event cursor.

For a dedicated background-style listener, use cooperative stop-file support:

```bash
commentary comments --watch --jsonl
commentary comments --stop
```

Run `comments --stop` instead of killing processes manually. If using a custom stop file, pass the same `--stop-file <path>` to both commands.

When a comment arrives:

1. Inspect the thread id, file path, selected text, line hints, and comment body.
2. Edit the local file to address the request.
3. Upload a new revision:

   ```bash
   commentary sync --message "Address review comments"
   ```

4. Resolve only when the requested change is fully addressed, and include the final visible response in the resolve command:

   ```bash
   commentary resolve <thread-id> --message "Updated the introduction and synced revision 2." --alias "Docs agent"
   ```

Use `commentary reply` only for non-final progress updates or follow-up discussion, because replies can reopen resolved threads.

Keep repeating short `next-comment --timeout 60s --json` waits, edit, `sync` or `track`, and `resolve --message` until the user says the review is done or there are no open threads.

## Pulling Reviewed Content

Prefer editing local files directly and syncing revisions. Use `pull` only when the user asks to bring Commentary-side content back to disk. Start safely:

```bash
commentary pull --dry-run
```

Then choose a non-destructive option unless the user explicitly wants overwrites:

```bash
commentary pull --output reviewed
commentary pull --backup --yes
```

## CLI Versus MCP

The Commentary CLI is the default for file-backed draft review workflows because it manages `.commentary/session.json`, tracks local files, syncs revisions, watches file changes, and streams live comment events.

If a Commentary MCP server is already installed and exposes equivalent draft-review tools, prefer MCP only for typed, in-process operations that do not need local file watching or project metadata, such as listing or replying to comments. Before using MCP against a CLI-created review, verify that MCP can read the exact draft review session id. If MCP reports "Draft review not found" while the CLI can access the same session, treat it as an auth/resource mismatch and continue CLI-only. Do not mix surfaces for that session. Do not require, install, or configure MCP for this skill. Fall back to the CLI whenever MCP is unavailable, incomplete, ambiguous, or not explicitly connected to the current local files.

## Operational Guardrails

- Keep the CLI thin: use Commentary for review transport, not for git branching or commits.
- Use `--git-base auto` or explicit git base flags for real GitHub base metadata; do not put `Base commit: <sha>` in the description as a substitute.
- Use `--json` for automation and stable parsing.
- Use `--dry-run` before potentially overwriting local files.
- Do not print spinners or rely on interactive prompts in non-TTY automation.
- Prefer short bounded waits for interactive agent sessions; use `comments --watch --jsonl` plus `comments --stop` for long-running listeners.
- Preserve `.commentary/session.json`; it stores review metadata but must never contain secrets.
- Respect draft-review limits: at most 20 files, 512 KiB per file, and 2 MiB total per revision.
