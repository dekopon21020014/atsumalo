import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "../lib/mcp/tools";

// ローカル実行用の stdio MCP サーバー。ツール定義は HTTP エンドポイントと共通。
const server = new McpServer({
  name: "atsumalo-event-mcp-stdio",
  version: "1.0.0",
});
registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Atsumalo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
