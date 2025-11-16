// 例：app/api/participants/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'
import { randomUUID } from 'crypto'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { ensurePasswordHash, verifyPassword } from '@/lib/password-utils'

type EventAuthResult =
  | { eventSnap: DocumentSnapshot; requireParticipantToken: boolean }
  | { response: NextResponse }

async function authorizeEventAccess(req: NextRequest, eventId: string): Promise<EventAuthResult> {
  const eventSnap = await db.collection("events").doc(eventId).get()
  if (!eventSnap.exists) {
    return { response: NextResponse.json({ error: "not found" }, { status: 404 }) }
  }

  const eventData = eventSnap.data() || {}
  const url = new URL(req.url)
  const providedPassword =
    url.searchParams.get("password") || req.headers.get("x-event-password") || ""
  const providedToken =
    url.searchParams.get("token") ||
    req.headers.get("x-event-token") ||
    (req.headers.get("authorization")?.split(" ")[1] ?? "")

  const storedPassword = typeof eventData.password === "string" ? eventData.password : ""
  const passwordRequired = storedPassword.trim() !== ""
  const tokens: string[] = Array.isArray(eventData.tokens)
    ? eventData.tokens.filter((token: unknown): token is string =>
        typeof token === "string" && token.trim() !== "",
      )
    : typeof eventData.token === "string" && eventData.token.trim() !== ""
      ? [eventData.token]
      : []
  const tokenRequired = tokens.length > 0

  if (passwordRequired) {
    const hashedPassword = await ensurePasswordHash(eventSnap.ref, storedPassword)
    const passwordValid =
      providedPassword && (await verifyPassword(hashedPassword, providedPassword))
    if (!passwordValid) {
      return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
    }
  }

  if (tokenRequired && !tokens.includes(providedToken)) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
  }

  // TODO: ユーザー認証導入時に Firebase Auth 等でユーザー権限チェックを追加する

  return { eventSnap, requireParticipantToken: tokenRequired }
}

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params
  const authResult = await authorizeEventAccess(req, eventId)
  if ("response" in authResult) {
    return authResult.response
  }

  const snap = await authResult.eventSnap.ref
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
  const body = await req.json()
  const { eventId: bodyEventId, name, grade, gradePriority, schedule, comment: rawComment } = body

  if (!bodyEventId || typeof bodyEventId !== "string") {
    return NextResponse.json({ error: "eventId が必要です" }, { status: 400 })
  }
  if (bodyEventId !== eventId) {
    return NextResponse.json({ error: "eventId が一致しません" }, { status: 400 })
  }

  const authResult = await authorizeEventAccess(req, eventId)
  if ("response" in authResult) {
    return authResult.response
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
    const participantsRef = authResult.eventSnap.ref.collection("participants")
    // ────────────────────────────────────────

    const participantData: Record<string, any> = {
      name,
      grade,
      schedule,
      comment,
      createdAt: FieldValue.serverTimestamp(),
    }

    const editToken = authResult.requireParticipantToken ? randomUUID() : ""
    if (editToken) {
      participantData.editToken = editToken
    }

    const docRef = await participantsRef.add(participantData)

    const updateData: Record<string, any> = {
      gradeOptions: FieldValue.arrayUnion(grade),
    }
    if (gradePriority != null) {
      updateData.gradeOrder = { [grade]: gradePriority }
    }
    await db.collection("events").doc(eventId).set(updateData, { merge: true })

    const responseBody: Record<string, any> = { message: "保存しました", id: docRef.id }
    if (editToken) {
      responseBody.editToken = editToken
    }
    return NextResponse.json(responseBody)
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}

