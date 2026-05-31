# Commentary Brainstorm Review Skill

`commentary-brainstorm-review` teaches agents how to work on Commentary Brainstorming Reviews after a group reaches consensus.

## What It Does

The skill guides an agent through the consensus-to-implementation loop:

- inspect brainstorming status and consensus rules
- wait for accepted consensus threads
- apply accepted changes to reviewed pages
- upload a new revision
- mark addressed brainstorming threads through Commentary
- handle either a remote MCP-only review or a local file-backed review

The agent does not apply pending, blocked, rejected, out-of-scope, or owner-decision-needed threads. It does not vote or make owner decisions unless the user explicitly asks it to do so.

## Usage Patterns

### Remote MCP-only

Use this pattern when there is no local copy of the draft or the agent has no filesystem access. The agent uses only an authenticated Commentary MCP connection to `https://commentary.dev/mcp`; Commentary is the source of truth.

Example request:

```text
Use $commentary-brainstorm-review for Commentary session dr_123 through MCP only. Apply accepted consensus changes and do not read or write local files.
```

The MCP server must expose tools for reading the review, reading brainstorming consensus state, uploading literal page content, and marking accepted threads addressed. If those tools are unavailable, the agent should stop instead of falling back to local files or direct API calls.

### Local Mirror

Use this pattern when local Markdown, MDX, HTML, or text files mirror the review. The agent edits local files and uses the Commentary CLI to sync revisions and attach addressed brainstorming thread ids.

Example request:

```text
Use $commentary-brainstorm-review on docs/spec.md. Start a brainstorming review and apply accepted consensus changes as they arrive.
```

Core CLI loop:

```bash
commentary review ./docs/spec.md --mode brainstorming --title "Product spec" --git-base auto
commentary brainstorm status --json
commentary brainstorm next --consensus-state accepted_for_change --timeout 60s --json
commentary sync --message "Apply brainstorming consensus" --addressed-thread <thread-id>
```

## Install Source

The canonical skill folder is:

```text
skills/commentary-brainstorm-review/
```

Platform plugin wrappers copy this skill into their generated install bundles.
