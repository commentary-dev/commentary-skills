# Commentary Form Design Skill

`commentary-form-design` teaches agents how to create polished visual Commentary Forms and form pages.

## What It Does

The skill guides an agent through:

- embedding Forms in Markdown and MDX review documents
- binding static HTML controls with `data-commentary-form` and `data-commentary-field`
- using standalone contract files when native rendering is enough
- using the Commentary Forms SDK bridge for custom Live Preview Review renderers
- improving form layout, microcopy, hierarchy, validation feedback, and accessibility
- coordinating with Draft Review and Live Preview Review workflows for human review

## Primary Workflow

1. Confirm or create the authoritative Form Contract.
2. Choose standalone, Markdown/MDX, static HTML, or custom renderer presentation.
3. Keep validation and required rules in the contract, not duplicated in page code.
4. Add only the explanatory content users need to answer correctly.
5. Validate the contract and inspect rendered review diagnostics.

## Install Source

The canonical skill folder is:

```text
skills/commentary-form-design/
```

Plugin wrappers copy this skill into generated Claude Code, GitHub Copilot CLI, and Codex bundles.
