# Commentary operating surfaces

| Situation | Use | Source of truth |
| --- | --- | --- |
| Local file-backed Draft or Brainstorming Review | Commentary CLI | Local files |
| Existing remote review, provider-backed PR, comments, participants, Forms, Research, or gate state | Commentary MCP | Provider/source artifact plus app-native records |
| Live Preview target context | Review SDK for instrumentation; MCP for review operations | Customer preview plus app-native threads |

Use CLI followed by MCP only when the CLI creates or synchronizes the local artifact and MCP performs a distinct remote operation. Never perform the same mutation through both interfaces.

Use OAuth by default and PAT only as advanced recovery. Send a stable `agentAlias` on authored mutations. Treat app-native threads as authoritative, inspect thread authorship and gate state before resolving or continuing, and leave approval decisions to the human-controlled path.
