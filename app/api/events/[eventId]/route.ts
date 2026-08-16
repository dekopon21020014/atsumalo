import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { defaultGradeOptions, defaultGradeOrder } from "@/app/events/[eventId]/components/constants"
import { ensurePasswordHash, hashPassword, verifyPassword } from "@/lib/password-utils"
import { checkRateLimit } from "@/lib/rate-limit"
import { eventSchema } from "@/lib/validations/event"

interface ScheduleType {
  id: string
  label: string
  color: string
  isAvailable: boolean
}

type EventUpdatePayload = {
  name: string
  description: string
  eventType: "recurring" | "onetime"
  scheduleTypes: ScheduleType[]
  gradeOptions: string[]
  gradeOrder: Record<string, number>
  updatedAt: Date
  password?: string
  xAxis?: string[]
  yAxis?: string[]
  dateTimeOptions?: string[]
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ eventId: string }>
  },
) {
  const { eventId } = await context.params
  const eventSnap = await db.collection("events").doc(eventId).get()
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const data = eventSnap.data() || {}

  // パスワードはヘッダーのみで受け付ける（クエリパラメータはログに残るため使用しない）
  const providedPassword = req.headers.get("x-event-password") || ""
  const storedPassword = typeof data.password === "string" ? data.password : ""
  if (storedPassword) {
    const hashedPassword = await ensurePasswordHash(eventSnap.ref, storedPassword)
    const passwordValid =
      providedPassword && (await verifyPassword(hashedPassword, providedPassword))
    if (!passwordValid) {
      return NextResponse.json({ error: "password required" }, { status: 401 })
    }
  }

  const eventType =
    data.eventType === "recurring" || data.eventType === "onetime"
      ? data.eventType
      : "recurring"

  const scheduleTypes: ScheduleType[] = Array.isArray(data.scheduleTypes)
    ? data.scheduleTypes
    : []

  const xAxis: string[] =
    eventType === "recurring" && Array.isArray(data.xAxis)
      ? data.xAxis
      : []
  const yAxis: string[] =
    eventType === "recurring" && Array.isArray(data.yAxis)
      ? data.yAxis
      : []

  const dateTimeOptions: string[] =
    eventType === "onetime" && Array.isArray(data.dateTimeOptions)
      ? data.dateTimeOptions
      : []

  const participantsSnap = await db
    .collection("events")
    .doc(eventId)
    .collection("participants")
    .orderBy("createdAt")
    .get()

  const participants = participantsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))

  return NextResponse.json({
    id: eventSnap.id,
    name: data.name,
    description: data.description,
    eventType,
    scheduleTypes,
    gradeOptions: Array.isArray(data.gradeOptions) ? data.gradeOptions : defaultGradeOptions,
    gradeOrder: typeof data.gradeOrder === "object" ? data.gradeOrder : defaultGradeOrder,
    ...(eventType === "recurring" ? { xAxis, yAxis } : { dateTimeOptions }),
    participants,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  // レートリミット (1分間に10回まで更新可能)
  const rateLimit = await checkRateLimit(req, 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfter.toString() } },
    )
  }

  const { eventId } = await params
  const eventRef = db.collection("events").doc(eventId)
  const eventSnap = await eventRef.get()
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const eventData = eventSnap.data() || {}

  // パスワードはヘッダーのみで受け付ける（クエリパラメータはログに残るため使用しない）
  const providedPassword = req.headers.get("x-event-password") || ""
  const providedToken =
    req.headers.get("x-event-token") ||
    (req.headers.get("authorization")?.split(" ")[1] ?? "")

  const storedPassword = typeof eventData.password === "string" ? eventData.password : ""
  const passwordRequired = storedPassword.trim() !== ""
  if (passwordRequired) {
    const hashedPassword = await ensurePasswordHash(eventRef, storedPassword)
    const passwordValid =
      providedPassword && (await verifyPassword(hashedPassword, providedPassword))
    if (!passwordValid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const tokens: string[] = Array.isArray(eventData.tokens)
    ? eventData.tokens.filter((token: unknown): token is string =>
        typeof token === "string" && token.trim() !== "",
      )
    : typeof eventData.token === "string" && eventData.token.trim() !== ""
      ? [eventData.token]
      : []
  const tokenRequired = tokens.length > 0
  if (tokenRequired && !tokens.includes(providedToken)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const json = await req.json()

  // Zodによるバリデーション
  const parseResult = eventSchema.safeParse(json)

  if (!parseResult.success) {
    // 最初のバリデーションエラーメッセージを返す
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || "入力内容に誤りがあります" },
      { status: 400 },
    )
  }

  const {
    name,
    description,
    eventType,
    scheduleTypes,
    xAxis,
    yAxis,
    dateTimeOptions,
    gradeOptions,
    gradeOrder,
    password,
  } = parseResult.data

  const validGradeOptions =
    gradeOptions && gradeOptions.length > 0 ? gradeOptions : defaultGradeOptions

  const order =
    gradeOrder && Object.keys(gradeOrder).length > 0 ? gradeOrder : defaultGradeOrder

  // 更新データ作成（any を廃止して明示的な型を使用）
  const updateData: EventUpdatePayload = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    gradeOptions: validGradeOptions,
    gradeOrder: order,
    updatedAt: new Date(),
  }

  if (typeof password === "string") {
    const trimmedPassword = password.trim()
    updateData.password = trimmedPassword ? await hashPassword(trimmedPassword) : ""
  }

  if (eventType === "recurring") {
    updateData.xAxis = xAxis
    updateData.yAxis = yAxis
    updateData.dateTimeOptions = []
  } else {
    updateData.dateTimeOptions = dateTimeOptions
    updateData.xAxis = []
    updateData.yAxis = []
  }

  try {
    await eventRef.update(updateData)
    return NextResponse.json({ message: "更新しました" })
  } catch (err) {
    console.error("イベント更新エラー:", err)
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 },
    )
  }
}
