---
name: explain-and-defend-an-implementation
description: Explain an implementation to reviewers with source-backed tradeoffs, test provenance, explicit uncertainties, security and operational boundaries, and honest responses to objections.
---

# Explain and Defend an Implementation

Explain how the implementation meets the requested outcome using inspected code and measured evidence. Defend choices by exposing tradeoffs and alternatives; revise the explanation when an objection reveals a gap. Do not optimize for persuasion or claim safety from lack of reported failures.

Connect the requirement to relevant contracts, data flow, access checks, persistence and failure recovery. Distinguish implemented, tested, independently observed and awaiting human judgment. Include the exact source commit, test command, environment, outcome and limitations when available; mark missing provenance explicitly.

Inspect source selectively around claims and risks. Avoid mandatory line-by-line review or a prescribed methodology. Include an accessible diagram only when it explains behavior better than prose. Preserve app-native review threads and the rendered walkthrough as the primary artifact.

For requested transport use commentary-engineering-project-review, commentary-review-package-creation or commentary-project-feedback-loop when available. Never fabricate human receipts or initiate external Git actions because a design was accepted.

Read [evidence and tradeoffs](references/evidence-and-tradeoffs.md) when forming a claim; see [worked example](references/worked-example.md) for an objection and correction.
