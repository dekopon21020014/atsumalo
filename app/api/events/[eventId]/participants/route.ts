// 例：app/api/participants/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = await params
  const snap = await db
    .collection("events")
    .doc(eventId)
    .collection("participants")
    .orderBy("createdAt")
    .get()

  const participants = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ participants })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { eventId, name, grade, gradePriority, schedule } = body

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "eventId が必要です" }, { status: 400 })
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

  try {
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
      createdAt: FieldValue.serverTimestamp(),
    })

    const updateData: Record<string, any> = {
      gradeOptions: FieldValue.arrayUnion(grade),
    }
    if (gradePriority != null) {
      updateData[`gradeOrder.${grade}`] = gradePriority
    }
    await db.collection("events").doc(eventId).update(updateData)

    return NextResponse.json({ message: "保存しました", id: docRef.id })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}


