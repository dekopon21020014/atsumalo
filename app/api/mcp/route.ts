// @ts-nocheck
import { NextRequest } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createEventService, submitAnswerService } from "@/lib/services/events";

// ツールごとに rate limit を設定するためのヘルパー
async function enforceToolRateLimit(req: NextRequest, limit: number, windowMs: number) {
  const rateLimit = await checkRateLimit(req, limit, windowMs);
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`);
  }
}

// 接続ごとに新しい McpServer インスタンスを作る
function createMcpServer(req: NextRequest) {
  const server = new McpServer({
    name: "atsumalo-event-mcp",
    version: "1.0.0",
  });

  // @ts-ignore
  server.tool(
    "create_event",
    "Creates a new event in Atsumalo",
    {
      name: z.string().describe("Event name"),
      description: z.string().describe("Event description"),
      eventType: z.enum(["recurring", "onetime"]).describe("Type of event"),
      password: z.string().optional().describe("Optional password for the event"),
      xAxis: z.array(z.string()).optional().describe("Required for recurring: Array of x-axis values (e.g. times)"),
      yAxis: z.array(z.string()).optional().describe("Required for recurring: Array of y-axis values (e.g. dates)"),
      dateTimeOptions: z.array(z.string()).optional().describe("Required for onetime: Array of date-time options"),
      scheduleTypes: z.any().describe("Array of schedule types"),
      gradeOptions: z.array(z.string()).optional().describe("Optional custom grade options"),
      gradeOrder: z.record(z.string(), z.number()).optional().describe("Optional custom grade order mapping")
    },
    async (args: any) => {
      // イベント作成は5回/分
      await enforceToolRateLimit(req, 5, 60000);
      try {
        const id = await createEventService(args);
        return {
          content: [{ type: "text" as const, text: `Event created successfully. Event ID: ${id}` }]
        };
      } catch (error) {
        // 内部エラーの詳細をそのまま返さない
        return {
          content: [{ type: "text" as const, text: "Error creating event." }],
          isError: true,
        };
      }
    }
  );

  // @ts-ignore
  server.tool(
    "submit_answer",
    "Submits a participant's answer to an event in Atsumalo",
    {
      eventId: z.string().describe("ID of the event to answer"),
      name: z.string().describe("Name of the participant"),
      grade: z.string().describe("Role or grade of the participant"),
      gradePriority: z.number().optional().describe("Optional priority for sorting grades"),
      comment: z.string().optional().describe("Optional comment"),
      schedule: z.any().describe("Schedule answers"),
      eventPassword: z.string().optional().describe("Password for the event (if required)"),
      eventToken: z.string().optional().describe("Token for the event (if required)")
    },
    async (args: any) => {
      // 回答は20回/分
      await enforceToolRateLimit(req, 20, 60000);
      
      const headers = new Headers();
      if (args.eventPassword) headers.set("x-event-password", args.eventPassword);
      if (args.eventToken) headers.set("x-event-token", args.eventToken);
      
      try {
        const result = await submitAnswerService({ headers }, args as any);
        return {
          content: [{ type: "text" as const, text: `Answer submitted successfully. Participant ID: ${result.id}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: error instanceof Error ? error.message : "Error submitting answer." }],
          isError: true,
        };
      }
    }
  );

  return server;
}

export async function GET(req: NextRequest) {
  const mcpServer = createMcpServer(req);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  
  // start() が中で呼ばれるので手動で呼ばない
  await mcpServer.server.connect(transport);
  return await transport.handleRequest(req);
}

export async function POST(req: NextRequest) {
  const mcpServer = createMcpServer(req);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  
  await mcpServer.server.connect(transport);
  return await transport.handleRequest(req);
}
