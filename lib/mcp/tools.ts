import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import { authorizeEventAccess } from "@/lib/auth/authorize-event"
import { checkRateLimit } from "@/lib/rate-limit"
import { createEventService, submitAnswerService, ValidationError } from "@/lib/services/events"
import { eventSchema } from "@/lib/validations/event"
import { participantSchema } from "@/lib/validations/participant"

export type RegisterToolsOptions = {
  /**
   * レートリミットの判定に使うリクエスト（IP を x-forwarded-for から取得する）。
   * 公開 HTTP エンドポイントでは必ず指定する。stdio などローカル実行では省略可。
   */
  rateLimitRequest?: { headers: Headers }
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMITS = {
  create_event: 5,
  submit_answer: 20,
} as const

// MCP の入力スキーマも REST と同じスキーマを使う（service 内でも再検証される）
const submitAnswerInputSchema = participantSchema.extend({
  eventPassword: z.string().max(100).optional()
    .describe("Event password (required only if the event is password-protected)"),
  eventToken: z.string().max(200).optional()
    .describe("Event access token (required only if the event is token-protected)"),
})

function textResult(text: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) }
}

async function rateLimitExceeded(
  opts: RegisterToolsOptions,
  tool: keyof typeof RATE_LIMITS,
): Promise<CallToolResult | null> {
  if (!opts.rateLimitRequest) return null
  const result = await checkRateLimit(
    opts.rateLimitRequest,
    RATE_LIMITS[tool],
    RATE_LIMIT_WINDOW_MS,
    `mcp:${tool}`,
  )
  if (result.allowed) return null
  return textResult(`Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`, true)
}

/**
 * 内部エラーの詳細（Firestore のエラーメッセージ等）はクライアントに返さない。
 * ValidationError のメッセージのみ返す。
 */
function errorResult(tool: string, error: unknown): CallToolResult {
  if (error instanceof ValidationError) {
    return textResult(`Invalid input: ${error.message}`, true)
  }
  console.error(`[mcp] ${tool} failed:`, error)
  return textResult(`Internal error while running ${tool}.`, true)
}

export function registerTools(server: McpServer, opts: RegisterToolsOptions = {}) {
  server.registerTool(
    "create_event",
    {
      title: "Create event",
      description: "Creates a new scheduling event in Atsumalo and returns its event ID.",
      inputSchema: eventSchema,
    },
    async (args) => {
      const limited = await rateLimitExceeded(opts, "create_event")
      if (limited) return limited

      try {
        const id = await createEventService(args)
        return textResult(`Event created successfully. Event ID: ${id}`)
      } catch (error) {
        return errorResult("create_event", error)
      }
    },
  )

  server.registerTool(
    "submit_answer",
    {
      title: "Submit answer",
      description:
        "Submits a participant's availability answer to an Atsumalo event. " +
        "If an editToken is returned, keep it: it is required to edit this answer later.",
      inputSchema: submitAnswerInputSchema,
    },
    async (args) => {
      const limited = await rateLimitExceeded(opts, "submit_answer")
      if (limited) return limited

      const { eventPassword, eventToken, ...answer } = args
      const headers = new Headers()
      if (eventPassword) headers.set("x-event-password", eventPassword)
      if (eventToken) headers.set("x-event-token", eventToken)

      try {
        const auth = await authorizeEventAccess({ headers }, answer.eventId)
        if ("response" in auth) {
          return auth.response.status === 404
            ? textResult("Event not found.", true)
            : textResult("Unauthorized: the event password or token is missing or invalid.", true)
        }

        const result = await submitAnswerService(auth, answer)
        const lines = [`Answer submitted successfully. Participant ID: ${result.id}`]
        if (result.editToken) {
          lines.push(
            `Edit token: ${result.editToken}`,
            "Keep this edit token; it is required to edit or delete this answer later.",
          )
        }
        return textResult(lines.join("\n"))
      } catch (error) {
        return errorResult("submit_answer", error)
      }
    },
  )
}
