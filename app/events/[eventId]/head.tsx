// app/events/[eventId]/head.tsx
import { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: { eventId: string }
}): Promise<Metadata> {
  // API からイベント情報を取得
  const res = await fetch(`/api/events/${params.eventId}`)
  const data = await res.json()

  const title = data.name
  const description = data.description

  return {
    title,
    description,  
  }
}
