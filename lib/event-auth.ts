import crypto from "crypto"
import type { NextRequest } from "next/server"

function getEventSecret(): string {
  const secret = process.env.EVENT_PASSWORD_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("EVENT_PASSWORD_SECRET is not configured or too short")
  }
  return secret
}

export function createEventAccessToken(eventId: string, password: string): string {
  const secret = getEventSecret()
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(`${eventId}:${password}`)
  return hmac.digest("hex")
}

export function verifyEventAccessToken(
  token: string | null | undefined,
  eventId: string,
  password: string | undefined,
): boolean {
  if (!password) return true
  if (!token) return false

  try {
    const expected = createEventAccessToken(eventId, password)
    const expectedBuffer = Buffer.from(expected, "hex")
    const providedBuffer = Buffer.from(token, "hex")
    if (expectedBuffer.length !== providedBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  } catch (err) {
    console.error("Failed to verify event access token", err)
    return false
  }
}

export function extractEventAccessToken(req: NextRequest): string | null {
  const headerToken = req.headers.get("x-event-token")
  if (headerToken && headerToken.trim()) {
    return headerToken.trim()
  }

  const authorization = req.headers.get("authorization")
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    if (match) {
      return match[1].trim()
    }
  }

  return null
}

export function passwordsMatch(candidate: string, actual: string): boolean {
  const candidateBuffer = Buffer.from(candidate)
  const actualBuffer = Buffer.from(actual)
  if (candidateBuffer.length !== actualBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(candidateBuffer, actualBuffer)
}
