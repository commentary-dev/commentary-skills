# Adaptive Forms technical workflow

Adaptive Forms create respondent-specific sections without changing the shared source contract.

1. Set `adaptive.enabled: true` and `adaptive.handoff: mcp_pull_queue` in the Form Contract.
2. Define bounded transitions between authored sections, including wait copy, retry policy, and fallback behavior.
3. Poll `commentary_forms` with `list_adaptive_transitions` for pending work.
4. Claim one transition with `claim_adaptive_transition` before generating a response.
5. Use only the returned bounded answer snapshot and sanitized source context.
6. Complete with exactly one result:
   - `show_section` with a valid generated section for this submission instance;
   - `complete` when no further respondent input is needed;
   - `fallback` to continue through the authored deterministic path.
7. Call `fail_adaptive_transition` when the work cannot be completed safely.

Never add hidden required fields, secrets, credentials, or questions outside the stated form purpose. Never update the source contract as a side effect of handling a transition. Commentary records claim, generated content, provenance, completion, failure, timeout, and fallback states for owner audit.
