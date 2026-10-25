# Agentic plan review framework

## Broad view first

- Confirm the proposed work solves the stated user problem.
- Flag contradictions between the plan and current code, tests, policy, or architecture.
- Identify missing decisions that would force the implementer to guess.
- Prefer the smallest coherent approach that meets the success criteria.

## Agent oversight

- Require environment evidence for claims that can be inspected.
- Separate reversible implementation steps from sensitive or irreversible actions.
- Define checkpoints where only the user or an authorized human can choose intent, accept risk, or approve continuation.
- Check that retry limits and stopping conditions are proportional to cost and risk.
- Require observable acceptance evidence, not an agent's assertion that work is complete.

## Comment quality

A useful comment contains the affected decision, the concrete impact, supporting evidence, and the smallest necessary correction. Anchor comments to the relevant section. Group repeated symptoms under the underlying design issue.

Do not rewrite the plan wholesale unless requested. Do not block on formatting while material design questions remain.
