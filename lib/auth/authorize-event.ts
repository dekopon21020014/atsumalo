import { NextResponse } from 'next/server'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { createHash, timingSafeEqual } from 'crypto'
import { db } from '@/lib/firebase'
import { ensurePasswordHash, verifyPassword } from '@/lib/password-utils'

export type AuthorizedEvent = { eventSnap: DocumentSnapshot; requireParticipantToken: boolean }

export type EventAuthResult = AuthorizedEvent | { response: NextResponse }

const MAX_PASSWORD_FAILURES = 10 // 連続10回失敗でロック
const PASSWORD_LOCKOUT_MS = 10 * 60 * 1000 // 10分間ロック

/**
 * 文字列の長さに依存せず SHA-256 ダイジェスト経由で一定時間比較を行う。
 * タイミング攻撃によるトークン推測を防止する。
 */
export function safeTokenCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
    return false
  }
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

/**
 * イベント単位のパスワードロック状態をチェックする。
 */
export async function checkPasswordLock(
  eventId: string,
): Promise<{ locked: boolean; retryAfter: number }> {
  const lockRef = db.collection('rate_limits').doc(`pw_lock:${eventId}`)
  try {
    const snap = await lockRef.get()
    if (!snap.exists) return { locked: false, retryAfter: 0 }
    const data = snap.data()
    const lockedUntil =
      data?.lockedUntil?.toMillis?.() ?? data?.lockedUntil?.getTime?.() ?? 0
    const now = Date.now()
    if (lockedUntil > now) {
      const retryAfter = Math.ceil((lockedUntil - now) / 1000)
      return { locked: true, retryAfter }
    }
    return { locked: false, retryAfter: 0 }
  } catch (err) {
    console.error('Failed to check password lock:', err)
    return { locked: false, retryAfter: 0 }
  }
}

/**
 * パスワード検証結果（成功/失敗）を記録する。
 */
export async function recordPasswordAttempt(
  eventId: string,
  success: boolean,
): Promise<void> {
  const lockRef = db.collection('rate_limits').doc(`pw_lock:${eventId}`)
  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(lockRef)
      if (success) {
        if (doc.exists) {
          t.delete(lockRef)
        }
        return
      }
      const now = Date.now()
      const currentFailures = (doc.data()?.failures || 0) + 1
      if (currentFailures >= MAX_PASSWORD_FAILURES) {
        t.set(lockRef, {
          failures: currentFailures,
          lockedUntil: new Date(now + PASSWORD_LOCKOUT_MS),
          updatedAt: new Date(now),
        })
      } else {
        t.set(
          lockRef,
          {
            failures: currentFailures,
            updatedAt: new Date(now),
          },
          { merge: true },
        )
      }
    })
  } catch (err) {
    console.error('Failed to record password attempt:', err)
  }
}

/**
 * イベントへのアクセスを認証する共通ヘルパー。
 * - パスワードが設定されている場合は x-event-password ヘッダーで検証（総当たり防御付き）
 * - トークンが設定されている場合は x-event-token / Authorization ヘッダーで検証（タイミング攻撃防御付き）
 *
 * ヘッダーしか参照しないため、NextRequest に限らず { headers } を持つオブジェクトを受け付ける。
 */
export async function authorizeEventAccess(
  req: { headers: Headers },
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
    // ブルートフォースによるロック状態を検証
    const lockStatus = await checkPasswordLock(eventId)
    if (lockStatus.locked) {
      return {
        response: NextResponse.json(
          {
            error:
              'パスワード試行回数の上限を超過しました。しばらく待ってから再度お試しください。',
          },
          {
            status: 429,
            headers: { 'Retry-After': lockStatus.retryAfter.toString() },
          },
        ),
      }
    }

    const hashedPassword = await ensurePasswordHash(eventSnap.ref, storedPassword)
    const passwordValid =
      providedPassword && (await verifyPassword(hashedPassword, providedPassword))

    await recordPasswordAttempt(eventId, Boolean(passwordValid))

    if (!passwordValid) {
      return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
    }
  }

  if (
    tokenRequired &&
    !tokens.some((token) => safeTokenCompare(token, providedToken))
  ) {
    return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }

  // TODO: ユーザー認証導入時に Firebase Auth 等でユーザー権限チェックを追加する

  return { eventSnap, requireParticipantToken: tokenRequired }
}
