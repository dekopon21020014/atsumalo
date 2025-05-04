// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, FieldValue } from '@/lib/firebase'  // FieldValue をインポート

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, grade } = body

  // 必須フィールドのバリデーション
  if (!name || !grade) {
    return NextResponse.json({ error: '名前と学年は必須です' }, { status: 400 })
  }

  try {
    // Firestoreに新しいメンバーを追加
    const membersRef = db.collection('members')  // membersコレクションを参照
    await membersRef.add({
      name,
      grade,
      status: 0,  // 初期値は0
      createdAt: FieldValue.serverTimestamp(),  // Firestoreで作成日時を記録
    })

    return NextResponse.json({ message: '保存しました' })
  } catch (err) {
    console.error('保存エラー:', err)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}
