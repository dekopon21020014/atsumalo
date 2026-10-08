import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { authorizeEventAccess } from '@/lib/auth/authorize-event'
import { submitAnswerService, ValidationError } from '@/lib/services/events'

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  const snap = await authResult.eventSnap.ref
    .collection('participants')
    .orderBy('createdAt')
    .get()

  const participants = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ participants })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  // レートリミット (1分間に20回まで参加登録可能)
  const rateLimit = await checkRateLimit(req, 20, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。' },
      { status: 429, headers: { 'Retry-After': rateLimit.retryAfter.toString() } },
    )
  }

  const { eventId } = await params

  // 認証を先に行う（バリデーションエラーの詳細が未認証ユーザーに漏れないようにするため）
  // 認可はここで 1 回だけ行い、結果を service に渡す
  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  const body = await req.json()

  try {
    // バリデーション（participantSchema と eventId の一致確認）は service 内で行う
    const result = await submitAnswerService(authResult, body)

    const responseBody: Record<string, unknown> = { message: '保存しました', id: result.id }
    if (result.editToken) {
      responseBody.editToken = result.editToken
    }
    return NextResponse.json(responseBody)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('保存エラー:', err)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}
