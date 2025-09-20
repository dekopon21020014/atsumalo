import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import type { DocumentData, DocumentReference } from "firebase-admin/firestore"
import { db, FieldValue } from "@/lib/firebase"

type RateLimitEntry = {
  count: number
  expiresAt: number
}

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_LIMIT = 60

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const [first] = forwarded.split(",")
    if (first) return first.trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp

  // @ts-expect-error -- NextRequest#ip exists in the Node.js runtime
  if (req.ip) return String(req.ip)

  return "anonymous"
}

export function applyRateLimit(
  req: NextRequest,
  { limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS } = {},
): NextResponse | null {
  const key = getClientIdentifier(req)
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing || existing.expiresAt <= now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs })
    return null
  }

  if (existing.count >= limit) {
    const retrySeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000))
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retrySeconds) } },
    )
  }

  existing.count += 1
  return null
}

const ADMIN_TOKEN = process.env.ADMIN_ACCESS_TOKEN

export function isAdminRequest(req: NextRequest): boolean {
  if (!ADMIN_TOKEN) return false
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  const provided = auth.slice(7).trim()
  return provided !== "" && provided === ADMIN_TOKEN
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!ADMIN_TOKEN) {
    console.error("ADMIN_ACCESS_TOKEN is not configured")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function getEventDocument(eventId: string) {
  const ref = db.collection("events").doc(eventId)
  const snap = await ref.get()
  return { ref, snap }
}

async function migrateLegacyPassword(
  ref: DocumentReference,
  data: DocumentData,
): Promise<string | null> {
  const legacy = typeof data.password === "string" && data.password.trim() !== "" ? data.password : null
  if (!legacy) return null

  const hashed = await bcrypt.hash(legacy, 12)
  try {
    await ref.update({ passwordHash: hashed, password: FieldValue.delete() })
  } catch (err) {
    console.error("Failed to migrate legacy password", err)
  }
  delete data.password
  data.passwordHash = hashed
  return hashed
}

export async function resolvePasswordHash(
  ref: DocumentReference,
  data: DocumentData,
): Promise<string | null> {
  if (typeof data.passwordHash === "string" && data.passwordHash.trim() !== "") {
    return data.passwordHash
  }
  return migrateLegacyPassword(ref, data)
}

export async function verifyEventPassword(
  ref: DocumentReference,
  data: DocumentData,
  provided: string | null,
): Promise<boolean> {
  const hash = await resolvePasswordHash(ref, data)
  if (!hash) {
    return true
  }
  if (!provided) {
    return false
  }
  try {
    return await bcrypt.compare(provided, hash)
  } catch (err) {
    console.error("Failed to compare event password", err)
    return false
  }
}

export function extractPasswordFromRequest(req: NextRequest): string | null {
  const header = req.headers.get("x-event-password")
  if (header) return header
  try {
    const url = new URL(req.url)
    const fromQuery = url.searchParams.get("password")
    if (fromQuery) return fromQuery
  } catch {
    // ignore malformed URL
  }
  return null
}

export function sanitizeEventData<T extends DocumentData>(data: T): Omit<T, "password" | "passwordHash"> {
  const clone = { ...data }
  delete clone.password
  delete clone.passwordHash
  return clone
}

export function requiresPassword(data: DocumentData): boolean {
  const hash = typeof data.passwordHash === "string" && data.passwordHash.trim() !== ""
  const legacy = typeof data.password === "string" && data.password.trim() !== ""
  return hash || legacy
}

export function buildUnauthorizedResponse(message = "password required"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export async function hashEventPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

