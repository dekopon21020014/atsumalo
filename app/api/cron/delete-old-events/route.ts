import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CRON_SECRET = process.env.CRON_SECRET

// Firestoreのバッチ処理は最大500件まで。
// participants サブコレクションも削除対象のため、
// 1イベントあたり最大100人を想定し、安全マージンを持たせて50件ずつ処理する。
const EVENTS_PER_RUN = 50

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

    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 3)

    const snapshot = await db
      .collection("events")
      .where("createdAt", "<", cutoff)
      .limit(EVENTS_PER_RUN)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ deleted: 0, deletedParticipants: 0 })
    }

    let totalDeletedEvents = 0
    let totalDeletedParticipants = 0

    for (const eventDoc of snapshot.docs) {
      // participants サブコレクションを全件取得してからイベントごとにバッチ削除する。
      // Firestoreでは親ドキュメントを削除してもサブコレクションは自動削除されないため、
      // 明示的に削除する必要がある。
      const participantsSnap = await eventDoc.ref.collection("participants").get()

      const batch = db.batch()

      participantsSnap.docs.forEach((p) => batch.delete(p.ref))
      batch.delete(eventDoc.ref)

      await batch.commit()

      totalDeletedParticipants += participantsSnap.size
      totalDeletedEvents += 1
    }

    return NextResponse.json({
      deleted: totalDeletedEvents,
      deletedParticipants: totalDeletedParticipants,
    })
  } catch (err) {
    console.error("Failed to delete old events", err)
    return NextResponse.json(
      { error: "Failed to delete old events" },
      { status: 500 }
    )
  }
}
