# Commentary Form Creation Skill

`commentary-form-creation` teaches agents how to design and create source-authored Commentary Forms.

## What It Does

The skill guides an agent through:

- identifying whether the current workspace already contains source-backed form definitions or git result files
- designing useful form questions, field types, required fields, validation rules, and conditional logic
- authoring Form Contract v1 YAML or JSON
- validating contracts with the `commentary_forms` MCP tool
- creating draft-backed form files through the `draft_review` MCP tool when no local form repo exists
- creating response links from accessible source-backed forms

## Primary Workflow

1. Inspect the current folder for `forms/*.form.yaml`, `forms/*.form.yml`, `forms/*.form.json`, and canonical result files.
2. Choose local source-backed authoring or MCP draft-backed authoring.
3. Design the question set and validation rules before writing the contract.
4. Author a deterministic Form Contract v1 file.
5. Validate through `commentary_forms validate_contract`.
6. Use Draft Review workflows when reviewers should comment on the structure before the form is finalized.

## Install Source

The canonical skill folder is:

```text
skills/commentary-form-creation/
```

Plugin wrappers copy this skill into generated Claude Code, GitHub Copilot CLI, and Codex bundles.
