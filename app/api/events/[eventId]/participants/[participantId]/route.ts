// app/api/events/[eventId]/participants/[participantId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from '@/lib/firebase'
import type { DocumentData } from 'firebase-admin/firestore'
import { checkRateLimit } from '@/lib/rate-limit'
import { authorizeEventAccess } from '@/lib/auth/authorize-event'
import { participantSchema } from '@/lib/validations/participant'

function extractParticipantToken(req: NextRequest) {
  const url = new URL(req.url)
  return url.searchParams.get('participantToken') || req.headers.get('x-participant-token') || ''
}

function ensureParticipantOwnership(
  req: NextRequest,
  participantData: DocumentData | undefined,
) {
  const editToken =
    participantData && typeof participantData.editToken === 'string'
      ? participantData.editToken
      : ''
  if (!editToken) {
    return null
  }

  const providedToken = extractParticipantToken(req)
  if (!providedToken || providedToken !== editToken) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  return null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; participantId: string }> }
) {
  // レートリミット (1分間に20回まで更新可能)
  const allowed = await checkRateLimit(req, 20, 60000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。' },
      { status: 429 },
    )
  }

  const { eventId, participantId } = await params

  // 認証を先に行う（バリデーションエラーの詳細が未認証ユーザーに漏れないようにするため）
  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  const json = await req.json()

  // Zodによるバリデーション (eventId は URL params から取得するため除外)
  const parseResult = participantSchema.omit({ eventId: true }).safeParse(json)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || '入力内容に誤りがあります' },
      { status: 400 },
    )
  }

  const { name, grade, gradePriority, schedule, comment: rawComment } = parseResult.data

  let comment = ''
  if (rawComment != null) {
    const trimmed = rawComment.trim()
    if (trimmed !== '') {
      comment = trimmed
    }
  }

  const participantRef = authResult.eventSnap.ref
    .collection('participants')
    .doc(participantId)
  const participantSnap = await participantRef.get()
  if (!participantSnap.exists) {
    return NextResponse.json({ error: '参加者が見つかりません' }, { status: 404 })
  }

  if (authResult.requireParticipantToken) {
    const ownershipError = ensureParticipantOwnership(req, participantSnap.data())
    if (ownershipError) {
      return ownershipError
    }
  }

  try {
    await participantRef.update({
      name,
      grade,
      schedule,
      comment,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await authResult.eventSnap.ref.update({
      gradeOptions: FieldValue.arrayUnion(grade),
      // ドット記法で特定キーのみ更新し、他の grade の priority を保持する
      ...(gradePriority != null
        ? { [`gradeOrder.${grade}`]: gradePriority }
        : {}),
    })
    return NextResponse.json({ message: '更新しました' })
  } catch (err) {
    console.error('更新エラー:', err)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; participantId: string }> }
) {
  const { eventId, participantId } = await params
  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  const participantRef = authResult.eventSnap.ref
    .collection('participants')
    .doc(participantId)
  const participantSnap = await participantRef.get()
  if (!participantSnap.exists) {
    return NextResponse.json({ error: '参加者が見つかりません' }, { status: 404 })
  }

  if (authResult.requireParticipantToken) {
    const ownershipError = ensureParticipantOwnership(req, participantSnap.data())
    if (ownershipError) {
      return ownershipError
    }
  }

  try {
    await participantRef.delete()
    return NextResponse.json({ message: '削除しました' })
  } catch (err) {
    console.error('削除エラー:', err)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}
