import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export async function POST(req: NextRequest) {
  const { name, description } = await req.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'イベント名が必要です' }, { status: 400 })
  }
  if (description != null && typeof description !== 'string') {
    return NextResponse.json({ error: '説明は文字列で入力してください' }, { status: 400 })
  }

  try {
    const docRef = await db.collection('events').add({
      name,
      description: description || '',
      createdAt: new Date(),
    })
    return NextResponse.json({ id: docRef.id })
  } catch (err) {
    console.error('イベント作成エラー:', err)
    return NextResponse.json({ error: 'イベントの作成に失敗しました' }, { status: 500 })
  }
}
