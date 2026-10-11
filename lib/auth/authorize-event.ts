import { NextResponse } from 'next/server'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { createHash, timingSafeEqual } from 'crypto'
import { db } from '@/lib/firebase'
import { ensurePasswordHash, verifyPassword } from '@/lib/password-utils'

export type AuthorizedEvent = { eventSnap: DocumentSnapshot; requireParticipantToken: boolean }

export type EventAuthResult = AuthorizedEvent | { response: NextResponse }

const MAX_PASSWORD_FAILURES = 10 // 連続10回失敗でロック
const PASSWORD_LOCKOUT_MS = 10 * 60 * 1000 // 10分間ロック

import { getClientIp } from '@/lib/rate-limit'

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

function getLockDocId(eventId: string, ip: string): string {
  const ipKey = ip.replace(/[^a-zA-Z0-9.:-]/g, '') || 'unknown-ip'
  return `pw_lock:${eventId}:${ipKey}`
}

/**
 * IP単位のパスワードロック状態をチェックする（第三者による他者締め出し DoS を防止）。
 */
export async function checkPasswordLock(
  eventId: string,
  ip: string = 'unknown-ip',
): Promise<{ locked: boolean; retryAfter: number }> {
  const lockRef = db.collection('rate_limits').doc(getLockDocId(eventId, ip))
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
 * ロック期限超過後、または前回の失敗から十分時間が経過している場合は失敗回数をリセットする。
 */
export async function recordPasswordAttempt(
  eventId: string,
  ip: string = 'unknown-ip',
  success: boolean = false,
): Promise<void> {
  const lockRef = db.collection('rate_limits').doc(getLockDocId(eventId, ip))
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
      const data = doc.data()
      const lockedUntil =
        data?.lockedUntil?.toMillis?.() ?? data?.lockedUntil?.getTime?.() ?? 0
      const updatedAt =
        data?.updatedAt?.toMillis?.() ?? data?.updatedAt?.getTime?.() ?? 0

      // ロック期限が過ぎている、または直近の試行からタイムアウトしている場合はカウントをリセット
      const isLockExpired = lockedUntil > 0 && lockedUntil <= now
      const isWindowExpired = updatedAt > 0 && now - updatedAt > PASSWORD_LOCKOUT_MS
      const currentFailures = isLockExpired || isWindowExpired ? 1 : (data?.failures || 0) + 1

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
 * - パスワードが設定されている場合は x-event-password ヘッダーで検証（IP×イベント単位の総当たり防御付き）
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
    const clientIp = getClientIp(req.headers)

    // ブルートフォースによるロック状態を検証（IP × イベント単位）
    const lockStatus = await checkPasswordLock(eventId, clientIp)
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

    await recordPasswordAttempt(eventId, clientIp, Boolean(passwordValid))

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
