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
  const { eventId, name, grade, schedule } = body

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "eventId が必要です" }, { status: 400 })
  }  
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "名前が必要です" }, { status: 400 })
  }
  if (!grade || typeof grade !== "string") {
    return NextResponse.json({ error: "学年が必要です" }, { status: 400 })
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

    return NextResponse.json({ message: "保存しました", id: docRef.id })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const { eventId, participantId } = await params
  const { name, schedule, grade } = await req.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '名前が必要です' }, { status: 400 })
  }
  if (!grade || typeof grade !== 'string') {
    return NextResponse.json({ error: '学年が必要です' }, { status: 400 })
  }
  if (!schedule || typeof schedule !== 'object') {
    return NextResponse.json({ error: 'スケジュールが必要です' }, { status: 400 })
  }

  try {
    await db
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(participantId)
      .update({
        name,
        grade,
        schedule,
        updatedAt: FieldValue.serverTimestamp(),
      })
    return NextResponse.json({ message: '更新しました' })
  } catch (err) {
    console.error('更新エラー:', err)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const { eventId, participantId } = params

  try {
    await db
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(participantId)
      .delete()
    return NextResponse.json({ message: '削除しました' })
  } catch (err) {
    console.error('削除エラー:', err)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}
