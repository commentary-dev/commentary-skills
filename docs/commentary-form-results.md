# Commentary Form Results Skill

`commentary-form-results` teaches agents how to fetch, poll, normalize, export, and sync Commentary Forms results.

## What It Does

The skill guides an agent through:

- reading results through the `commentary_forms` MCP tool
- processing response-link results and embedded review answers
- discovering and importing canonical git-hosted result files
- writing final submissions back to GitHub when explicitly authorized
- polling for new submissions with bounded loops
- converting result payloads into deterministic JSON, JSONL, or CSV with the bundled normalizer

## Primary Workflow

1. Choose MCP/API retrieval or local canonical git result files.
2. Fetch final submissions and preserve source context.
3. Normalize results into a stable dataset when needed.
4. Export or transform values without fabricating result permissions.
5. Use writeback/import actions only when the user explicitly requests them and the account is authorized.

## Bundled Helper

```bash
node skills/commentary-form-results/scripts/normalize-form-results.mjs results.json --format csv --output results.csv
```

The helper accepts MCP/API envelopes, exported submission payloads, arrays of submissions, and directories of canonical `.result.json` files.

## Install Source

The canonical skill folder is:

```text
skills/commentary-form-results/
```

Plugin wrappers copy this skill into generated Claude Code, GitHub Copilot CLI, and Codex bundles.
