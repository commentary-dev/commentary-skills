---
name: commentary-form-creation
description: Create, validate, revise, and publish Commentary Form Contract v1 YAML or JSON through source-backed files, Draft Review, response links, and Commentary MCP. Use for contract mechanics and form operations after the questions and experience are designed; use design-effective-forms for question quality, flow, accessibility, appearance, and adaptive-form judgment.
---

# Commentary Form Creation

Use this skill to create valid Commentary Form Contract v1 source artifacts and operate them through Commentary. For question, flow, visual, or personalization decisions, use `design-effective-forms` first.

## First Checks

1. Inspect the current folder before choosing a creation path.
2. If it is a git repo containing `forms/*.form.yaml`, `forms/*.form.yml`, `forms/*.form.json`, or `forms/results/**/**/*.result.json`, treat local files as the source-backed workflow.
3. If no local source-backed form repo is found, default to Commentary MCP with `draft_review` for authoring and `commentary_forms` for validation and form operations.
4. If a local `.commentary/session.json` exists for a draft review, prefer the draft review workflow and preserve that session.

Do not call `commentary_forms` with `create` or `update` for normal authoring. Standalone Forms API creation/editing is removed. Create or edit form source files through git-backed artifacts or draft review files.

Read `references/contract-v1.md` for contract fields and examples. Read `references/adaptive-forms.md` when a form creates respondent-specific follow-up sections.

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

## Adaptive Respondent Instances

Adaptive Forms do not mutate the shared source contract. The contract opts in with `adaptive.enabled: true` and `adaptive.handoff: mcp_pull_queue`. At a configured boundary, use `commentary_forms` to list and claim the pending transition, then complete it with `show_section`, `complete`, or `fallback`.

Generated sections belong to that submission instance. Use only the bounded answer snapshot and sanitized context returned for the transition. Preserve the audit trail and deterministic fallback. Read `references/adaptive-forms.md` for the action sequence and invariants.

## Guardrails

- Treat server validation as authoritative.
- Do not store tokens, private review URLs, reviewer identities, customer submissions, or local machine paths in repo files.
- Do not invent source permissions in `sourceContext`; Commentary derives trusted result access server-side.
- Keep forms source-authored: git files, Markdown/HTML embeds, draft review files, response links, or custom renderer submissions.
- Keep generated YAML deterministic and stable so diffs are reviewable.
- Pass a stable `agentAlias` on state-changing MCP actions.
- `forms.adaptive_agent` is Pro; do not represent it as part of basic Forms.
