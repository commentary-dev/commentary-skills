# Research MCP workflow

## Surface selection

- Use `commentary_research` for capability discovery, workflow status, study/session/step reads, moderation, evidence inspection, and analysis proposals.
- Use `commentary_forms` for the exact source-backed Forms embedded as Research steps.
- Use `draft_review` or the CLI for local protocol, Form, codebook, finding, and report artifacts. Do not duplicate a mutation through CLI and MCP.
- Use Review tools for the rendered human review of proposed artifacts and their approval gate.

## Bounds

- Pass a stable `agentAlias` on state-changing actions.
- Use cursor pagination and bounded reads.
- Treat `approval_required`, `stale_study_revision`, `unsynced_evidence`, `source_conflict`, and `destination_unavailable` as blocking workflow states, not prompts to bypass controls.
- Read only finalized synchronized evidence for durable conclusions.
- Preserve pseudonymous participant projections. Never copy credentials, signed media URLs, raw provider identity, private repository URLs, or participant identity into logs or source artifacts.

An intervention must remain visible, attributable, step-scoped, and within the study's configured Observer, Interviewer, or Full assistance capability.
