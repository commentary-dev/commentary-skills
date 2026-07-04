# Contributing

This repository distributes Commentary agent skills. Keep changes public-safe and focused on reusable agent behavior.

## Skill Changes

- Edit canonical skill content under `skills/`.
- Keep each `SKILL.md` concise and portable.
- Put reusable detail in `references/`, executable helpers in `scripts/`, and templates in `assets/` only when needed.
- Do not add per-skill README files or process notes.
- Keep `agents/openai.yaml` aligned with the skill purpose.

## Generated Files

Generated marketplace artifacts are committed for direct installation:

- `.claude-plugin/marketplace.json`
- `.github/plugin/marketplace.json`
- `.agents/plugins/marketplace.json`
- `plugins/*/plugin.json`
- `plugins/*/.claude-plugin/plugin.json`
- `plugins/*/.codex-plugin/plugin.json`
- `plugins/*/.mcp.json`
- `plugins/*/skills/*`
- `dist/catalog.json`
- `dist/skills-index.md`

Do not hand-edit generated files. Run:

```bash
npm run generate
npm run verify
```
