import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

import { GET } from "./route"

const eventId = "event-123"

const firebaseMocks = vi.hoisted(() => {
  const mockCollection = vi.fn()
  const mockDoc = vi.fn()
  const mockGet = vi.fn()
  const mockSubCollection = vi.fn()
  const mockOrderBy = vi.fn()
  const mockParticipantsGet = vi.fn()

  return {
    mockCollection,
    mockDoc,
    mockGet,
    mockSubCollection,
    mockOrderBy,
    mockParticipantsGet,
  }
})


vi.mock("@/lib/firebase", () => ({
  db: {
    collection: firebaseMocks.mockCollection,
  },
  FieldValue: {
    arrayUnion: vi.fn(),
    serverTimestamp: vi.fn(),
  },
}))

describe("GET /api/events/[eventId]", () => {
  let eventData: Record<string, any>
  let participantsDocs: Array<{ id: string; data: () => Record<string, any> }>

  beforeEach(() => {
    firebaseMocks.mockCollection.mockReset()
    firebaseMocks.mockDoc.mockReset()
    firebaseMocks.mockGet.mockReset()
    firebaseMocks.mockSubCollection.mockReset()
    firebaseMocks.mockOrderBy.mockReset()
    firebaseMocks.mockParticipantsGet.mockReset()

    eventData = {
      name: "Sample Event",
      description: "Description",
      eventType: "recurring",
      scheduleTypes: [],
      xAxis: [],
      yAxis: [],
      password: "super-secret",
    }
    participantsDocs = []

    firebaseMocks.mockGet.mockImplementation(async () => ({
      exists: true,
      id: eventId,
      data: () => eventData,
    }))

    firebaseMocks.mockParticipantsGet.mockImplementation(async () => ({
      docs: participantsDocs,
    }))

    firebaseMocks.mockOrderBy.mockImplementation(() => ({
      get: firebaseMocks.mockParticipantsGet,
    }))

    firebaseMocks.mockSubCollection.mockImplementation((subCollectionName: string) => {
      if (subCollectionName !== "participants") {
        throw new Error(`Unexpected sub-collection: ${subCollectionName}`)
      }
      return {
        orderBy: firebaseMocks.mockOrderBy,
      }
    })

    firebaseMocks.mockDoc.mockImplementation((requestedId: string) => {
      if (requestedId !== eventId) {
        throw new Error(`Unexpected document id: ${requestedId}`)
      }
      return {
        get: firebaseMocks.mockGet,
        collection: firebaseMocks.mockSubCollection,
      }
    })

    firebaseMocks.mockCollection.mockImplementation((collectionName: string) => {
      if (collectionName !== "events") {
        throw new Error(`Unexpected collection: ${collectionName}`)
      }
      return {
        doc: firebaseMocks.mockDoc,
      }
    })

    process.env.EVENT_ACCESS_TOKEN_SECRET = "test-secret"
  })

  afterEach(() => {
    delete process.env.EVENT_ACCESS_TOKEN_SECRET
  })

  it("allows access to a password-protected event when only a valid token is provided", async () => {
    const token = jwt.sign({ eventId }, process.env.EVENT_ACCESS_TOKEN_SECRET as string)
    const req = {
      url: `https://example.com/api/events/${eventId}`,
      headers: new Headers({ Authorization: `Bearer ${token}` }),
    } as unknown as NextRequest
    const context = { params: Promise.resolve({ eventId }) }

    const res = await GET(req, context)

    expect(res.status).toBe(200)
    const payload = await res.json()
    expect(payload.id).toBe(eventId)
    expect(payload.name).toBe(eventData.name)
    expect(payload.participants).toEqual([])
  })

  it("returns 401 when both token and provided password are invalid", async () => {
    const req = {
      url: `https://example.com/api/events/${eventId}?password=wrong`,
      headers: new Headers(),
    } as unknown as NextRequest
    const context = { params: Promise.resolve({ eventId }) }

    const res = await GET(req, context)

    expect(res.status).toBe(401)
    const payload = await res.json()
    expect(payload).toEqual({ error: "password required" })
  })
})
