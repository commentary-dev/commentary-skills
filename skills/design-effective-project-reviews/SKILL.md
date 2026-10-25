---
name: design-effective-project-reviews
description: Design purpose-led Project Review guides that help PMs and engineers understand changes, inspect evidence selectively, and make scoped human decisions without exhaustive code review.
---

# Design Effective Project Reviews

Use a Review guide when several exact artifacts need an ordered walkthrough; individual document, PR, branch, draft and live preview objects remain Reviews. A Project is optional.

Start with the decision the reader needs to make, the changed outcome, and the exact artifact being reviewed. Distinguish a request for feedback from an acceptance request; explain consequences without implying deployment authority.

Give a PM a readable outcome, examples, risks and open questions. Give an engineer the relevant design, source paths at pinned revisions, failure behavior and test provenance. Link optional depth from the rendered overview rather than demanding every changed line. Preserve the user's preferred review depth.

Group review jobs by coherent question or outcome. Keep execution progress, authored claims, independent verification and human acceptance separate. A package existing or a Tracker row marked done answers none of the other questions. Describe uncertainty where the evidence ends.

Use original Resources and app-native threads for discussion; linking a private Resource does not grant access. If publication or revision handling is requested, use commentary-review-package-creation and commentary-project-feedback-loop when installed. Otherwise prepare portable artifacts and disclose missing tools.

Read [review design](references/review-design.md) for audience/depth choices and [worked example](references/worked-example.md) for a PM/engineering handoff.
