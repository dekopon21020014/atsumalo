import { z } from "zod";

export const participantSchema = z.object({
  eventId: z.string().min(1, "eventId が必要です").max(100),
  name: z.string().min(1, "名前が必要です").max(100, "名前は100文字以内で入力してください"),
  grade: z.string().min(1, "所属/役職が必要です").max(50, "所属/役職は50文字以内で入力してください"),
  gradePriority: z.number().int().optional(),
  comment: z.string().max(1000, "コメントは1000文字以内で入力してください").optional().nullable(),
  schedule: z.record(z.string().max(50), z.string().max(50)).refine(
    (val) => Object.keys(val).length <= 100,
    { message: "スケジュールの項目数が多すぎます（最大100件）" }
  ),
});
