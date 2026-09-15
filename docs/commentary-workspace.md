# Commentary Workspace

Use this skill to discover authorized Resource collections and team queues, link existing Resources when requested, or rename owned Draft and Web App Reviews. Install `commentary-workspace` directly or use the `commentary-inbox` plugin.

Canonical instructions: [SKILL.md](../skills/commentary-workspace/SKILL.md).

## Workspace model

Workspace is a personal or team workbench. Inbox is the account attention feed. Sources are connected or linked content. These concepts do not grant one another's permissions.

Agent workspace discovery is bound to the configured credential. A CLI `--workspace` argument must match that grant; it does not switch browser selection. Use an appropriately granted profile to access another workspace.

## Workflow

Discover supported operations, read the granted workspace, then inspect bounded Resource pages or the team queue. Open the canonical artifact through its dedicated skill. Queue reads do not claim or assign work.

When authorized, link an already-accessible Resource using its type and id. Linking does not move ownership or grant provider access. Prefer selecting the initial workspace through the creation surface's advertised support.

For supported Review renames, read first and submit the exact returned `expectedUpdatedAt` with the new title. Refetch and reconcile on conflict. Membership, token scopes, source permissions, and owner authority remain separate checks.

This skill does not administer members, credentials, governance, or provider connections. See [operating surfaces](../skills/commentary-workspace/references/operating-surfaces.md) for scopes and transport compatibility.
