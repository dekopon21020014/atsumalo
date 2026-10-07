import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEventService, submitAnswerService } from './events'
import { db } from '@/lib/firebase'
import { authorizeEventAccess } from '@/lib/auth/authorize-event'

// モック化
vi.mock('@/lib/firebase', () => {
  return {
    db: {
      collection: vi.fn(),
    },
    FieldValue: {
      serverTimestamp: vi.fn(),
      arrayUnion: vi.fn(),
    }
  }
})

vi.mock('@/lib/auth/authorize-event', () => {
  return {
    authorizeEventAccess: vi.fn()
  }
})

describe('Event Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEventService', () => {
    it('正常にイベントを作成できること', async () => {
      const mockAdd = vi.fn().mockResolvedValue({ id: 'test-event-id' })
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as any)

      const id = await createEventService({
        name: 'テストイベント',
        eventType: 'onetime',
        scheduleTypes: [{ id: 'av', label: '○', color: 'bg-green-200 text-green-800', isAvailable: true }],
        dateTimeOptions: ['12/1(日)']
      })

      expect(id).toBe('test-event-id')
      expect(mockAdd).toHaveBeenCalled()
      
      const payload = mockAdd.mock.calls[0][0]
      expect(payload.name).toBe('テストイベント')
      expect(payload.eventType).toBe('onetime')
    })
  })

  describe('submitAnswerService', () => {
    it('認証エラー時に例外を投げること', async () => {
      vi.mocked(authorizeEventAccess).mockResolvedValue({ response: {} as any })
      
      await expect(submitAnswerService({ headers: new Headers() } as any, {
        eventId: 'test-event',
        name: 'Test User',
        grade: 'M1',
        schedule: []
      })).rejects.toThrow('Unauthorized or Event Not Found')
    })

    it('正常に回答を保存できること', async () => {
      const mockAdd = vi.fn().mockResolvedValue({ id: 'test-participant-id' })
      const mockUpdate = vi.fn().mockResolvedValue(true)
      const mockEventRef = {
        collection: vi.fn().mockReturnValue({ add: mockAdd }),
        update: mockUpdate
      }
      
      vi.mocked(authorizeEventAccess).mockResolvedValue({
        eventSnap: { ref: mockEventRef } as any,
        requireParticipantToken: false
      })
      vi.mocked(db.collection).mockReturnValue({ doc: () => mockEventRef } as any)

      const result = await submitAnswerService({ headers: new Headers() } as any, {
        eventId: 'test-event',
        name: 'Test User',
        grade: 'M1',
        schedule: []
      })

      expect(result.id).toBe('test-participant-id')
      expect(mockAdd).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockAdd.mock.calls[0][0].name).toBe('Test User')
    })
  })
})
