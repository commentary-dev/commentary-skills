---
name: review-agentic-plans
description: Review an implementation plan, technical design, specification, or agent-generated proposal for intent, evidence, tradeoffs, risk, and decision completeness. Use before execution when a plan needs substantive critique; do not activate merely to proofread prose or operate Commentary tools.
---

# Review Agentic Plans

Review the strategy before the wording. Preserve the author's goal and distinguish discoverable facts from product preferences.

## Review order

1. Goal, audience, success criteria, scope, and non-goals.
2. Assumptions and evidence from the actual repository, environment, or cited authority.
3. Alternatives, tradeoffs, dependencies, and unnecessary complexity.
4. Interfaces, data flow, state ownership, permissions, and failure modes.
5. Security, privacy, licensing, accessibility, performance, migration, rollout, and rollback.
6. Verification, acceptance criteria, observability, and unresolved decisions.

Classify feedback as **blocker**, **material risk**, **suggestion**, **question**, or **positive observation**. State the impact and evidence. Do not present personal taste as a correctness issue.

Separate planning from execution. Require human judgment before sensitive, irreversible, or scope-expanding work. Stop once the plan is decision-complete; do not create speculative edge cases that cannot affect implementation.

Read [references/review-framework.md](references/review-framework.md) for the detailed rubric and [references/source-notes.md](references/source-notes.md) for the industry basis.
