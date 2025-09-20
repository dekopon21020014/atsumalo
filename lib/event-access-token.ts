import type { NextRequest } from "next/server"
import jwt, { type JwtPayload } from "jsonwebtoken"

interface EventAccessTokenPayload extends JwtPayload {
  eventId: string
}

function extractBearerToken(headers: Headers): string | null {
  const authorization = headers.get("authorization")
  if (!authorization) {
    return null
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return null
  }

  const token = match[1].trim()
  return token ? token : null
}

export function verifyEventAccessToken(
  req: Pick<NextRequest, "headers">,
  eventId: string,
): boolean {
  const token = extractBearerToken(req.headers)
  if (!token) {
    return false
  }

  const secret = process.env.EVENT_ACCESS_TOKEN_SECRET
  if (!secret) {
    return false
  }

  try {
    const payload = jwt.verify(token, secret)
    if (typeof payload !== "object" || payload === null) {
      return false
    }

    const { eventId: payloadEventId } = payload as EventAccessTokenPayload
    return typeof payloadEventId === "string" && payloadEventId === eventId
  } catch {
    return false
  }
}

export function getEventAccessTokenFromHeaders(headers: Headers): string | null {
  return extractBearerToken(headers)
}
