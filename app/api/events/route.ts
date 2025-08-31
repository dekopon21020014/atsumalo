// app/api/events/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { defaultGradeOptions } from "@/app/events/[eventId]/components/constants"

export async function POST(req: NextRequest) {
  const json = await req.json()
  const {
    name,
    description,
    eventType,
    xAxis,
    yAxis,
    dateTimeOptions,
    scheduleTypes,
    gradeOptions,
  } = json

  // --- 基本項目チェック ---
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "イベント名が必要です" }, { status: 400 })
  }
  if (description != null && typeof description !== "string") {
    return NextResponse.json({ error: "説明は文字列で入力してください" }, { status: 400 })
  }  

  // --- eventType のチェック ---
  if (
    !eventType ||
    (eventType !== "recurring" && eventType !== "onetime")
  ) {
    return NextResponse.json(
      { error: "eventType は \"recurring\" または \"onetime\" で指定してください" },
      { status: 400 }
    )
  }  

  // --- イベントタイプ別の検証 ---
  if (eventType === "recurring") {    
    if (
      !Array.isArray(xAxis) ||
      !xAxis.every((v) => typeof v === "string")
    ) {      
      console.log(xAxis)
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

  // --- scheduleTypes の検証 ---
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

  const grades =
    Array.isArray(gradeOptions) && gradeOptions.every((v: any) => typeof v === "string")
      ? gradeOptions
      : defaultGradeOptions

  // --- Firestore に保存 ---
  try {
    const payload: any = {
      name,
      description: description || "",
      eventType,
      scheduleTypes,
      gradeOptions: grades,
      createdAt: new Date(),
    }
    if (eventType === "recurring") {
      payload.xAxis = xAxis
      payload.yAxis = yAxis
    } else {
      payload.dateTimeOptions = dateTimeOptions
    }

    const docRef = await db.collection("events").add(payload)
    return NextResponse.json({ id: docRef.id })
  } catch (err) {
    console.error("イベント作成エラー:", err)
    return NextResponse.json(
      { error: "イベントの作成に失敗しました" },
      { status: 500 }
    )
  }
}
