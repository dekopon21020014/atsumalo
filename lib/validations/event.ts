import { z } from "zod";

export const scheduleTypeSchema = z.object({
  id: z.string().max(50),
  label: z.string().max(50),
  color: z.string().max(30),
  isAvailable: z.boolean(),
});

// REST (/api/events) と MCP (create_event) の両方で使う共通スキーマ。
// describe() の内容は MCP クライアントに提示されるツール定義（JSON Schema）にも反映される。
export const eventSchema = z.object({
  name: z.string().min(1, "イベント名が必要です").max(100, "イベント名は100文字以内で入力してください")
    .describe("Event name"),
  description: z.string().max(2000, "説明は2000文字以内で入力してください").optional().nullable()
    .describe("Event description"),
  eventType: z.enum(["recurring", "onetime"], {
    error: "eventType は 'recurring' または 'onetime' で指定してください",
  }).describe("'recurring' (weekly grid) or 'onetime' (list of candidate date-times)"),
  password: z.string().max(100, "パスワードは100文字以内で入力してください").optional().nullable()
    .describe("Optional password to protect the event"),

  // Arrays
  xAxis: z.array(z.string().max(50)).max(100, "xAxisは最大100件までです").optional()
    .describe("Required for recurring: column labels (e.g. days of week)"),
  yAxis: z.array(z.string().max(50)).max(100, "yAxisは最大100件までです").optional()
    .describe("Required for recurring: row labels (e.g. periods)"),
  dateTimeOptions: z.array(z.string().max(50)).max(100, "候補日時は最大100件までです").optional()
    .describe("Required for onetime: candidate date-time labels"),

  scheduleTypes: z.array(scheduleTypeSchema).min(1).max(20, "スケジュールタイプは最大20件までです")
    .describe("Answer choices, e.g. [{id:'available',label:'○',color:'bg-green-100 text-green-800',isAvailable:true}]"),

  gradeOptions: z.array(z.string().max(50)).max(20, "所属/役職オプションは最大20件までです").optional().nullable()
    .describe("Optional custom grade/role options"),
  gradeOrder: z.record(z.string().max(50), z.number()).optional().nullable()
    .describe("Optional sort priority per grade"),
}).superRefine((data, ctx) => {
  if (data.eventType === "recurring") {
    if (!data.xAxis || !Array.isArray(data.xAxis)) {
      ctx.addIssue({
        code: "custom",
        message: "recurring の場合、xAxis は文字列の配列で指定してください",
        path: ["xAxis"],
      });
    }
    if (!data.yAxis || !Array.isArray(data.yAxis)) {
      ctx.addIssue({
        code: "custom",
        message: "recurring の場合、yAxis は文字列の配列で指定してください",
        path: ["yAxis"],
      });
    }
  } else {
    if (!data.dateTimeOptions || !Array.isArray(data.dateTimeOptions)) {
      ctx.addIssue({
        code: "custom",
        message: "onetime の場合、dateTimeOptions は文字列の配列で指定してください",
        path: ["dateTimeOptions"],
      });
    }
  }
});

export type EventInput = z.infer<typeof eventSchema>;
