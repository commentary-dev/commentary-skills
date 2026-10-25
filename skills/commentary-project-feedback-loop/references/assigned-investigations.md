# Responding to Review guide Questions

Questions is the guide's contained discussion destination. A human can request an investigation assigned to an eligible registered agent. Resume that existing Interaction; do not create a duplicate generic request or call the human-only investigation creation/list/reply routes as an agent.

Read the original investigation context through authorized Interaction reads. Preserve its guide revision, exact target, file/anchor, line range or mapped source selection across later response revisions and guide updates. New version-2 investigations default shared through native threads; version-1 investigations remain private. Shared means accessible only to readers authorized for both the guide and original source, not public. Verify that the current identity/grant is the assigned recipient and can still read the original target before replying.

Discover MCP interaction action message. Send handle, current Interaction revisionId, integer expectedVersion and idempotencyKey with a body containing serialized JSON in this shape:

~~~json
{
  "schema": "project_review.investigation_response.v1",
  "outcome": "completed",
  "body": "The original implementation uses the documented retry limit; the cited source explains the failure behavior.",
  "revisedTargets": []
}
~~~

Use started, completed or failed to describe observed work honestly. This is an agent report, not human acceptance or independently verified evidence. An explanation needs no revised targets. When a correction was actually published, include only returned exact Resource/revision/digest targets that remain accessible; do not invent ids or infer publication from a local edit. Maximums are ten revised targets and 16 KiB for the response message; keep replies comfortably below the transport limit.

The response message uses the current Interaction version for concurrency but keeps the original artifact context. If MCP message is absent, use an advertised CLI/HTTP message operation with the exact ETag and same response shape; never duplicate a successful send. On an indeterminate result retain the original body/key and read current state. On a conflict reconcile before a fresh-key write. Lost original-source access stops the response; return the durable handle and missing prerequisite without substituting a newer artifact or leaking cached source.
