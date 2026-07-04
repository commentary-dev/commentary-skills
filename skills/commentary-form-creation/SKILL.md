---
name: commentary-form-creation
description: Design and create Commentary Forms from an agent. Use when a user wants to create, validate, revise, or review a Commentary Form Contract v1 YAML or JSON definition; choose form questions, field types, validations, conditional logic, required fields, response links, or draft-backed form authoring; detect whether a local git repo already contains forms or form results; use Commentary MCP draft_review and commentary_forms tools when no local source-backed form repo is available; or coordinate form drafts with Commentary Draft Review workflows.
---

# Commentary Form Creation

Use this skill to help users design useful structured forms and create valid Commentary Form Contract v1 source artifacts.

## First Checks

1. Inspect the current folder before choosing a creation path.
2. If it is a git repo containing `forms/*.form.yaml`, `forms/*.form.yml`, `forms/*.form.json`, or `forms/results/**/**/*.result.json`, treat local files as the source-backed workflow.
3. If no local source-backed form repo is found, default to Commentary MCP with `draft_review` for authoring and `commentary_forms` for validation and form operations.
4. If a local `.commentary/session.json` exists for a draft review, prefer the draft review workflow and preserve that session.

Do not call `commentary_forms` with `create` or `update` for normal authoring. Standalone Forms API creation/editing is removed. Create or edit form source files through git-backed artifacts or draft review files.

## Design The Form Before Writing YAML

Start with the business decision the form supports. Ask only for fields that change routing, validation, approval, reporting, or follow-up work.

Use this checklist:

- Define the audience, submission context, owner, and expected number of submissions.
- Separate required decision fields from helpful optional context.
- Prefer one clear question per field; avoid double-barreled prompts.
- Choose closed options when results will be aggregated; choose text areas only for narrative evidence.
- Add validation that prevents unusable answers: length limits, numeric bounds, enum options, required fields, and patterns only when they are explainable.
- Add conditional requirements only when they reduce burden or prevent incomplete follow-up.
- Plan result access and privacy before collecting sensitive values.

For detailed question and validation guidance, read `references/form-best-practices.md`.
For the contract fields and examples, read `references/contract-v1.md`.

## Local Source-Backed Workflow

Use local files when the repo is the intended source of truth.

1. Create standalone forms under `forms/<stable-name>.form.yaml` unless the user asks for JSON.
2. Use stable ASCII ids such as `security.review` or `release-readiness`.
3. Keep `schema.additionalProperties: false` for ordinary object forms.
4. Include `submit.destinations` with `{ kind: commentary, enabled: true }`.
5. Validate the source through MCP when available:

```json
{
  "action": "validate_contract",
  "contractSource": "commentaryForm: 1\nid: release-readiness\ntitle: Release readiness\nschema:\n  type: object\n",
  "sourceFormat": "yaml"
}
```

If MCP is unavailable, validate by careful inspection against `references/contract-v1.md` and tell the user validation still needs to run in Commentary.

## MCP Draft-Backed Workflow

Use this path when no local form repo exists or the user wants a form draft before committing source.

1. Author a complete YAML contract in memory.
2. Validate it with `commentary_forms` `validate_contract`.
3. Create a draft review file with `draft_review`:

```json
{
  "action": "create",
  "title": "Intake form",
  "sourceType": "mcp",
  "files": [
    {
      "path": "forms/intake.form.yaml",
      "content": "commentaryForm: 1\nid: intake.quick\ntitle: Intake\nschema:\n  type: object\n",
      "contentType": "auto"
    }
  ]
}
```

4. Share the draft review URL if the MCP response includes one.
5. If the user wants review comments on structure, use `commentary-draft-review` against the draft review rather than creating a second review surface.

## Response Links

Create response links only from an accessible source-backed form.

Use `commentary_forms` `create_fillout_link` with:

- `formId` or `referenceId`
- `sourceContext` when the token is review-scoped or the form is embedded
- `shareMode`: `specific_user`, `authenticated`, or `anonymous`
- `replyMode`: `identified` or `anonymous`
- `repeatSubmissions` based on the business rule

Do not use anonymous links for sensitive data unless the user explicitly accepts anonymous replies and result ownership constraints.

## Guardrails

- Treat server validation as authoritative.
- Do not store tokens, private review URLs, reviewer identities, customer submissions, or local machine paths in repo files.
- Do not invent source permissions in `sourceContext`; Commentary derives trusted result access server-side.
- Keep forms source-authored: git files, Markdown/HTML embeds, draft review files, response links, or custom renderer submissions.
- Keep generated YAML deterministic and stable so diffs are reviewable.
