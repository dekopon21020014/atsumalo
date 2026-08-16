import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    if (!CRON_SECRET) {
      console.error("CRON_SECRET is not configured")
      return NextResponse.json(
        { error: "Cron secret is not configured" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized request" },
        { status: 401 }
      )
    }

    const now = new Date()

    // Firestoreのバッチ処理は最大500件までなのでlimit(500)を指定
    // 500件を超える場合は次回のCronで処理される
    const snapshot = await db
      .collection("rate_limits")
      .where("expiresAt", "<", now)
      .limit(500)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ deleted: 0 })
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    return NextResponse.json({ deleted: snapshot.size })
  } catch (err) {
    console.error("Failed to delete expired rate limits", err)
    return NextResponse.json(
      { error: "Failed to delete expired rate limits" },
      { status: 500 }
    )
  }
}
