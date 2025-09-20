import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorizeCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET_TOKEN
  if (!secret) {
    console.error("CRON_SECRET_TOKEN is not configured")
    return {
      ok: false as const,
      status: 500 as const,
      body: { error: "cron secret not configured" },
    }
  }

  const header = req.headers.get("authorization")
  if (header && header.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim()
    if (token === secret) {
      return { ok: true as const }
    }
  }

  const urlToken = new URL(req.url).searchParams.get("token")
  if (urlToken && urlToken === secret) {
    return { ok: true as const }
  }

  return { ok: false as const, status: 401 as const, body: { error: "unauthorized" } }
}

export async function GET(req: NextRequest) {
  const auth = authorizeCron(req)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

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
