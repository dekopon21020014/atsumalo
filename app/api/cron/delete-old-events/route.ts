import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN

export async function GET(request: Request) {
  try {
    if (!CRON_SECRET_TOKEN) {
      console.error("CRON_SECRET_TOKEN is not configured")
      return NextResponse.json(
        { error: "Cron secret is not configured" },
        { status: 500 }
      )
    }

    const providedToken = request.headers.get("authorization")
    const normalizedToken = providedToken?.startsWith("Bearer ")
      ? providedToken.slice(7)
      : providedToken ?? undefined

    if (!normalizedToken || normalizedToken !== CRON_SECRET_TOKEN) {
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
      .get()

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    return NextResponse.json({ deleted: snapshot.size })
  } catch (err) {
    console.error("Failed to delete old events", err)
    return NextResponse.json(
      { error: "Failed to delete old events" },
      { status: 500 }
    )
  }
}
