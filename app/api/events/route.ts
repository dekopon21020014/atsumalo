import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { checkRateLimit } from "@/lib/rate-limit"
import { eventSchema } from "@/lib/validations/event"
import { createEventService } from "@/lib/services/events"

type EventCreatePayload = {
  name: string
  description: string
  eventType: "recurring" | "onetime"
  scheduleTypes: { id: string; label: string; color: string; isAvailable: boolean }[]
  gradeOptions: string[]
  gradeOrder: Record<string, number>
  createdAt: Date
  password?: string
  xAxis?: string[]
  yAxis?: string[]
  dateTimeOptions?: string[]
}

export async function POST(req: NextRequest) {
  // レートリミット (1分間に5回まで)
  const rateLimit = await checkRateLimit(req, 5, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfter.toString() } }
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

  const data = parseResult.data;

  try {
    const id = await createEventService(data);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("イベント作成エラー:", err)
    return NextResponse.json(
      { error: "イベントの作成に失敗しました" },
      { status: 500 }
    )
  }
}
