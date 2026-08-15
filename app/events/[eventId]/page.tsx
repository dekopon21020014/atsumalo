// app/events/[eventId]/head.tsx
import { Metadata } from "next"
import EventPage from "./EventPage"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  try {
    const { eventId } = await params
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}`)
    if (!res.ok) throw new Error("failed")
    const data = await res.json()
    return {
      title: data.name,
      description: data.description,
    }
  } catch {
    return {
      title: "イベント",
      description: "",
    }
  }
}

export default function Page() {
    return (
        <EventPage/>
    )
}

