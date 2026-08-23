# Commentary operating surfaces

| Situation | Use | Source of truth |
| --- | --- | --- |
| Local Markdown, MDX, HTML, or text files | Commentary CLI | Local files |
| Existing Draft or Brainstorming Review without local files | Commentary MCP | App-native review |
| GitHub or Azure DevOps PR or branch review | Commentary MCP | Provider source plus app-native threads |
| Live Preview Review | Review SDK for target context; MCP for agent actions | Customer preview plus app-native threads |
| Forms validation, fill, adaptive transitions, or results | Commentary MCP | Source contract plus app-native submissions |
| Active Research Study | Commentary MCP | Versioned study workflow and evidence |

Use CLI followed by MCP only when each owns a distinct operation, such as synchronizing a local Draft revision with CLI and then reading its approval gate through MCP. Never send the same mutation through both surfaces.

Use OAuth by default. Treat PAT entry as advanced recovery. Keep provider permissions, Commentary scopes, licensing, and explicit human approvals intact.
