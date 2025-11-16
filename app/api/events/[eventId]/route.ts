import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { defaultGradeOptions, defaultGradeOrder } from "@/app/events/[eventId]/components/constants"
import { ensurePasswordHash, hashPassword, verifyPassword } from "@/lib/password-utils"

interface ScheduleType {
  id: string
  label: string
  color: string
  isAvailable: boolean
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

  const url = new URL(req.url)
  const providedPassword =
    url.searchParams.get("password") || req.headers.get("x-event-password") || ""
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
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params
  const eventRef = db.collection("events").doc(eventId)
  const eventSnap = await eventRef.get()
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const eventData = eventSnap.data() || {}
  const url = new URL(req.url)
  const providedPassword =
    url.searchParams.get("password") || req.headers.get("x-event-password") || ""
  const providedToken =
    url.searchParams.get("token") ||
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
  let {
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
  } = json

  // 基本バリデーション
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "イベント名が必要です" },
      { status: 400 },
    )
  }
  if (description != null && typeof description !== "string") {
    return NextResponse.json(
      { error: "説明は文字列で入力してください" },
      { status: 400 },
    )
  }
  if (eventType !== "recurring" && eventType !== "onetime") {
    return NextResponse.json(
      { error: 'eventType は "recurring" または "onetime" で指定してください' },
      { status: 400 },
    )
  }
  if (password != null && typeof password !== "string") {
    return NextResponse.json(
      { error: "password は文字列で指定してください" },
      { status: 400 },
    )
  }

  // scheduleTypes の検証
  if (
    !Array.isArray(scheduleTypes) ||
    !scheduleTypes.every(
      (t: any) =>
        t &&
        typeof t.id === "string" &&
        t.id.trim() !== "" &&
        typeof t.label === "string" &&
        typeof t.color === "string" &&
        typeof t.isAvailable === "boolean",
    )
  ) {
    return NextResponse.json(
      { error: "scheduleTypes は正しい形式で指定してください" },
      { status: 400 },
    )
  }

  if (
    !Array.isArray(gradeOptions) ||
    !gradeOptions.every((v: any) => typeof v === "string")
  ) {
    gradeOptions = defaultGradeOptions
  }

  const order =
    gradeOrder && typeof gradeOrder === "object"
      ? Object.entries(gradeOrder).reduce((acc: any, [k, v]) => {
          if (typeof k === "string" && typeof v === "number") acc[k] = v
          return acc
        }, {})
      : defaultGradeOrder

  // イベントタイプ別の検証
  if (eventType === "recurring") {
    if (
      !Array.isArray(xAxis) ||
      !xAxis.every((v: any) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "recurring の場合、xAxis は文字列の配列で指定してください" },
        { status: 400 },
      )
    }
    if (
      !Array.isArray(yAxis) ||
      !yAxis.every((v: any) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "recurring の場合、yAxis は文字列の配列で指定してください" },
        { status: 400 },
      )
    }
  } else {
    if (
      !Array.isArray(dateTimeOptions) ||
      !dateTimeOptions.every((v: any) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "onetime の場合、dateTimeOptions は文字列の配列で指定してください" },
        { status: 400 },
      )
    }
  }

  // 更新データ作成
  const updateData: any = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    gradeOptions,
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

