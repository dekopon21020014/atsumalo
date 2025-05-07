// app/api/events/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/firebase"

interface ScheduleType {
  id: string
  label: string
  color: string
  isAvailable: boolean
}

export async function POST(req: NextRequest) {
  const json = await req.json()
  const { name, description, xAxis, yAxis, scheduleTypes } = json

  // 必須チェック
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

  // xAxis, yAxis の検証
  if (
    !Array.isArray(xAxis) ||
    !xAxis.every((v) => typeof v === "string")
  ) {
    return NextResponse.json(
      { error: "横軸 (xAxis) は文字列の配列で指定してください" },
      { status: 400 }
    )
  }
  if (
    !Array.isArray(yAxis) ||
    !yAxis.every((v) => typeof v === "string")
  ) {
    return NextResponse.json(
      { error: "縦軸 (yAxis) は文字列の配列で指定してください" },
      { status: 400 }
    )
  }

  // scheduleTypes の検証
  if (
    !Array.isArray(scheduleTypes) ||
    !scheduleTypes.every((t) =>
      t &&
      typeof t.id === "string" &&
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

  try {
    const docRef = await db.collection("events").add({
      name,
      description: description || "",
      xAxis,
      yAxis,
      scheduleTypes,
      createdAt: new Date(),
    })
    return NextResponse.json({ id: docRef.id })
  } catch (err) {
    console.error("イベント作成エラー:", err)
    return NextResponse.json(
      { error: "イベントの作成に失敗しました" },
      { status: 500 }
    )
  }
}
