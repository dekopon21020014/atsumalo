// app/api/events/[eventId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"

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

  const data = eventSnap.data()
  const xAxis = Array.isArray(data?.xAxis) ? data.xAxis : []
  const yAxis = Array.isArray(data?.yAxis) ? data.yAxis : []
  const scheduleTypes = Array.isArray(data?.scheduleTypes) ? data.scheduleTypes : []

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
    name: data?.name,
    description: data?.description,
    xAxis,
    yAxis,
    scheduleTypes,
    participants,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params
  const { name, description, xAxis, yAxis } = await req.json()

  // バリデーション
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "イベント名が必要です" }, { status: 400 })
  }
  if (description != null && typeof description !== "string") {
    return NextResponse.json(
      { error: "説明は文字列で入力してください" },
      { status: 400 }
    )
  }
  if (!Array.isArray(xAxis) || !xAxis.every((v) => typeof v === "string")) {
    return NextResponse.json(
      { error: "横軸 (xAxis) は文字列の配列で指定してください" },
      { status: 400 }
    )
  }
  if (!Array.isArray(yAxis) || !yAxis.every((v) => typeof v === "string")) {
    return NextResponse.json(
      { error: "縦軸 (yAxis) は文字列の配列で指定してください" },
      { status: 400 }
    )
  }

  try {
    await db.collection("events").doc(eventId).update({
      name,
      description: description || "",
      xAxis,
      yAxis,
      updatedAt: new Date(),
    })
    return NextResponse.json({ message: "更新しました" })
  } catch (err) {
    console.error("イベント更新エラー:", err)
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    )
  }
}
