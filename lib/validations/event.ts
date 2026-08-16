import { z } from "zod";

export const scheduleTypeSchema = z.object({
  id: z.string().max(50),
  label: z.string().max(50),
  color: z.string().max(30),
  isAvailable: z.boolean(),
});

export const eventSchema = z.object({
  name: z.string().min(1, "イベント名が必要です").max(100, "イベント名は100文字以内で入力してください"),
  description: z.string().max(2000, "説明は2000文字以内で入力してください").optional().nullable(),
  eventType: z.enum(["recurring", "onetime"], {
    errorMap: () => ({ message: "eventType は 'recurring' または 'onetime' で指定してください" }),
  }),
  password: z.string().max(100, "パスワードは100文字以内で入力してください").optional().nullable(),
  
  // Arrays
  xAxis: z.array(z.string().max(50)).max(100, "xAxisは最大100件までです").optional(),
  yAxis: z.array(z.string().max(50)).max(100, "yAxisは最大100件までです").optional(),
  dateTimeOptions: z.array(z.string().max(50)).max(100, "候補日時は最大100件までです").optional(),
  
  scheduleTypes: z.array(scheduleTypeSchema).min(1).max(20, "スケジュールタイプは最大20件までです"),
  
  gradeOptions: z.array(z.string().max(50)).max(20, "所属/役職オプションは最大20件までです").optional().nullable(),
  gradeOrder: z.record(z.string().max(50), z.number()).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.eventType === "recurring") {
    if (!data.xAxis || !Array.isArray(data.xAxis)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "recurring の場合、xAxis は文字列の配列で指定してください",
        path: ["xAxis"],
      });
    }
    if (!data.yAxis || !Array.isArray(data.yAxis)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "recurring の場合、yAxis は文字列の配列で指定してください",
        path: ["yAxis"],
      });
    }
  } else {
    if (!data.dateTimeOptions || !Array.isArray(data.dateTimeOptions)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "onetime の場合、dateTimeOptions は文字列の配列で指定してください",
        path: ["dateTimeOptions"],
      });
    }
  }
});
