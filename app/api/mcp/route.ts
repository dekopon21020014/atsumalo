import { NextResponse, type NextRequest } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools } from "@/lib/mcp/tools";

// Streamable HTTP（stateless モード）の MCP エンドポイント。
// リクエストごとに McpServer と transport を作り、レスポンス返却後に破棄する。
export async function POST(req: NextRequest) {
  const server = new McpServer({
    name: "atsumalo-event-mcp",
    version: "1.0.0",
  });
  registerTools(server, { rateLimitRequest: req });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  // connect() の中で transport.start() が呼ばれるので手動で呼ばない
  await server.connect(transport);
  return transport.handleRequest(req);
}

// stateless モードではサーバーからの通知を送る相手がいないため、
// GET（SSE ストリーム）と DELETE（セッション終了）は受け付けない。
// GET を許すと何も流れない keep-alive 接続で関数を占有されるため 405 を返す。
function methodNotAllowed() {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export function GET() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}
