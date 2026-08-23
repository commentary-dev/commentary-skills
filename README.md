# Commentary Skills

Portable agent skills and marketplace metadata for Commentary.

This repository is the canonical source for Commentary agent skills. Each plugin separates technical skills that operate Commentary from practice skills that improve the plan, form, or research being reviewed.

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
copilot plugin install commentary-research@commentary-skills
```

GitHub Copilot skill publishing is driven from `skills/*` and release automation in this repository. GitHub Copilot CLI plugin discovery is driven from `.github/plugin/marketplace.json`.

Claude Code users can add this repository as a plugin marketplace and install plugin bundles:

```text
/plugin marketplace add commentary-dev/commentary-skills
/plugin install commentary-review@commentary-skills
/plugin install commentary-forms@commentary-skills
/plugin install commentary-research@commentary-skills
```

Codex plugin users can use the Codex marketplace metadata generated at `.agents/plugins/marketplace.json`:

```bash
codex plugin marketplace add commentary-dev/commentary-skills
codex plugin add commentary-review@commentary-skills
codex plugin add commentary-forms@commentary-skills
codex plugin add commentary-research@commentary-skills
```

## Skills

### Technical skills

- [Commentary Draft Review](docs/commentary-draft-review.md), [Brainstorm Review](docs/commentary-brainstorm-review.md), [PR Review](docs/commentary-pr-review.md), and [Live Preview Review](docs/commentary-live-preview-review.md) choose and operate the correct CLI, MCP, or SDK workflow.
- [Commentary Form Creation](docs/commentary-form-creation.md), [Form Rendering](docs/commentary-form-rendering.md), and [Form Results](docs/commentary-form-results.md) implement and operate source-backed Forms, including adaptive respondent instances.
- [Commentary Research Workflow](docs/commentary-research-workflow.md) operates bounded, source-backed Research Studies while preserving human launch, consent, and publication authority.

### Practice skills

- [Review Agentic Plans](docs/review-agentic-plans.md) critiques intent, evidence, tradeoffs, risk, and decision completeness before execution.
- [Design Effective Forms](docs/design-effective-forms.md) improves question quality, accessibility, visual hierarchy, and responsible per-respondent adaptation.
- [Form Result Visualizations](docs/commentary-form-result-visualizations.md) turns permitted result data into accessible explanations.
- [Design Product Research](docs/design-product-research.md) selects credible UX methods and maps them into Commentary's Consent, Content, Activity, Form, and Complete workflow.
- [Commentary Form Design](docs/commentary-form-design.md) remains as a compatibility router to the focused rendering and practice skills.

## Plugins

- `commentary-review`: technical Draft, PR, Brainstorming, and Live Preview workflows plus agentic-plan review practice.
- `commentary-forms`: technical Form creation, rendering, and results plus form-design and visualization practice.
- `commentary-research`: technical Research Study operations plus evidence-centered product-research practice.

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

`npm run verify` validates the skills, catalogs, generated artifacts, public-safety rules, forward-test catalog, and basic formatting. The maintained cases in `evals/forward-tests.json` cover plan critique, CLI/MCP routing, authorship-aware comment handling, accessible and adaptive Forms, typed NN/g-style study design, evidence-led synthesis, and refusal of human-only Research actions.
