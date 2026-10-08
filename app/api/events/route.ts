import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { createEventService, ValidationError } from "@/lib/services/events"

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

  try {
    // バリデーション（eventSchema）は service 内で行う
    const id = await createEventService(json);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error("イベント作成エラー:", err)
    return NextResponse.json(
      { error: "イベントの作成に失敗しました" },
      { status: 500 }
    )
  }
}
