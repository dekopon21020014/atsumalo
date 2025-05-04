import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { name, schedule } = await req.json()
  if (!id || !name || !schedule) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 })
  }

  try {
    await db.collection("participants").doc(id).update({
      name,
      schedule,
      updatedAt: new Date(),
    })
    return NextResponse.json({ message: "更新成功" })
  } catch (err) {
    console.error("更新エラー:", err)
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params
  
    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 })
    }
  
    try {
      await db.collection("participants").doc(id).delete()
      return NextResponse.json({ message: "削除成功" })
    } catch (err) {
      console.error("削除エラー:", err)
      return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })
    }
  }
