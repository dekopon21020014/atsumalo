import { db, FieldValue, FieldPath } from "@/lib/firebase"
import { hashPassword } from "@/lib/password-utils"
import type { AuthorizedEvent } from "@/lib/auth/authorize-event"
import { defaultGradeOptions, defaultGradeOrder } from "@/lib/constants"
import { eventSchema } from "@/lib/validations/event"
import { participantSchema } from "@/lib/validations/participant"
import { randomUUID } from "crypto"
import type { ZodError } from "zod"

/**
 * 入力値が不正な場合に投げるエラー。
 * message はユーザーに提示してよい内容（バリデーションメッセージ）のみを持つ。
 * それ以外の例外は内部エラーとして扱い、呼び出し側で詳細を隠すこと。
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

function firstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message || "入力内容に誤りがあります"
}

/**
 * イベントを作成する。REST / MCP の両方から呼ばれるため、ここで必ずスキーマ検証を行う。
 * @throws ValidationError 入力が eventSchema を満たさない場合
 */
export async function createEventService(input: unknown): Promise<string> {
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(firstIssueMessage(parsed.error))
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
  } = parsed.data

  const grades = gradeOptions && gradeOptions.length > 0 ? gradeOptions : defaultGradeOptions
  const order = gradeOrder && Object.keys(gradeOrder).length > 0 ? gradeOrder : defaultGradeOrder

  const pass = typeof password === "string" ? password.trim() : ""
  const passwordHash = pass ? await hashPassword(pass) : ""

  const payload: Record<string, unknown> = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    gradeOptions: grades,
    gradeOrder: order,
    createdAt: new Date(),
    ...(passwordHash ? { password: passwordHash } : {}),
  }

  if (eventType === "recurring") {
    payload.xAxis = xAxis || []
    payload.yAxis = yAxis || []
  } else {
    payload.dateTimeOptions = dateTimeOptions || []
  }

  const docRef = await db.collection("events").add(payload)
  return docRef.id
}

export type SubmitAnswerResult = { id: string; editToken: string }

/**
 * 回答を保存する。認可は呼び出し側で authorizeEventAccess により済ませ、その結果を渡すこと
 * （認可を二重に行わないため）。スキーマ検証はここで必ず行う。
 * @throws ValidationError 入力が participantSchema を満たさない、または eventId が一致しない場合
 */
export async function submitAnswerService(
  auth: AuthorizedEvent,
  input: unknown,
): Promise<SubmitAnswerResult> {
  const parsed = participantSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(firstIssueMessage(parsed.error))
  }

  const { eventId, name, grade, gradePriority, schedule, comment: rawComment } = parsed.data
  const eventRef = auth.eventSnap.ref

  if (eventId !== eventRef.id) {
    throw new ValidationError("eventId が一致しません")
  }

  const comment = rawComment?.trim() ?? ""

  const participantData: Record<string, unknown> = {
    name,
    grade,
    schedule,
    comment,
    createdAt: FieldValue.serverTimestamp(),
  }

  const editToken = auth.requireParticipantToken ? randomUUID() : ""
  if (editToken) {
    participantData.editToken = editToken
  }

  const docRef = await eventRef.collection("participants").add(participantData)

  if (gradePriority != null) {
    // grade を文字列連結でフィールドパスにすると "." を含む値でネストしたフィールドを
    // 書き換えられてしまうため、FieldPath で 1 セグメントとして扱う
    await eventRef.update(
      "gradeOptions",
      FieldValue.arrayUnion(grade),
      new FieldPath("gradeOrder", grade),
      gradePriority,
    )
  } else {
    await eventRef.update({ gradeOptions: FieldValue.arrayUnion(grade) })
  }

  return { id: docRef.id, editToken }
}
