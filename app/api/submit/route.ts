// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, schedule } = body

  if (!name || !schedule || typeof schedule !== "object") {
    return NextResponse.json({ error: "名前とスケジュールが必要です" }, { status: 400 })
  }

  try {
    const participantsRef = db.collection("participants")
    await participantsRef.add({
      name,
      schedule,
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ message: "保存しました" })
  } catch (err) {
    console.error("保存エラー:", err)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
