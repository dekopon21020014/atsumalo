import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEventService, submitAnswerService, ValidationError } from './events'
import { db } from '@/lib/firebase'
import type { AuthorizedEvent } from '@/lib/auth/authorize-event'

// モック化
vi.mock('@/lib/firebase', () => {
  class FieldPath {
    segments: string[]
    constructor(...segments: string[]) {
      this.segments = segments
    }
  }
  return {
    db: {
      collection: vi.fn(),
    },
    FieldValue: {
      serverTimestamp: vi.fn(),
      arrayUnion: vi.fn((v: unknown) => ({ arrayUnion: v })),
    },
    FieldPath,
  }
})

const validEvent = {
  name: 'テストイベント',
  eventType: 'onetime' as const,
  scheduleTypes: [{ id: 'av', label: '○', color: 'bg-green-200 text-green-800', isAvailable: true }],
  dateTimeOptions: ['12/1(日)'],
}

function createAuthorizedEvent(opts: { id?: string; requireParticipantToken?: boolean } = {}) {
  const mockAdd = vi.fn().mockResolvedValue({ id: 'test-participant-id' })
  const mockUpdate = vi.fn().mockResolvedValue(true)
  const ref = {
    id: opts.id ?? 'test-event',
    collection: vi.fn().mockReturnValue({ add: mockAdd }),
    update: mockUpdate,
  }
  const auth = {
    eventSnap: { ref },
    requireParticipantToken: opts.requireParticipantToken ?? false,
  } as unknown as AuthorizedEvent
  return { auth, mockAdd, mockUpdate }
}

describe('Event Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEventService', () => {
    it('正常にイベントを作成できること', async () => {
      const mockAdd = vi.fn().mockResolvedValue({ id: 'test-event-id' })
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as never)

      const id = await createEventService(validEvent)

      expect(id).toBe('test-event-id')
      expect(mockAdd).toHaveBeenCalled()

      const payload = mockAdd.mock.calls[0][0]
      expect(payload.name).toBe('テストイベント')
      expect(payload.eventType).toBe('onetime')
    })

    it('スキーマに合わない入力は ValidationError になり保存しないこと', async () => {
      const mockAdd = vi.fn()
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as never)

      await expect(createEventService({ ...validEvent, name: '' })).rejects.toBeInstanceOf(ValidationError)
      await expect(createEventService({ ...validEvent, scheduleTypes: 'x' })).rejects.toBeInstanceOf(ValidationError)
      await expect(
        createEventService({ ...validEvent, dateTimeOptions: Array(101).fill('a') }),
      ).rejects.toBeInstanceOf(ValidationError)
      // onetime なのに dateTimeOptions がない（superRefine）
      await expect(
        createEventService({ ...validEvent, dateTimeOptions: undefined }),
      ).rejects.toBeInstanceOf(ValidationError)
      expect(mockAdd).not.toHaveBeenCalled()
    })
  })

  describe('submitAnswerService', () => {
    const answer = {
      eventId: 'test-event',
      name: 'Test User',
      grade: 'M1',
      schedule: [],
    }

    it('正常に回答を保存できること', async () => {
      const { auth, mockAdd, mockUpdate } = createAuthorizedEvent()

      const result = await submitAnswerService(auth, answer)

      expect(result).toEqual({ id: 'test-participant-id', editToken: '' })
      expect(mockAdd.mock.calls[0][0].name).toBe('Test User')
      expect(mockAdd.mock.calls[0][0].editToken).toBeUndefined()
      expect(mockUpdate).toHaveBeenCalledWith({ gradeOptions: { arrayUnion: 'M1' } })
    })

    it('トークン必須のイベントでは editToken を発行して返すこと', async () => {
      const { auth, mockAdd } = createAuthorizedEvent({ requireParticipantToken: true })

      const result = await submitAnswerService(auth, answer)

      expect(result.editToken).toMatch(/^[0-9a-f-]{36}$/)
      expect(mockAdd.mock.calls[0][0].editToken).toBe(result.editToken)
    })

    it('gradePriority 指定時は FieldPath で gradeOrder を更新すること（"." を含む grade でもネストしない）', async () => {
      const { auth, mockUpdate } = createAuthorizedEvent()

      await submitAnswerService(auth, { ...answer, grade: 'a.b', gradePriority: 3 })

      const [field1, value1, field2, value2] = mockUpdate.mock.calls[0]
      expect(field1).toBe('gradeOptions')
      expect(value1).toEqual({ arrayUnion: 'a.b' })
      expect((field2 as { segments: string[] }).segments).toEqual(['gradeOrder', 'a.b'])
      expect(value2).toBe(3)
    })

    it('スキーマに合わない入力は ValidationError になり保存しないこと', async () => {
      const { auth, mockAdd } = createAuthorizedEvent()

      await expect(submitAnswerService(auth, { ...answer, name: '' })).rejects.toBeInstanceOf(ValidationError)
      await expect(
        submitAnswerService(auth, { ...answer, schedule: { cell: { nested: true } } }),
      ).rejects.toBeInstanceOf(ValidationError)
      await expect(
        submitAnswerService(auth, { ...answer, comment: 'x'.repeat(1001) }),
      ).rejects.toBeInstanceOf(ValidationError)
      expect(mockAdd).not.toHaveBeenCalled()
    })

    it('認可済みイベントと eventId が異なる場合は ValidationError になること', async () => {
      const { auth, mockAdd } = createAuthorizedEvent({ id: 'other-event' })

      await expect(submitAnswerService(auth, answer)).rejects.toThrow('eventId が一致しません')
      expect(mockAdd).not.toHaveBeenCalled()
    })
  })
})
