# Evidence and tradeoffs

For each consequential claim identify the observed source at an exact revision, the test that exercises it, and the remaining inference. A supplied report is authored evidence even if its result says passed. Independently retrieved CI verifies only its exact repository/commit/run/artifact scope; it is not product acceptance.

Explain alternatives proportionally: the chosen approach, one meaningful alternative, the constraint that changed the choice, and a condition that would cause reconsideration. Security discussion should name actual boundaries and denied cases, not generic assurance. Operations discussion should cover bounded work, retries, compatibility and rollback where relevant.

If reviewers challenge an assumption, inspect the narrow source path or reproduce the case. Answer with a changed conclusion if warranted, a qualified explanation if unresolved, or an explicit evidence gap. Request authorized source access if denied; never use a cached private copy as a workaround.
