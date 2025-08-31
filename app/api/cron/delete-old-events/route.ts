import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
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
