---
name: commentary-request-approval
description: Request and validate a human Commentary Inbox approval for one exact immutable proposal, action, consequence, and current approval policy. Use for durable execution gates including team chains; not ordinary questions or agent-written Decisions.
---

# Commentary Request Approval

Approval records human intent for an exact action. It does not configure an executor, schedule an action, or verify execution. Read [references/operating-surfaces.md](references/operating-surfaces.md) before choosing a transport.

## Prepare the request

Identify the accessible Resource, the grant's authorized recipient, and any external executor. Describe the exact target, action, side effects, consequence, and rollback limits in the immutable content/action payload. Scale disclosure to impact; do not add repetitive confirmation to harmless questions.

Create with stable correlation and an idempotency key bound to this exact request. Use an `approve` action with its consequence in the payload. Approval-policy requirements are part of the immutable proposal; use only server-authorized actors and roles. Changed policy, target, or consequence needs a new revision and fresh approval.

```bash
commentary --json interaction create --resource-type draft_review --resource-id draft_123 --file proposal.json --type decision_request --idempotency-key approval-42 --correlation-id release-42
commentary --json decision wait ixn_123 --approval --timeout 60 --poll-interval 2000
commentary --json interaction get ixn_123
```

Use optional flags only when the installed CLI and configured server support them.

## Validate authority to continue

- Use current-policy reads: CLI `decision wait --approval` or HTTP `GET /api/v1/interactions/{id}/decisions?approval=true&waitMs=...`. A raw positive receipt or ordinary Decision wait exit code is insufficient.
- Require outcome `approve`, the current revision id, selected server-assigned action id, exact lowercase 64-character action fingerprint, and server-confirmed current approval satisfaction. An action fingerprint is different from the whole revision's content fingerprint.
- Any-one, all, quorum, ordered, and role-required policies can leave an individual approval in a pending chain. Current membership, roles, separation of duty, expiry, revocation, and satisfiability remain server-authoritative. Pending keeps waiting within the budget; rejected, expired, or unsatisfiable needs explicit recovery.
- Refetch after waiting and immediately before handoff. Changed revision, removed action, purged context, missing evidence, or mismatch prevents execution. MCP `status` omits action/fingerprint context; raw MCP receipt aggregates are not current-policy validation. If that read is unavailable, return the durable handle and identify the missing capability.
- `acknowledge`, `choose`, `answer`, and conversation replies are not execution approval. Agents cannot write human Decisions.

Rejection stops. Requested changes use `commentary-submit-revision`. Existing explicit external authorization persists; request more authorization only when the exact action is not already authorized. The configured executor receives the exact approved action and consequence, never a retargeted proposal.

## Report what happened

Fulfillment uses the exact Decision/revision/action/fingerprint tuple and append-only idempotent reports. First report `received`, then `started` before doing work, then an honest permitted outcome: `completed`, `failed`, or `unknown`. Corrections follow server transition rules. Bound evidence and exclude secrets. Report acceptance is not successful execution or independent verification.
