# Source mapping

Overview: describe the outcome and one important flow. Detail: link the endpoint, authorizer, domain operation and persistence transaction at an exact source snapshot. Attach relevant evidence with repository/commit/command/environment/result provenance. Record inferred behavior and untested failure states alongside the claim.

For each diagram occurrence retain a stable id and exact source/evidence relation. A dependency arrow needs evidence of direction, not just two similarly named modules. API examples should derive method/path/input/failure from the current contract. Do not expose private path/title information to unauthorized readers through diagram labels.

Static Markdown/HTML/diagrams are distinct from executable renderer bundles. Never embed tokens, cookies or an Agent SDK credential in assets. If an executable renderer is requested, use the isolated capability broker and native fallback through the technical renderer skill. Readiness depends on finalized upload and immutable ready revision, not file existence.

After feedback changes the architecture, publish a new immutable package, revise the Session's affected targets while retaining other targets, and request a fresh exact acceptance target. Do not re-anchor ambiguous source or reuse an old fingerprint silently.
