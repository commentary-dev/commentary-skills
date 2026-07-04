# Commentary Forms Result Workflows

## Result Access

Result-list access is separate from fill access.

- Draft review form result lists are visible to the draft owner by default.
- PR and branch result lists require trusted source write-permission checks.
- Dedicated response-link result lists belong to the response-link owner by default.
- Submitters can read their own individual submission detail when allowed.
- Result-share links can expose read-only collections according to their configured audience.

## MCP Actions

Read actions:

- `list`
- `list_result_collections`
- `list_submissions`
- `get_submission`
- `export_submission`
- `list_embedded_answers`
- `list_fillout_links`
- `list_fillout_results`
- `destinations`
- `writeback_status`
- `git_result_sync_status`
- `list_git_results`

Write or submit actions:

- `save_draft`
- `submit`
- `create_submission`
- `submit_fillout_link`
- `create_fillout_link`
- `revoke_fillout_link`
- `preview_result_writeback`
- `writeback_form`
- `writeback_submission`
- `import_git_results`

## Source Context

Review-scoped tokens need `sourceContext` for embedded form reads/submissions. Include only factual source identity:

```json
{
  "kind": "markdown",
  "repository": { "provider": "github", "owner": "org", "repo": "repo" },
  "pullRequestNumber": 7,
  "filePath": "docs/security-review.md",
  "formInstanceId": "security-review-main"
}
```

Do not add local paths, private URLs, participant ids, or permission claims.

## Canonical Git Result Shape

```json
{
  "commentaryFormResult": 1,
  "form": {
    "id": "form_123",
    "referenceId": "security.review",
    "sourcePath": "forms/security-review.form.yaml",
    "versionId": "version_123",
    "contractHash": "sha256..."
  },
  "submission": {
    "id": "sub_123",
    "externalId": "sub_123",
    "submittedAt": "2026-06-18T12:00:00.000Z",
    "origin": "web"
  },
  "submitter": { "mode": "identified", "login": "octocat" },
  "values": {},
  "validation": { "valid": true, "diagnostics": [] },
  "sourceContext": {},
  "summary": "Optional human-readable summary."
}
```

YAML with the same object shape may be imported, but Commentary writes JSON.

## Polling

For an agent in conversation, poll with short waits and state what changed. Do not create an unbounded background process unless the user explicitly asks.

For external automation using the HTTP API, the submission event stream returns summary-only events. Raw values require a follow-up detail request and proper `commentary.forms.read` access.
