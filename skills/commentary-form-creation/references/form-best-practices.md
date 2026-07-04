# Form Best Practices

Use these guidelines when designing Commentary Forms.

## Question Design

- Start from the decision: approval, triage, intake, readiness, risk rating, or handoff.
- Prefer fewer fields. Remove any field that nobody will read or act on.
- Put easy identification and routing fields first, then evidence, then decision fields.
- Use human labels and help text; avoid internal database names in labels.
- Ask for one concept per question.
- Use neutral wording. Do not lead reviewers toward approval or rejection.
- Use option labels that are mutually exclusive and collectively useful.
- Use an explicit `otherDetails` text area only when option coverage is uncertain.

## Field Selection

- `text`: short names, titles, ids, compact free text.
- `textarea`: narrative findings, rationale, reproduction notes, migration notes.
- `email`, `url`, `phone`: only when the format matters operationally.
- `number`, `integer`, `currency`, `rating`, `scale`: metrics and scoring.
- `single_select`, `radio`, `dropdown`: one answer from known options.
- `multi_select`, `checkbox_group`: multiple independent options.
- `boolean`: true/false facts.
- `consent`: explicit acknowledgement or sign-off.
- `date`, `time`, `datetime`: schedule or deadline fields.
- `hidden` and `computed`: use only when a trusted workflow supplies values.

## Validation

- Use `required` only for values needed to submit a useful final response.
- Add `minLength` for names or text that must be non-trivial.
- Add `maxLength` to prevent oversized narrative fields.
- Use `minimum` and `maximum` for scores and quantities.
- Use `enum` for aggregation and reporting.
- Use `pattern` sparingly; include help text when users must match a specific shape.
- Keep `additionalProperties: false` on normal object forms to reject accidental fields.

## Conditional Logic

Use conditional logic to reduce burden, not to hide critical information.

Good uses:

- Require `mitigationPlan` when `riskLevel` is `high`.
- Show `piiDetails` only when `handlesPii` is true.
- Require `blockers` when `ready` is false.

Avoid:

- Deep branching that makes results hard to compare.
- Hidden required fields.
- Business rules that cannot be explained in one sentence.

## Accessibility And UX

- Labels must be clear without relying on placeholder text.
- Help text should explain constraints before the user fails validation.
- Error messages should identify the field and how to fix the value.
- Use grouped sections for long forms.
- Prefer one-question-at-a-time mode only when sequential focus matters more than scanning.
- Do not use color alone to communicate status or risk.

## Privacy

- Collect the least sensitive data that satisfies the workflow.
- Separate anonymous reply mode from identified reply mode intentionally.
- Avoid collecting secrets, access tokens, private keys, or credentials.
- Document retention or result ownership outside the form only when the user asks.
