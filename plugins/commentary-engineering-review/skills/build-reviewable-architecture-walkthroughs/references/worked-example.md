# Record update walkthrough

Overview page: "An editor updates a record; stale writes retain the draft." Text flow: authorized editor -> API access check -> conditional domain update -> transaction -> minimal event. A diagram presents the same flow and links to the detail page.

Detail page: pinned source src/records.ts and the canonical update endpoint. The async notification arrow is proposed until its producer is inspected. Supplied test logs exercise ETag rejection; provider CI has not been observed. Denied source is reported as unavailable.

Reviewer-2 asks where transaction rollback occurs. Inspect the narrow transaction source, correct the diagram and explain the failed-write behavior. Keep the native question open until the reviewer confirms resolution, and request acceptance of the corrected exact Session revision.
