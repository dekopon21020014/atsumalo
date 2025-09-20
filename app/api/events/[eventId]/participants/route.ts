// 例：app/api/participants/[eventId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db, FieldValue } from "@/lib/firebase"
import { extractEventAccessToken, verifyEventAccessToken } from "@/lib/event-auth"

async function assertEventAccess(req: NextRequest, eventId: string) {
  const eventSnap = await db.collection("events").doc(eventId).get()
  if (!eventSnap.exists) {
    return { ok: false, status: 404 as const, body: { error: "not found" } }
  }

  const data = eventSnap.data() || {}
  if (data.password) {
    const token = extractEventAccessToken(req)
    const valid = verifyEventAccessToken(token, eventId, data.password)
    if (!valid) {
      return { ok: false, status: 401 as const, body: { error: "password required" } }
    }
  }

  return { ok: true as const, data }
}

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params
  const access = await assertEventAccess(req, eventId)
  if (!access.ok) {
    return NextResponse.json(access.body, { status: access.status })
  }

  const snap = await db
    .collection("events")
    .doc(eventId)
    .collection("participants")
    .orderBy("createdAt")
    .get()

  const participants = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ participants })
}

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params
  const body = await req.json()
  const { name, grade, gradePriority, schedule, comment: rawComment } = body

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
    const access = await assertEventAccess(req, eventId)
    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status })
    }

    // ────────────── ここを修正 ──────────────
    // トップレベルの 'events' コレクション内の eventId ドキュメントを取得して、
    // その下のサブコレクション 'participants' を参照します。
    const participantsRef = db
      .collection("events")
      .doc(eventId)
      .collection("participants")
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
    await db.collection("events").doc(eventId).set(updateData, { merge: true })

    return NextResponse.json({ message: "保存しました", id: docRef.id })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}


