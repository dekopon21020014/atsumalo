// app/api/events/[eventId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"

interface ScheduleType {
  id: string
  label: string
  color: string
  isAvailable: boolean
}

export async function GET(
  _req: NextRequest,
  context: {
    // Next.js 14 では params が Promise になる
    params: Promise<{ eventId: string }>
  }
) {
  const { eventId } = await context.params
  const eventSnap = await db.collection("events").doc(eventId).get()
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const data = eventSnap.data() || {}
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
    ...(eventType === "recurring"
      ? { xAxis, yAxis }
      : { dateTimeOptions }),
    participants,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params
  const json = await req.json()
  let {
    name,
    description,
    eventType,
    scheduleTypes,
    xAxis,
    yAxis,
    dateTimeOptions,
  } = json

  // 基本バリデーション
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "イベント名が必要です" },
      { status: 400 }
    )
  }
  if (description != null && typeof description !== "string") {
    return NextResponse.json(
      { error: "説明は文字列で入力してください" },
      { status: 400 }
    )
  }
  if (eventType !== "recurring" && eventType !== "onetime") {
    return NextResponse.json(
      { error: 'eventType は "recurring" または "onetime" で指定してください' },
      { status: 400 }
    )
  }

  // scheduleTypes の検証
  if (
    !Array.isArray(scheduleTypes) ||
    !scheduleTypes.every((t) =>
      t &&
      typeof t.id === "string" && t.id.trim() !== "" &&
      typeof t.label === "string" &&
      typeof t.color === "string" &&
      typeof t.isAvailable === "boolean"
    )
  ) {
    return NextResponse.json(
      { error: "scheduleTypes は正しい形式で指定してください" },
      { status: 400 }
    )
  }

  // イベントタイプ別の検証
  if (eventType === "recurring") {
    if (
      !Array.isArray(xAxis) ||
      !xAxis.every((v) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "recurring の場合、xAxis は文字列の配列で指定してください" },
        { status: 400 }
      )
    }
    if (
      !Array.isArray(yAxis) ||
      !yAxis.every((v) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "recurring の場合、yAxis は文字列の配列で指定してください" },
        { status: 400 }
      )
    }
  } else {
    // onetime
    if (
      !Array.isArray(dateTimeOptions) ||
      !dateTimeOptions.every((v) => typeof v === "string")
    ) {
      return NextResponse.json(
        { error: "onetime の場合、dateTimeOptions は文字列の配列で指定してください" },
        { status: 400 }
      )
    }
  }

  // 更新データ作成
  const updateData: any = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    updatedAt: new Date(),
  }

  if (eventType === "recurring") {
    updateData.xAxis = xAxis
    updateData.yAxis = yAxis
    // onetime 用フィールドは空配列でリセット
    updateData.dateTimeOptions = []
  } else {
    updateData.dateTimeOptions = dateTimeOptions
    // recurring 用フィールドは空配列でリセット
    updateData.xAxis = []
    updateData.yAxis = []
  }

  try {
    await db.collection("events").doc(eventId).update(updateData)
    return NextResponse.json({ message: "更新しました" })
  } catch (err) {
    console.error("イベント更新エラー:", err)
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    )
  }
}
