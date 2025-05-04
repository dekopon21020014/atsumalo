// app/api/events/[eventId]/participants/[participantId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const { eventId, participantId } = await params
  const { name, schedule } = await req.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '名前が必要です' }, { status: 400 })
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
