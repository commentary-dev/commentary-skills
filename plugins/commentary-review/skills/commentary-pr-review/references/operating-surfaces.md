# Commentary operating surfaces

| Situation | Use | Source of truth |
| --- | --- | --- |
| Local file-backed Draft or Brainstorming Review | Commentary CLI | Local files |
| Existing remote Review, comments, Forms, Research or gate state | Discovered MCP or supported API | Source artifact plus app-native records |
| Durable Inbox request, conversation or approval | Supported CLI/HTTP or discovered Interaction MCP actions | Immutable request and human Decision records |
| Inbox/workspace discovery and team queue | Advertised CLI/HTTP agent operations | Credential-granted workspace and authorized Resource metadata |
| Live Preview target context | Review SDK for opt-in instrumentation; MCP for Review operations | Customer preview plus app-native threads |

Use CLI followed by MCP only for distinct operations. Never repeat a mutation through both. CLI Inbox/workspace capabilities do not add provider PR creation/submission or domain-specific Form/Research/Brain authoring commands.

Choose the initial authorized workspace before creating a Resource. Browser selection, credential-granted workspace, source access and creator authority are separate. Use advertised creation support only; do not invent a workspace field or assume `--workspace` switches browser selection. Named credentials require matching grants.

When work arrives through Inbox, retain its Interaction and linked Review provenance. Discover/reuse first-party correlated requests before creating another; updated artifacts and revisions should resurface existing attention rather than duplicate it. Review acceptance does not approve an external consequence. Use a current-policy action approval read for any downstream gate, independently of artifact Review gates.

Check configured-server OpenAPI/OAuth scopes, MCP input schemas and installed CLI help for new operations. Capabilities differ by deployment and transport; absence requires a supported alternative or honest handoff.

Use OAuth by default and PAT only as advanced recovery. Keep configured tokens outside repository content. Pass a stable `agentAlias` only on authored operations that advertise it. App-native threads remain authoritative; check authorship and exact revision gate state before resolving/continuing.

Current provider-backed MCP declarations support GitHub. Commentary UI support for Azure DevOps does not imply Azure MCP support; discover provider capability rather than sending unsupported parameters or bypassing source permissions.
