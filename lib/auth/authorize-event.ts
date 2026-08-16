import { NextRequest, NextResponse } from 'next/server'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { db } from '@/lib/firebase'
import { ensurePasswordHash, verifyPassword } from '@/lib/password-utils'

export type EventAuthResult =
  | { eventSnap: DocumentSnapshot; requireParticipantToken: boolean }
  | { response: NextResponse }

/**
 * イベントへのアクセスを認証する共通ヘルパー。
 * - パスワードが設定されている場合は x-event-password ヘッダーで検証
 * - トークンが設定されている場合は x-event-token / Authorization ヘッダーで検証
 */
export async function authorizeEventAccess(
  req: NextRequest,
  eventId: string,
): Promise<EventAuthResult> {
  const eventSnap = await db.collection('events').doc(eventId).get()
  if (!eventSnap.exists) {
    return { response: NextResponse.json({ error: 'not found' }, { status: 404 }) }
  }

  const eventData = eventSnap.data() || {}

  // パスワードはヘッダーのみで受け付ける（クエリパラメータはログに残るため使用しない）
  const providedPassword = req.headers.get('x-event-password') || ''
  const providedToken =
    req.headers.get('x-event-token') ||
    (req.headers.get('authorization')?.split(' ')[1] ?? '')

  const storedPassword = typeof eventData.password === 'string' ? eventData.password : ''
  const passwordRequired = storedPassword.trim() !== ''
  const tokens: string[] = Array.isArray(eventData.tokens)
    ? eventData.tokens.filter(
        (token: unknown): token is string =>
          typeof token === 'string' && token.trim() !== '',
      )
    : typeof eventData.token === 'string' && eventData.token.trim() !== ''
      ? [eventData.token]
      : []
  const tokenRequired = tokens.length > 0

  if (passwordRequired) {
    const hashedPassword = await ensurePasswordHash(eventSnap.ref, storedPassword)
    const passwordValid =
      providedPassword && (await verifyPassword(hashedPassword, providedPassword))
    if (!passwordValid) {
      return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
    }
  }

  if (tokenRequired && !tokens.includes(providedToken)) {
    return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }

  // TODO: ユーザー認証導入時に Firebase Auth 等でユーザー権限チェックを追加する

  return { eventSnap, requireParticipantToken: tokenRequired }
}
