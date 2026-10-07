import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'
import { randomUUID } from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'
import { authorizeEventAccess } from '@/lib/auth/authorize-event'
import { participantSchema } from '@/lib/validations/participant'
import { submitAnswerService } from '@/lib/services/events'

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
  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  const body = await req.json()
  // Zodによるバリデーション
  const parseResult = participantSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || '入力内容に誤りがあります' },
      { status: 400 },
    )
  }

  const { eventId: bodyEventId, name, grade, gradePriority, schedule, comment: rawComment } = parseResult.data

  if (bodyEventId !== eventId) {
    return NextResponse.json({ error: 'eventId が一致しません' }, { status: 400 })
  }

  try {
    const result = await submitAnswerService(req, parseResult.data)

    const responseBody: Record<string, unknown> = { message: '保存しました', id: result.id }
    if (result.editToken) {
      responseBody.editToken = result.editToken
    }
    return NextResponse.json(responseBody)
  } catch (err: any) {
    console.error('保存エラー:', err)
    if (err.message === 'Unauthorized or Event Not Found') {
       return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}
