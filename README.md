# Commentary Skills

Portable agent skills and marketplace metadata for Commentary.

This repository is the canonical source for Commentary agent skills. The skills teach agents how to use Commentary for live collaborative review of Markdown, MDX, HTML, plain text, Live Preview Reviews, Brainstorming Reviews, and source-authored Commentary Forms.

## What Is Commentary?

[Commentary](https://commentary.dev) is a GitHub-native review workspace for documents, structured Forms, and live web app previews. It supports Markdown specs, ADRs, rollout plans, READMEs, docs, Form Contract files, and opt-in Live Preview Reviews for browser apps instrumented with the Commentary review SDK.

## Install

Codex and other `SKILL.md`-compatible agents can consume skill folders directly:

```bash
git clone https://github.com/commentary-dev/commentary-skills.git
```

Then install or copy the desired folder from `skills/` into the skill directory for your agent.

GitHub Copilot cloud agent users can install individual skills with GitHub CLI 2.90.0 or later:

```bash
gh skill preview commentary-dev/commentary-skills commentary-draft-review
gh skill install commentary-dev/commentary-skills commentary-draft-review
gh skill preview commentary-dev/commentary-skills commentary-brainstorm-review
gh skill install commentary-dev/commentary-skills commentary-brainstorm-review
gh skill preview commentary-dev/commentary-skills commentary-live-preview-review
gh skill install commentary-dev/commentary-skills commentary-live-preview-review
gh skill preview commentary-dev/commentary-skills commentary-form-creation
gh skill install commentary-dev/commentary-skills commentary-form-creation
gh skill preview commentary-dev/commentary-skills commentary-form-design
gh skill install commentary-dev/commentary-skills commentary-form-design
gh skill preview commentary-dev/commentary-skills commentary-form-results
gh skill install commentary-dev/commentary-skills commentary-form-results
gh skill preview commentary-dev/commentary-skills commentary-form-result-visualizations
gh skill install commentary-dev/commentary-skills commentary-form-result-visualizations
```

GitHub Copilot CLI users can install plugin bundles from this repository marketplace:

```bash
copilot plugin marketplace add commentary-dev/commentary-skills
copilot plugin install commentary-review@commentary-skills
copilot plugin install commentary-forms@commentary-skills
```

GitHub Copilot skill publishing is driven from `skills/*` and release automation in this repository. GitHub Copilot CLI plugin discovery is driven from `.github/plugin/marketplace.json`.

Claude Code users can add this repository as a plugin marketplace and install plugin bundles:

```text
/plugin marketplace add commentary-dev/commentary-skills
/plugin install commentary-review@commentary-skills
/plugin install commentary-forms@commentary-skills
```

Codex plugin users can use the Codex marketplace metadata generated at `.agents/plugins/marketplace.json`:

```bash
codex plugin marketplace add commentary-dev/commentary-skills
codex plugin add commentary-review@commentary-skills
codex plugin add commentary-forms@commentary-skills
```

## Skills

- [Commentary Brainstorm Review](docs/commentary-brainstorm-review.md): Apply accepted consensus changes from Commentary Brainstorming Reviews through MCP-only or local file-backed workflows.
- [Commentary Draft Review](docs/commentary-draft-review.md): Use the Commentary CLI for live collaborative review of local Markdown, MDX, HTML, and plain text artifacts.
- [Commentary Live Preview Review](docs/commentary-live-preview-review.md): Set up Commentary Live Preview Reviews and address selected-element comments on live web apps.
- [Commentary Form Creation](docs/commentary-form-creation.md): Design and create Commentary Form Contract v1 forms.
- [Commentary Form Design](docs/commentary-form-design.md): Build rich Markdown, MDX, HTML, and custom renderer form experiences.
- [Commentary Form Results](docs/commentary-form-results.md): Fetch, poll, normalize, export, and sync Commentary Forms results.
- [Commentary Form Result Visualizations](docs/commentary-form-result-visualizations.md): Create accessible visualizations from Commentary Forms results.

## Plugins

- `commentary-review`: Review skills for Draft Reviews, Brainstorming Reviews, and Live Preview Reviews.
- `commentary-forms`: Forms skills for creation, visual design, result processing, and visualization.

## Repository Layout

```text
catalog/                              Human-edited skill and plugin metadata
docs/                                 Human-facing skill documentation
skills/commentary-brainstorm-review/  Canonical portable brainstorming skill
skills/commentary-draft-review/       Canonical portable draft review skill
skills/commentary-live-preview-review/ Canonical portable live preview review skill
skills/commentary-form-*/             Canonical portable Forms skills
plugins/*/                            Generated Copilot CLI, Claude Code, and Codex plugin wrappers
.github/plugin/marketplace.json       Generated GitHub Copilot CLI marketplace manifest
.claude-plugin/marketplace.json       Generated Claude marketplace manifest
.agents/plugins/marketplace.json      Generated Codex marketplace manifest
dist/                                 Generated marketplace indexes
scripts/                              Validation and generation scripts
```

Generated files are committed because they are required for direct installation on some platforms. Do not hand-edit generated plugin copies or `dist` files; update the canonical skill or catalog and run:

```bash
npm run generate
```

Generated install files include:

- `.github/plugin/marketplace.json` for GitHub Copilot CLI marketplace installs.
- `.claude-plugin/marketplace.json` for Claude Code marketplace installs.
- `.agents/plugins/marketplace.json` for Codex marketplace installs.
- `plugins/<name>/plugin.json` for GitHub Copilot CLI plugin installs.
- `plugins/<name>/.claude-plugin/plugin.json` for Claude Code plugin installs.
- `plugins/<name>/.codex-plugin/plugin.json` for Codex plugin installs.
- `plugins/<name>/.mcp.json` for the Commentary MCP server.
- `plugins/<name>/skills/*/` as plugin-local generated skill copies.

## Development

Use Node 22 or newer.

```bash
npm install
npm run verify
```

`npm run verify` validates the skill, catalogs, generated artifacts, public-safety rules, and basic formatting.
