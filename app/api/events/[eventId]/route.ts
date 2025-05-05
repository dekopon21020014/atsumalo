import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

export async function GET(
    _req: NextRequest,
    context: {
        // Next.js 14 では params が Promise になる
        params: Promise<{ eventId: string }>
    }
    ) {
    // ↓ 必ず await してから取り出す
    const { eventId } = await context.params
    const eventSnap = await db.collection("events").doc(eventId).get()
    if (!eventSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 })        

    const participantsSnap = await db
    .collection("events")
    .doc(eventId)
    .collection("participants")
    .orderBy("createdAt")
    .get()

    const participants = participantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({
        id: eventSnap.id,
        name: eventSnap.data()?.name,
        description: eventSnap.data()?.description,
        participants 
    })
}

export async function PUT(req: NextRequest, { params }: { params: { eventId: string } }) {
    const { eventId } = params
    const { name, description } = await req.json()

    if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'イベント名が必要です' }, { status: 400 })
    }
    if (description != null && typeof description !== 'string') {
        return NextResponse.json({ error: '説明は文字列で入力してください' }, { status: 400 })
    }

    try {
        await db.collection('events').doc(eventId).update({
            name,
            description,
            updatedAt: new Date(),
        })
        return NextResponse.json({ message: '更新しました' })
    } catch (err) {
        console.error('イベント更新エラー:', err)
        return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }
}
  