---
name: commentary-workspace
description: Discover the credential-granted Commentary workspace, authorized Resource collections and team queue; link Resources or rename owned Draft and Web App Reviews when requested. Not browser workspace switching, member administration, or provider permission management.
---

# Commentary Workspace

Workspace is the selected personal/team workbench, separate from account Inbox. Read [references/operating-surfaces.md](references/operating-surfaces.md) for discovery and credential binding.

## Discover authorized work

```bash
commentary --profile team --json workspace list
commentary --profile team --workspace ws_123 --json workspace get
commentary --profile team --workspace ws_123 --json workspace resources list --section reviews --filter state=active --limit 25
commentary --profile team --workspace ws_123 --json workspace resources get draft_review draft_123
commentary --profile team --workspace ws_123 --json workspace queue list --assignment unassigned
```

The list exposes the granted workspace, not every browser-accessible workspace. `--workspace` must match the grant and does not change browser selection. Another workspace requires an appropriately granted credential/profile; a missing named profile must not fall back to default credentials.

Collections cover Reviews, Forms, Research, Brain, and Sources with section-specific filters/sorts and 25-item pages. Pass opaque cursors unchanged under the same query and bound pages. Team queues require a team workspace and support `any`, `me`, or `unassigned` reads; reading cannot claim, assign, or delegate.

Sources represent connected/linked content, not workspace identity. Membership, Resource links, source access, administrative roles, and approval roles remain independent. Open canonical Resources with dedicated tools; do not infer authoring APIs from a collection read.

## Requested Resource changes

Link an already-accessible Resource with HTTP POST `/api/v1/workspaces/{id}/resources` or:

```bash
commentary --profile team --workspace ws_123 --json workspace resources link --file link.json --idempotency-key link-42
```

`link.json` is `{ "type": "draft_review", "id": "draft_123" }`. Linking associates a Resource with another authorized workspace; it does not move ownership or grant provider access. Select the initial workspace before creating a Resource, using its dedicated creation surface's advertised support rather than inventing a field.

Only authorized owned Draft and Web App Reviews can be renamed through this API. Read first; submit a title and the exact `expectedUpdatedAt` from that read:

```json
{ "title": "Release plan", "expectedUpdatedAt": "2026-01-15T09:00:00.000Z" }
```

```bash
commentary --profile team --workspace ws_123 --json workspace resources rename draft_review draft_123 --file rename.json
```

Use the actual returned timestamp, not the example value. On conflict or revoked authority refetch and reconcile rather than overwriting.

Writes require `commentary.workspaces.resources.write`, current membership/source access, and owner authority where applicable; auditors cannot perform them. Credential administration, invitations, member management, human assignment, governance publication, and notification consent are outside this agent workflow.
