import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createEventService, submitAnswerService } from "../lib/services/events";

const server = new McpServer({
  name: "atsumalo-event-mcp-stdio",
  version: "1.0.0",
});

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
    scheduleTypes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      color: z.string(),
      isAvailable: z.boolean(),
    })).describe("Array of schedule types"),
    gradeOptions: z.array(z.string()).optional().describe("Optional custom grade options"),
    gradeOrder: z.record(z.string(), z.number()).optional().describe("Optional custom grade order mapping")
  },
  async (args) => {
    try {
      const id = await createEventService(args);
      return {
        content: [{ type: "text", text: `Event created successfully. Event ID: ${id}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Error creating event." }],
        isError: true,
      };
    }
  }
);

server.tool(
  "submit_answer",
  "Submits a participant's answer to an event in Atsumalo",
  {
    eventId: z.string().describe("ID of the event to answer"),
    name: z.string().describe("Name of the participant"),
    grade: z.string().describe("Role or grade of the participant"),
    gradePriority: z.number().optional().describe("Optional priority for sorting grades"),
    comment: z.string().optional().describe("Optional comment"),
    schedule: z.union([
      z.record(z.string(), z.string()),
      z.array(z.object({ dateTime: z.string(), typeId: z.string() }))
    ]).describe("Schedule answers"),
    eventPassword: z.string().optional().describe("Password for the event (if required)"),
    eventToken: z.string().optional().describe("Token for the event (if required)")
  },
  async (args) => {
    const headers = new Headers();
    if (args.eventPassword) headers.set("x-event-password", args.eventPassword);
    if (args.eventToken) headers.set("x-event-token", args.eventToken);
    
    try {
      const result = await submitAnswerService({ headers }, args as any);
      return {
        content: [{ type: "text", text: `Answer submitted successfully. Participant ID: ${result.id}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : "Error submitting answer." }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.server.connect(transport);
  console.error("Atsumalo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
