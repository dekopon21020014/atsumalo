import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { db, FieldValue } from "./firebase";
import { eventSchema } from "./validations/event";
import { participantSchema } from "./validations/participant";
import { hashPassword } from "./password-utils";
import { defaultGradeOptions, defaultGradeOrder } from "../app/events/[eventId]/components/constants";

export const mcpServer = new Server(
  {
    name: "atsumalo-event-creator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_event",
        description: "Creates a new event in Atsumalo",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Event name" },
            description: { type: "string", description: "Event description" },
            eventType: { type: "string", enum: ["recurring", "onetime"], description: "Type of event" },
            password: { type: "string", description: "Optional password for the event" },
            xAxis: { type: "array", items: { type: "string" }, description: "Required for recurring: Array of x-axis values (e.g. times)" },
            yAxis: { type: "array", items: { type: "string" }, description: "Required for recurring: Array of y-axis values (e.g. dates)" },
            dateTimeOptions: { type: "array", items: { type: "string" }, description: "Required for onetime: Array of date-time options" },
            scheduleTypes: {
              type: "array",
              description: "Array of schedule types",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  color: { type: "string" },
                  isAvailable: { type: "boolean" }
                },
                required: ["id", "label", "color", "isAvailable"]
              }
            },
            gradeOptions: { type: "array", items: { type: "string" }, description: "Optional custom grade options" },
            gradeOrder: { type: "object", additionalProperties: { type: "number" }, description: "Optional custom grade order mapping" }
          },
          required: ["name", "eventType", "scheduleTypes"]
        }
      },
      {
        name: "submit_answer",
        description: "Submits a participant's answer to an event in Atsumalo",
        inputSchema: {
          type: "object",
          properties: {
            eventId: { type: "string", description: "ID of the event to answer" },
            name: { type: "string", description: "Name of the participant" },
            grade: { type: "string", description: "Role or grade of the participant" },
            gradePriority: { type: "number", description: "Optional priority for sorting grades" },
            comment: { type: "string", description: "Optional comment" },
            schedule: {
              type: "object",
              description: "Schedule answers. For recurring events, an object mapping coordinates (e.g. '0,0') to schedule type IDs. For onetime events, an array of objects like { dateTime: string, typeId: string }"
            }
          },
          required: ["eventId", "name", "grade", "schedule"]
        }
      }
    ]
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_event") {
    try {
      const parseResult = eventSchema.safeParse(request.params.arguments);
      
      if (!parseResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `Validation error: ${parseResult.error.errors.map(e => e.message).join(", ")}`
            }
          ],
          isError: true,
        };
      }

      const {
        name,
        description,
        eventType,
        xAxis,
        yAxis,
        dateTimeOptions,
        scheduleTypes,
        gradeOptions,
        gradeOrder,
        password,
      } = parseResult.data;

      const grades = gradeOptions && gradeOptions.length > 0 ? gradeOptions : defaultGradeOptions;
      const order = gradeOrder && Object.keys(gradeOrder).length > 0 ? gradeOrder : defaultGradeOrder;

      const pass = typeof password === "string" ? password.trim() : "";
      const passwordHash = pass ? await hashPassword(pass) : "";

      const payload: any = {
        name,
        description: description || "",
        eventType,
        scheduleTypes,
        gradeOptions: grades,
        gradeOrder: order,
        createdAt: new Date(),
        ...(passwordHash ? { password: passwordHash } : {}),
      };

      if (eventType === "recurring") {
        payload.xAxis = xAxis || [];
        payload.yAxis = yAxis || [];
      } else {
        payload.dateTimeOptions = dateTimeOptions || [];
      }

      const docRef = await db.collection("events").add(payload);
      
      return {
        content: [
          {
            type: "text",
            text: `Event created successfully. Event ID: ${docRef.id}`
          }
        ]
      };
    } catch (error) {
      console.error(error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating event: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true,
      };
    }
  }

  if (request.params.name === "submit_answer") {
    try {
      const parseResult = participantSchema.safeParse(request.params.arguments);
      
      if (!parseResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `Validation error: ${parseResult.error.errors.map(e => e.message).join(", ")}`
            }
          ],
          isError: true,
        };
      }

      const { eventId, name, grade, gradePriority, schedule, comment: rawComment } = parseResult.data;
      
      let comment = "";
      if (rawComment != null) {
        const trimmed = rawComment.trim();
        if (trimmed !== "") {
          comment = trimmed;
        }
      }

      const eventRef = db.collection("events").doc(eventId);
      const eventSnap = await eventRef.get();
      if (!eventSnap.exists) {
        return {
          content: [{ type: "text", text: `Event not found: ${eventId}` }],
          isError: true
        };
      }

      const participantsRef = eventRef.collection("participants");
      const participantData: any = {
        name,
        grade,
        schedule,
        comment,
        createdAt: FieldValue.serverTimestamp(),
      };

      const docRef = await participantsRef.add(participantData);

      const eventUpdatePayload: any = {
        gradeOptions: FieldValue.arrayUnion(grade)
      };
      if (gradePriority != null) {
        eventUpdatePayload[`gradeOrder.${grade}`] = gradePriority;
      }
      await eventRef.update(eventUpdatePayload);

      return {
        content: [
          {
            type: "text",
            text: `Answer submitted successfully. Participant ID: ${docRef.id}`
          }
        ]
      };
    } catch (error) {
      console.error(error);
      return {
        content: [
          {
            type: "text",
            text: `Error submitting answer: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});
