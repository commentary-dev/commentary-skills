export function consolidatedMcpCall({ action, params = {}, correlationId }) {
  return {
    headers: { "MCP-Protocol-Version": "2026-07-28", "MCP-Method": "tools/call", "MCP-Name": "interaction", "MCP-Param-Action": action, "X-Correlation-Id": correlationId },
    body: { jsonrpc: "2.0", id: correlationId, method: "tools/call", params: { name: "interaction", arguments: { action, ...params }, _meta: { protocolVersion: "2026-07-28", client: { name: "connector-neutral-example", version: "1.0.0" }, capabilities: {} } } },
  };
}
