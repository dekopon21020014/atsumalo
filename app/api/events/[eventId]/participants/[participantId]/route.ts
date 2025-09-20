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

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } },
) {
  const rateLimit = applyRateLimit(req, { limit: 30, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const { eventId, participantId } = await params
  const body = await req.json()
  const { name, grade, gradePriority, schedule, comment: rawComment } = body

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
    await ref
      .collection("participants")
      .doc(participantId)
      .update({
        name,
        grade,
        schedule,
        comment,
        updatedAt: FieldValue.serverTimestamp(),
      })

    const updateData: Record<string, any> = {
      gradeOptions: FieldValue.arrayUnion(grade),
    }
    if (gradePriority != null) {
      updateData.gradeOrder = { [grade]: gradePriority }
    }
    await ref.set(updateData, { merge: true })
    return NextResponse.json({ message: "更新しました" })
  } catch (err) {
    console.error("更新エラー:", err)
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } },
) {
  const rateLimit = applyRateLimit(req, { limit: 30, windowMs: 60_000 })
  if (rateLimit) return rateLimit

  const { eventId, participantId } = params
  const { ref, snap } = await getEventDocument(eventId)
  if (!snap.exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const eventData = snap.data() || {}
  const admin = isAdminRequest(req)
  const providedPassword = extractPasswordFromRequest(req)
  if (!admin && requiresPassword(eventData)) {
    const allowed = await verifyEventPassword(ref, eventData, providedPassword)
    if (!allowed) {
      return buildUnauthorizedResponse()
    }
  }

  try {
    await ref.collection("participants").doc(participantId).delete()
    return NextResponse.json({ message: "削除しました" })
  } catch (err) {
    console.error("削除エラー:", err)
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })
  }
}
