# AGENTS.md

## Repo Intent

This repository is the public marketplace and canonical source for Commentary agent skills. It currently ships one skill: `commentary-draft-review`.

## Product Boundaries

- Keep `skills/*` as the canonical source for portable skills.
- Keep generated Claude plugin skill copies in sync with canonical skills.
- Do not add new skills unless the user explicitly asks for them.
- Do not model `commentary-draft-review` as a mirror of `commentary-cli`; ownership has moved here.
- Do not store secrets, private review URLs, local machine paths, customer content, or private Commentary implementation details.

## Implementation Standards

- Use Node 22 or newer.
- Use npm and dependency-free Node scripts unless a dependency is clearly justified.
- Keep generated artifacts deterministic.
- Prefer validation that fails loudly over silent best-effort generation.
- Preserve `SKILL.md` portability across Codex, Copilot, Claude Code, OpenClaw, and other Agent Skills-compatible tools.
- Run `npm run verify` before handoff.

