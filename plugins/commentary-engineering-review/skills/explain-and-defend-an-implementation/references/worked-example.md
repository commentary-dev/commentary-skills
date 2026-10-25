# Conditional update explanation

Requirement: two editors must not silently overwrite one record. Chosen behavior: the server checks the exact ETag and rejects stale writes; the client preserves the draft and refetches. An unconditional last-write-wins alternative is simpler but loses edits.

Source: pinned snapshot src/records.ts, update function. Evidence: supplied concurrency log exercises one stale write; this is self-reported, not provider-verified. Offline reconnection remains untested.

Objection: does timeout imply failure? Correction: a timeout is indeterminate. Retrieve the exact idempotency receipt before retrying identical intent, and reconcile before making a changed-intent write. Explain this in the revised walkthrough; keep acceptance awaiting_human.
