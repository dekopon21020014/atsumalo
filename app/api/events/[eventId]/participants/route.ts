// 例：app/api/participants/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'

type GuardedEventResult =
  | { eventRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>; eventData: FirebaseFirestore.DocumentData }
  | { response: NextResponse }

function normalizeTokens(tokens: unknown): string[] {
  if (Array.isArray(tokens)) {
    return tokens
      .map((token) => (typeof token === "string" ? token.trim() : ""))
      .filter((token) => token !== "")
  }
  if (typeof tokens === "string") {
    const trimmed = tokens.trim()
    return trimmed ? [trimmed] : []
  }
  return []
}

function extractBearer(value: string | null): string {
  if (!value) return ""
  const match = value.match(/^Bearer\s+(.+)$/i)
  if (match && match[1]) {
    return match[1]
  }
  return value
}

async function loadEventWithAccessGuard(req: NextRequest, eventId: string): Promise<GuardedEventResult> {
  const eventRef = db.collection("events").doc(eventId)
  const eventSnap = await eventRef.get()
  if (!eventSnap.exists) {
    return { response: NextResponse.json({ error: "not found" }, { status: 404 }) }
  }

  const eventData = eventSnap.data() || {}

  // TODO: Add Firebase Auth based authorization here when user accounts are introduced.

  const url = new URL(req.url)
  const passwordFromHeader = req.headers.get("x-event-password")
  const passwordFromQuery = url.searchParams.get("password")
  const providedPassword = passwordFromHeader ?? passwordFromQuery ?? ""

  const tokenFromHeader = req.headers.get("x-event-token")
  const bearerToken = extractBearer(req.headers.get("authorization"))
  const tokenFromQuery = url.searchParams.get("token")
  const providedToken = tokenFromHeader ?? bearerToken ?? tokenFromQuery ?? ""

  const expectedPassword = typeof eventData.password === "string" ? eventData.password : ""
  const configuredTokens = normalizeTokens((eventData as any).tokens ?? (eventData as any).token)

  if (expectedPassword && providedPassword !== expectedPassword) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
  }

  if (configuredTokens.length > 0 && !configuredTokens.includes(providedToken)) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
  }

  return { eventRef, eventData }
}

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params
  const guarded = await loadEventWithAccessGuard(req, eventId)
  if (!("eventRef" in guarded)) {
    return guarded.response
  }

  const snap = await guarded.eventRef
    .collection("participants")
    .orderBy("createdAt")
    .get()

  const participants = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ participants })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params
  const guarded = await loadEventWithAccessGuard(req, eventId)
  if (!("eventRef" in guarded)) {
    return guarded.response
  }

  const body = await req.json()
  const {
    eventId: bodyEventId,
    name,
    grade,
    gradePriority,
    schedule,
    comment: rawComment,
  } = body

  if (bodyEventId && bodyEventId !== eventId) {
    return NextResponse.json({ error: "eventId mismatch" }, { status: 400 })
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "名前が必要です" }, { status: 400 })
  }
  if (!grade || typeof grade !== "string") {
    return NextResponse.json({ error: "所属/役職が必要です" }, { status: 400 })
  }
  if (gradePriority != null && typeof gradePriority !== "number") {
    return NextResponse.json({ error: "gradePriority は数値で指定してください" }, { status: 400 })
  }
  if (!schedule || typeof schedule !== "object") {
    return NextResponse.json({ error: "スケジュールが必要です" }, { status: 400 })
  }

  let comment = ""
  if (rawComment != null) {
    if (typeof rawComment !== "string") {
      return NextResponse.json({ error: "コメントは文字列で指定してください" }, { status: 400 })
    }
    const trimmed = rawComment.trim()
    if (trimmed !== "") {
      comment = trimmed
    }
  }

  try {
    // ────────────── ここを修正 ──────────────
    // トップレベルの 'events' コレクション内の eventId ドキュメントを取得して、
    // その下のサブコレクション 'participants' を参照します。
    const participantsRef = guarded.eventRef.collection("participants")
    // ────────────────────────────────────────

    const docRef = await participantsRef.add({
      name,
      grade,
      schedule,
      comment,
      createdAt: FieldValue.serverTimestamp(),
    })

    const updateData: Record<string, any> = {
      gradeOptions: FieldValue.arrayUnion(grade),
    }
    if (gradePriority != null) {
      updateData.gradeOrder = { [grade]: gradePriority }
    }
    await guarded.eventRef.set(updateData, { merge: true })

    return NextResponse.json({ message: "保存しました", id: docRef.id })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}


