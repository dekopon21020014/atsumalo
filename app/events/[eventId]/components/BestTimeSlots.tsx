// app/events/[eventId]/components/BestTimeSlots.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { Participant } from './types'
import { use } from 'react'

type Slot = {
  day: string
  period: string
  count: number
  names: string[]
}

type Props = {
  participants: Participant[]
  xAxis: string[]
  yAxis: string[]
  availableOptions: string[]
}

export default function BestTimeSlots({
  participants,
  xAxis,
  yAxis,
  availableOptions,
}: Props) {
  const [bestSlots, setBestSlots] = useState<Slot[]>([])
  // 参加可能者が多い上位3スロットを返す
  useEffect(() => {
    console.log('BestTimeSlots: useEffect')
    console.log('availableOptions', availableOptions)
    const newBestSlots = getBestSlots(participants, xAxis, yAxis, availableOptions)    
    setBestSlots(newBestSlots)
  }, [participants, xAxis, yAxis, availableOptions])

  function getBestSlots(
    participants: Participant[],
    xAxis: string[],
    yAxis: string[],
    availableOptions: string[]
  ): Slot[] {
    const all: Slot[] = []

    for (const day of xAxis) {
      for (const period of yAxis) {
        const key = `${day}-${period}`
        // availableOptions に含まれるステータスを「参加可能」とみなす
        const available = participants.filter(p =>
          availableOptions.includes(p.schedule[key])
        )

        all.push({
          day,
          period,
          count: available.length,
          names: available.map(p => p.name),
        })
      }
    }

    return all
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>おすすめ時間帯</CardTitle>
        <CardDescription>参加可能者が多い時間を表示</CardDescription>
      </CardHeader>
      <CardContent>
        {bestSlots.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">
            参加者がいません
          </div>
        ) : (
          <div className="space-y-4">
            {bestSlots.map((slot, i) => (
              <div
                key={i}
                className="p-3 bg-green-50 border border-green-100 rounded"
              >
                <div className="font-medium">
                  {i + 1}. {slot.day} {slot.period}
                </div>
                <div className="text-sm mt-1">
                  参加可能: {slot.count}人
                </div>
                <div className="text-xs text-muted-foreground">
                  {slot.names.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
