import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { defaultGradeOptions, defaultGradeOrder } from "@/app/events/[eventId]/components/constants"
import { hashPassword } from "@/lib/password-utils"
import { eventSchema } from "@/lib/validations/event"

import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // レートリミット (1分間に5回まで)
  const allowed = await checkRateLimit(req, 5, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  const json = await req.json()
  
  // Zodによるバリデーション
  const parseResult = eventSchema.safeParse(json);
  
  if (!parseResult.success) {
    // 最初のバリデーションエラーメッセージを返す
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || "入力内容に誤りがあります" },
      { status: 400 }
    );
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
  } = parseResult.data;

  const grades =
    gradeOptions && gradeOptions.length > 0
      ? gradeOptions
      : defaultGradeOptions

  const order =
    gradeOrder && Object.keys(gradeOrder).length > 0
      ? gradeOrder
      : defaultGradeOrder

  const pass = typeof password === "string" ? password.trim() : ""
  const passwordHash = pass ? await hashPassword(pass) : ""

  // --- Firestore に保存 ---
  try {
    const payload: any = {
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
    return NextResponse.json({ id: docRef.id })
  } catch (err) {
    console.error("イベント作成エラー:", err)
    return NextResponse.json(
      { error: "イベントの作成に失敗しました" },
      { status: 500 }
    )
  }
}
