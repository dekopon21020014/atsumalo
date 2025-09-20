import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "@/lib/firebase"
import {
  applyRateLimit,
  buildUnauthorizedResponse,
  extractPasswordFromRequest,
  getEventDocument,
  isAdminRequest,
  requiresPassword,
  verifyEventPassword,
} from "@/lib/security"

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const rateLimit = applyRateLimit(req, { limit: 60, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const { eventId } = await params
  const { ref, snap } = await getEventDocument(eventId)
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const eventData = snap.data() || {}
  const admin = isAdminRequest(req)
  if (!admin && requiresPassword(eventData)) {
    const provided = extractPasswordFromRequest(req)
    const allowed = await verifyEventPassword(ref, eventData, provided)
    if (!allowed) {
      return buildUnauthorizedResponse()
    }
  }

  const snapParticipants = await ref
    .collection("participants")
    .orderBy("createdAt")
    .get()

  const participants = snapParticipants.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ participants })
}

export async function POST(req: NextRequest) {
  const rateLimit = applyRateLimit(req, { limit: 30, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const body = await req.json()
  const { eventId, name, grade, gradePriority, schedule, comment: rawComment } = body

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "eventId が必要です" }, { status: 400 })
  }

  const { ref, snap } = await getEventDocument(eventId)
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const eventData = snap.data() || {}
  const admin = isAdminRequest(req)
  const providedPassword =
    typeof body?.eventPassword === "string" ? body.eventPassword : extractPasswordFromRequest(req)
  if (!admin && requiresPassword(eventData)) {
    const allowed = await verifyEventPassword(ref, eventData, providedPassword ?? null)
    if (!allowed) {
      return buildUnauthorizedResponse()
    }
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
    const participantsRef = ref.collection("participants")
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
    await ref.set(updateData, { merge: true })

    return NextResponse.json({ message: "保存しました", id: docRef.id })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
