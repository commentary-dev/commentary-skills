# Attention proposals and diagnostics

Use only operations advertised by the configured server and CLI; older deployments may omit newer public Inbox APIs.

## Saved views

CLI `inbox view list` or HTTP GET `/api/v1/inbox/views` reads private definitions. Propose through CLI `inbox view propose --file view.json`, HTTP POST, or MCP `inbox_saved_view` action `propose` when advertised. Registered account-scoped agent/create authority is required where enforced. Proposals stay inactive until the eligible human accepts them; agents cannot activate views or change defaults.

Use the discovered typed definition, not content queries or guessed fields. Preserve explicit query choices and personal scope.

## Attention policies

```bash
commentary --json inbox policy list --scope personal
commentary --json inbox policy get iap_123
commentary --json inbox policy simulate --file simulation.json
commentary --json inbox policy propose --file policy.json --idempotency-key policy-42
```

Read/simulation requires Inbox read; proposals require Interaction create and registered-agent authority. Proposal JSON contains `name`, `precedence`, `definition`, and optional `scope` (`personal` or `workspace`). Simulation contains `definition` and authorized `entryId`; the server obtains item metadata.

Use the advertised typed `schemaVersion: 1` all/any/not/clause conditions and effects. No scripts, SQL, regex, arbitrary HTTP, raw-content matching, or executable effects. Simulation is a bounded prediction with no applied effects; inspect overrides and current target availability without claiming delivery or assignment occurred.

Proposals remain disabled/pending human approval. Changed definitions need exact-version reapproval; enabling, publishing, archival, and governance are human administration.

## Content-free insights and history

```bash
commentary --json inbox insights --window 30
commentary --json inbox notifications list --limit 20
```

Insights use 30/90-day windows and suppress cohorts below 20 observations. Team reads require owner/admin/auditor authority. Do not reconstruct suppression, infer individual behavior, or expand autonomy from aggregate suggestions; suggestions remain inert human-approved proposals.

Notification history has bounded opaque pagination and intentionally omits titles/app paths from agent projection. Do not scrape around missing content. Receipts cannot authorize execution or alter consent, quiet hours, reminders, or channels.
