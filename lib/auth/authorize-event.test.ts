import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  authorizeEventAccess,
  safeTokenCompare,
  checkPasswordLock,
  recordPasswordAttempt,
} from './authorize-event'
import { getClientIp } from '@/lib/rate-limit'
import { db } from '@/lib/firebase'
import { verifyPassword } from '@/lib/password-utils'

vi.mock('@/lib/firebase', () => {
  return {
    db: {
      collection: vi.fn(),
      runTransaction: vi.fn(),
    },
  }
})

vi.mock('@/lib/password-utils', () => {
  return {
    ensurePasswordHash: vi.fn((_ref, p) => Promise.resolve(`hashed_${p}`)),
    verifyPassword: vi.fn((hashed, provided) => Promise.resolve(hashed === `hashed_${provided}`)),
  }
})

describe('Security & Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('safeTokenCompare', () => {
    it('同一のトークンで true を返すこと', () => {
      expect(safeTokenCompare('abc-123-token', 'abc-123-token')).toBe(true)
    })

    it('異なるトークンで false を返すこと', () => {
      expect(safeTokenCompare('abc-123-token', 'xyz-999-token')).toBe(false)
      expect(safeTokenCompare('abc', 'abcd')).toBe(false)
    })

    it('空文字や無効な値で false を返すこと', () => {
      expect(safeTokenCompare('', 'token')).toBe(false)
      expect(safeTokenCompare('token', '')).toBe(false)
      expect(safeTokenCompare(null as any, 'token')).toBe(false)
    })
  })

  describe('getClientIp', () => {
    it('x-real-ip がある場合はそれを優先すること', () => {
      const headers = new Headers({
        'x-real-ip': '203.0.113.1',
        'x-forwarded-for': '198.51.100.1, 192.0.2.1',
      })
      expect(getClientIp(headers)).toBe('203.0.113.1')
    })

    it('x-forwarded-for の先頭を取得すること', () => {
      const headers = new Headers({
        'x-forwarded-for': '198.51.100.5, 192.0.2.1',
      })
      expect(getClientIp(headers)).toBe('198.51.100.5')
    })

    it('ヘッダーが無い場合は unknown-ip を返すこと', () => {
      const headers = new Headers()
      expect(getClientIp(headers)).toBe('unknown-ip')
    })
  })

  describe('Password Lockout Mechanism', () => {
    it('ロック期限内の場合は 429 ロック状態を返すこと', async () => {
      const mockDocGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          failures: 10,
          lockedUntil: { toMillis: () => Date.now() + 60000 },
        }),
      })
      vi.mocked(db.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockDocGet }),
      } as any)

      const lockStatus = await checkPasswordLock('test-event', '192.0.2.1')
      expect(lockStatus.locked).toBe(true)
      expect(lockStatus.retryAfter).toBeGreaterThan(0)
    })

    it('ロックされていない場合は locked: false を返すこと', async () => {
      const mockDocGet = vi.fn().mockResolvedValue({
        exists: false,
      })
      vi.mocked(db.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockDocGet }),
      } as any)

      const lockStatus = await checkPasswordLock('test-event', '192.0.2.1')
      expect(lockStatus.locked).toBe(false)
    })

    it('ロック期限切れ後の失敗では failures を 1 にリセットすること（タイポ即再ロック防止）', async () => {
      const mockSet = vi.fn()
      const mockDoc = {
        data: () => ({
          failures: 10,
          // 既に期限切れのロック
          lockedUntil: { toMillis: () => Date.now() - 5000 },
          updatedAt: { toMillis: () => Date.now() - 10000 },
        }),
      }

      vi.mocked(db.runTransaction).mockImplementation(async (cb: any) => {
        await cb({
          get: vi.fn().mockResolvedValue(mockDoc),
          set: mockSet,
          delete: vi.fn(),
        })
      })

      await recordPasswordAttempt('test-event', '192.0.2.1', false)

      expect(mockSet).toHaveBeenCalled()
      const savedPayload = mockSet.mock.calls[0][1]
      expect(savedPayload.failures).toBe(1)
    })
  })
})
