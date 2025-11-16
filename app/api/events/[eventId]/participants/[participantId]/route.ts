// app/api/events/[eventId]/participants/[participantId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore'

type EventAuthResult =
  | { eventSnap: DocumentSnapshot }
  | { response: NextResponse }

async function authorizeEventAccess(
  req: NextRequest,
  eventId: string,
): Promise<EventAuthResult> {
  const eventSnap = await db.collection('events').doc(eventId).get()
  if (!eventSnap.exists) {
    return { response: NextResponse.json({ error: 'not found' }, { status: 404 }) }
  }

  const eventData = eventSnap.data() || {}
  const url = new URL(req.url)
  const providedPassword =
    url.searchParams.get('password') || req.headers.get('x-event-password') || ''
  const providedToken =
    url.searchParams.get('token') ||
    req.headers.get('x-event-token') ||
    (req.headers.get('authorization')?.split(' ')[1] ?? '')

  const passwordRequired =
    typeof eventData.password === 'string' && eventData.password.trim() !== ''
  const tokens: string[] = Array.isArray(eventData.tokens)
    ? eventData.tokens.filter((token: unknown): token is string =>
        typeof token === 'string' && token.trim() !== '',
      )
    : typeof eventData.token === 'string' && eventData.token.trim() !== ''
      ? [eventData.token]
      : []
  const tokenRequired = tokens.length > 0

  if (
    (passwordRequired && providedPassword !== eventData.password) ||
    (tokenRequired && !tokens.includes(providedToken))
  ) {
    return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }

  // TODO: ユーザー認証導入時に Firebase Auth 等でユーザー権限チェックを追加する

  return { eventSnap }
}

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
  { params }: { params: { eventId: string; participantId: string } }
) {
  const { eventId, participantId } = await params
  const { name, grade, gradePriority, schedule, comment: rawComment } = await req.json()

  const authResult = await authorizeEventAccess(req, eventId)
  if ('response' in authResult) {
    return authResult.response
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '名前が必要です' }, { status: 400 })
  }
  if (!grade || typeof grade !== 'string') {
    return NextResponse.json({ error: '所属/役職が必要です' }, { status: 400 })
  }
  if (gradePriority != null && typeof gradePriority !== 'number') {
    return NextResponse.json({ error: 'gradePriority は数値で指定してください' }, { status: 400 })
  }
  if (!schedule || typeof schedule !== 'object') {
    return NextResponse.json({ error: 'スケジュールが必要です' }, { status: 400 })
  }

  let comment = ''
  if (rawComment != null) {
    if (typeof rawComment !== 'string') {
      return NextResponse.json({ error: 'コメントは文字列で指定してください' }, { status: 400 })
    }
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

  const ownershipError = ensureParticipantOwnership(req, participantSnap.data())
  if (ownershipError) {
    return ownershipError
  }

  try {
    await participantRef.update({
      name,
      grade,
      schedule,
      comment,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updateData: Record<string, any> = {
      gradeOptions: FieldValue.arrayUnion(grade),
    }
    if (gradePriority != null) {
      updateData.gradeOrder = { [grade]: gradePriority }
    }
    await authResult.eventSnap.ref.set(updateData, { merge: true })
    return NextResponse.json({ message: '更新しました' })
  } catch (err) {
    console.error('更新エラー:', err)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const { eventId, participantId } = params
  const authResult = await authorizeEventAccess(_req, eventId)
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

  const ownershipError = ensureParticipantOwnership(_req, participantSnap.data())
  if (ownershipError) {
    return ownershipError
  }

  try {
    await participantRef.delete()
    return NextResponse.json({ message: '削除しました' })
  } catch (err) {
    console.error('削除エラー:', err)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}
