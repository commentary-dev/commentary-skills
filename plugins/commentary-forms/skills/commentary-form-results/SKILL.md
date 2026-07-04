---
name: commentary-form-results
description: Fetch, poll, process, normalize, export, and sync Commentary Forms results. Use when a user asks to list form submissions, read embedded answers, process response-link results, export form results as JSON YAML CSV JSONL or another structured dataset, poll for new submissions, import or inspect canonical git-hosted result files, write final submissions back to GitHub through Commentary, or transform Commentary Forms result payloads for downstream analysis.
---

# Commentary Form Results

Use this skill to retrieve and process Commentary Forms submissions from MCP/API result collections or canonical git result files.

## Choose The Result Source

1. Inspect the current folder for canonical git result files: `forms/results/<form-file-stem>/*.result.json`.
2. If git result files are present and the user wants local/offline processing, use them as input.
3. Otherwise use the authenticated Commentary MCP tool `commentary_forms`.
4. For live polling, prefer MCP result reads when available; use API Server-Sent Events only when the user has an API token and explicitly needs long-running polling outside MCP.

Read `references/result-workflows.md` before using writeback, import, or polling workflows.

## MCP Retrieval

Use these actions as appropriate:

- `list`: list owned forms for an account-scoped token.
- `list_result_collections`: list result collections the principal may manage.
- `list_submissions`: list submissions for a permitted form result collection.
- `get_submission`: read one submission including values when authorized.
- `export_submission`: get a bounded JSON, YAML, or CSV export for one submission.
- `list_embedded_answers`: read embedded review form answers for a `sourceContext`.
- `list_fillout_results`: read submissions for an owned response link.
- `list_git_results`: discover canonical git-hosted result files.
- `import_git_results`: explicitly import valid git result files.

Raw submitted values require `commentary.forms.read` and result-view permission. Submitters may be able to read their own submission detail without broad result-list access.

## Processing Results

Use the bundled normalizer for deterministic local conversion when results need to become a dataset:

```bash
node skills/commentary-form-results/scripts/normalize-form-results.mjs results.json --format csv --output results.csv
node skills/commentary-form-results/scripts/normalize-form-results.mjs forms/results/security-review --format jsonl --output results.jsonl
```

The script accepts MCP/API JSON envelopes, arrays of submissions, exported submission payloads, and canonical `.result.json` files or directories. It flattens `values` into stable `value.<field>` columns and preserves submission/source metadata.

## Polling For New Results

Use bounded polling in interactive agent sessions:

1. Record known submission ids.
2. Re-run `list_submissions`, `list_embedded_answers`, or `list_fillout_results` with the same source context.
3. Diff by submission id.
4. Process only final submissions unless the user asks for drafts or validation failures.
5. Stop promptly when the user asks.

For long-running external automation, use the Forms API submission event stream. Events are summary-only; call detail retrieval for raw values when authorized.

## Git Result Sync

Canonical git result path:

```text
<form-directory>/results/<form-file-stem>/<submission-or-external-id>.result.json
```

Canonical git result files use `commentaryFormResult: 1` and include form identity, submission metadata, submitter mode, values, validation, source context, and optional summary.

Use MCP writeback/import only when explicitly requested and authorized:

- `git_result_sync_status`
- `preview_result_writeback`
- `writeback_submission`
- `list_git_results`
- `import_git_results`

Writeback requires `commentary.forms.writeback`, the Forms GitHub writeback feature, a configured writeback app, and explicit target repository/branch details.

## Guardrails

- Treat submitted values as customer data, not telemetry.
- Do not print, store, or commit sensitive submissions unless the user explicitly asks for that output.
- Preserve source context and submission ids during transformation.
- Never fabricate result access by adding permission markers to `sourceContext`.
- Prefer deterministic exports and stable column ordering.
