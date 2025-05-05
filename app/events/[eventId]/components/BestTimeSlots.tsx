"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Participant } from "./types"
import { days, periods } from "./constants"

type Props = {
  participants: Participant[]
}

export default function BestTimeSlots({ participants }: Props) {
  const bestSlots = getBestSlots(participants)

  function getBestSlots(participants: Participant[]) {
    const all = []

    for (const day of days) {
      for (const period of periods) {
        const key = `${day}-${period}`
        const available = participants.filter((p) => p.schedule[key] === "available")
        all.push({
          day,
          period,
          count: available.length,
          names: available.map((p) => p.name),
        })
      }
    }

    return all.sort((a, b) => b.count - a.count).slice(0, 3)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>おすすめ時間帯</CardTitle>
        <CardDescription>参加可能者が多い時間を表示</CardDescription>
      </CardHeader>
      <CardContent>
        {bestSlots.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">参加者がいません</div>
        ) : (
          <div className="space-y-4">
            {bestSlots.map((slot, i) => (
              <div key={i} className="p-3 bg-green-50 border border-green-100 rounded">
                <div className="font-medium">{i + 1}. {slot.day}曜 {slot.period}限</div>
                <div className="text-sm mt-1">参加可能: {slot.count}人</div>
                <div className="text-xs text-muted-foreground">{slot.names.join(", ")}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
