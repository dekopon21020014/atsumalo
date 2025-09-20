import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "@/lib/firebase"
import { defaultGradeOptions, defaultGradeOrder } from "@/app/events/[eventId]/components/constants"
import {
  applyRateLimit,
  buildUnauthorizedResponse,
  extractPasswordFromRequest,
  getEventDocument,
  hashEventPassword,
  isAdminRequest,
  requireAdmin,
  requiresPassword,
  sanitizeEventData,
  verifyEventPassword,
} from "@/lib/security"

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
  const rateLimit = applyRateLimit(req, { limit: 60, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const { eventId } = await context.params
  const { ref, snap } = await getEventDocument(eventId)
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const data = snap.data() || {}
  const admin = isAdminRequest(req)
  if (!admin) {
    const provided = extractPasswordFromRequest(req)
    const allowed = await verifyEventPassword(ref, data, provided)
    if (!allowed) {
      return buildUnauthorizedResponse()
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

  const sanitized = sanitizeEventData(data)

  const participantsSnap = await ref.collection("participants").orderBy("createdAt").get()
  const participants = participantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  return NextResponse.json({
    id: snap.id,
    name: data.name,
    description: data.description,
    eventType,
    scheduleTypes,
    gradeOptions: Array.isArray(data.gradeOptions) ? data.gradeOptions : defaultGradeOptions,
    gradeOrder: typeof data.gradeOrder === "object" ? data.gradeOrder : defaultGradeOrder,
    ...(eventType === "recurring" ? { xAxis, yAxis } : { dateTimeOptions }),
    requiresPassword: requiresPassword(data),
    createdAt: sanitized.createdAt ?? null,
    updatedAt: sanitized.updatedAt ?? null,
    participants,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const rateLimit = applyRateLimit(req, { limit: 40, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const authError = requireAdmin(req)
  if (authError) return authError

  const { eventId } = params
  const { ref, snap } = await getEventDocument(eventId)
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  const existingData = snap.data() || {}

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
    currentPassword,
    removePassword,
  } = json

  if (currentPassword != null && typeof currentPassword !== "string") {
    return NextResponse.json(
      { error: "currentPassword は文字列で指定してください" },
      { status: 400 },
    )
  }

  if (removePassword != null && typeof removePassword !== "boolean") {
    return NextResponse.json(
      { error: "removePassword は真偽値で指定してください" },
      { status: 400 },
    )
  }

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

  const updateData: any = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    gradeOptions,
    gradeOrder: order,
    updatedAt: FieldValue.serverTimestamp(),
  }

  const hasExistingPassword = requiresPassword(existingData)

  if (removePassword) {
    if (hasExistingPassword) {
      if (!currentPassword || !(await verifyEventPassword(ref, existingData, currentPassword))) {
        return buildUnauthorizedResponse("current password mismatch")
      }
      updateData.passwordHash = FieldValue.delete()
      updateData.password = FieldValue.delete()
    }
  } else if (typeof password === "string") {
    if (password.trim() === "") {
      return NextResponse.json(
        { error: "password は空白以外の文字で指定してください" },
        { status: 400 },
      )
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "password は4文字以上にしてください" },
        { status: 400 },
      )
    }
    if (hasExistingPassword && (!currentPassword || !(await verifyEventPassword(ref, existingData, currentPassword)))) {
      return buildUnauthorizedResponse("current password mismatch")
    }
    updateData.passwordHash = await hashEventPassword(password)
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
    await ref.update(updateData)
    return NextResponse.json({ message: "更新しました" })
  } catch (err) {
    console.error("イベント更新エラー:", err)
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 },
    )
  }
}

