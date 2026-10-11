import { z } from "zod";

// REST (/api/events/[eventId]/participants) と MCP (submit_answer) の両方で使う共通スキーマ。
export const participantSchema = z.object({
  eventId: z.string().min(1, "eventId が必要です").max(100)
    .describe("ID of the event to answer"),
  name: z.string().min(1, "名前が必要です").max(100, "名前は100文字以内で入力してください")
    .describe("Participant name"),
  grade: z.string().min(1, "所属/役職が必要です").max(50, "所属/役職は50文字以内で入力してください")
    .describe("Participant grade/role (one of the event's gradeOptions, or a new one)"),
  gradePriority: z.number().int().optional()
    .describe("Optional sort priority for a newly added grade"),
  comment: z.string().max(1000, "コメントは1000文字以内で入力してください").optional().nullable()
    .describe("Optional comment"),
  schedule: z.union([
    z.record(z.string().max(50), z.string().max(50)).refine(
      (val) => Object.keys(val).length <= 100,
      { message: "スケジュールの項目数が多すぎます（最大100件）" }
    ),
    z.array(
      z.object({
        dateTime: z.string().max(50),
        typeId: z.string().max(50),
      })
    ).max(100, "スケジュールの項目数が多すぎます（最大100件）")
  ]).describe(
    "recurring: map of '<x>-<y>' cell key to scheduleType id. onetime: array of {dateTime, typeId}",
  ),
});

export type ParticipantInput = z.infer<typeof participantSchema>;
