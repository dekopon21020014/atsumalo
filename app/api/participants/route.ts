// app/api/participants/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase" // firebase-admin 専用に分離

export async function GET(req: NextRequest) {
    console.log("#### GET /api/participants ####")
  try {
    const snapshot = await db.collection("participants").get()
    const participants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return NextResponse.json({ participants })
  } catch (err) {
    console.error("データ取得エラー:", err)
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 })
  }
}
