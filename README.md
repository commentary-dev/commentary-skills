# Commentary Skills

Portable agent skills and marketplace metadata for Commentary.

This repository is the canonical source for the `commentary-draft-review` skill. The skill teaches agents how to use the Commentary CLI for live collaborative review of Markdown, MDX, HTML, and plain text artifacts.

## What Is Commentary?

[Commentary](https://commentary.dev) is a GitHub-native document review workspace for Markdown specs, ADRs, rollout plans, READMEs, and docs. It renders documents for reading-first review and keeps comments attached to paragraphs and semantic blocks instead of raw diff lines.

## Install

Codex and other `SKILL.md`-compatible agents can consume the skill folder directly:

```bash
git clone https://github.com/commentary-dev/commentary-skills.git
```

Then install or copy `skills/commentary-draft-review` into the skill directory for your agent.

GitHub Copilot cloud agent users can install the skill with GitHub CLI 2.90.0 or later:

```bash
gh skill preview commentary-dev/commentary-skills commentary-draft-review
gh skill install commentary-dev/commentary-skills commentary-draft-review
```

GitHub Copilot CLI users can install the `commentary-review` plugin from this repository marketplace:

```bash
copilot plugin marketplace add commentary-dev/commentary-skills
copilot plugin install commentary-review@commentary-skills
```

GitHub Copilot skill publishing is driven from `skills/commentary-draft-review` and release automation in this repository. GitHub Copilot CLI plugin discovery is driven from `.github/plugin/marketplace.json`.

Claude Code users can add this repository as a plugin marketplace and install the `commentary-review` plugin:

```text
/plugin marketplace add commentary-dev/commentary-skills
/plugin install commentary-review@commentary-skills
```

## Skills

- [Commentary Draft Review](docs/commentary-draft-review.md): Use the Commentary CLI for live collaborative review of local Markdown, MDX, HTML, and plain text artifacts.

## Repository Layout

```text
catalog/                         Human-edited skill and plugin metadata
docs/                            Human-facing skill documentation
skills/commentary-draft-review/  Canonical portable skill
plugins/commentary-review/       Generated Copilot CLI and Claude Code plugin wrapper
.github/plugin/marketplace.json  Generated GitHub Copilot CLI marketplace manifest
.claude-plugin/marketplace.json  Generated Claude marketplace manifest
dist/                            Generated marketplace indexes
scripts/                         Validation and generation scripts
```

Generated files are committed because they are required for direct installation on some platforms. Do not hand-edit generated plugin copies or `dist` files; update the canonical skill or catalog and run:

```bash
npm run generate
```

Generated install files include:

- `.github/plugin/marketplace.json` for GitHub Copilot CLI marketplace installs.
- `.claude-plugin/marketplace.json` for Claude Code marketplace installs.
- `plugins/commentary-review/plugin.json` for GitHub Copilot CLI plugin installs.
- `plugins/commentary-review/.claude-plugin/plugin.json` for Claude Code plugin installs.
- `plugins/commentary-review/skills/commentary-draft-review/` as the plugin-local generated skill copy.

## Development

Use Node 22 or newer.

```bash
npm install
npm run verify
```

`npm run verify` validates the skill, catalogs, generated artifacts, public-safety rules, and basic formatting.
