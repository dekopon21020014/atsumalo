// app/events/[eventId]/components/ScheduleSummary.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Participant } from './types'
import { scheduleTypes } from './constants'

type AvailabilityDetail = {
  type: string
  label: string
  count: number
  participants: string[]
}

type AvailabilityEntry = {
  available: number
  total: number
  details: AvailabilityDetail[]
  availableParticipants: string[]
}

type AvailabilityMap = Record<string, AvailabilityEntry>

type Props = {
  participants: Participant[]
  availableOptions: string[]
  xAxis: string[]
  yAxis: string[]
}

export default function ScheduleSummary({
  participants,
  xAxis,
  yAxis,
  availableOptions,
}: Props) {
  const [availability, setAvailability] = useState<AvailabilityMap>({})

  useEffect(() => {
    const newAvail: AvailabilityMap = {}

    for (const day of xAxis) {
      for (const period of yAxis) {
        const key = `${day}-${period}`

        // 各ステータスごとの件数と参加者名
        const details: AvailabilityDetail[] = scheduleTypes
          .map((type) => ({
            type: type.id,
            label: type.label,
            count: participants.filter((p) => p.schedule[key] === type.id)
              .length,
            participants: participants
              .filter((p) => p.schedule[key] === type.id)
              .map((p) => p.name),
          }))
          .filter((d) => d.count > 0)

        // availableOptions に含まれるステータスを「参加可能」と見なす
        const availableParticipants = participants
          .filter(
            (p) =>
              p.schedule[key] != null &&
              availableOptions &&
              availableOptions.includes(p.schedule[key])
          )
          .map((p) => p.name)        

        newAvail[key] = {
          available: availableParticipants.length,
          total: participants.length,
          details,
          availableParticipants,
        }
      }
    }

    setAvailability(newAvail)
  }, [participants, xAxis, yAxis, availableOptions])

  const availableCountsByDay = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const day of xAxis) {
      counts[day] = participants.filter((p) =>
        yAxis.some((period) => {
          const key = `${day}-${period}`
          return (
            p.schedule[key] != null &&
            availableOptions &&
            availableOptions.includes(p.schedule[key])
          )
        })
      ).length
    }
    return counts
  }, [participants, xAxis, yAxis, availableOptions])

  return (
    <Card>
      <CardHeader>
        <CardTitle>集計結果</CardTitle>
        <CardDescription>全参加者のスケジュールを集計</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="border p-2"></th>
                {xAxis.map((day) => (
                  <th
                    key={day}
                    className="border p-2 text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-2 text-center">参加可能者数</th>
                {xAxis.map((day) => (
                  <th key={day} className="border p-2 text-center">
                    {availableCountsByDay[day] ?? 0}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yAxis.map((period) => (
                <tr key={period}>
                  <td className="border p-2 text-center font-medium">
                    {period}
                  </td>
                  {xAxis.map((day) => {
                    const key = `${day}-${period}`
                    const data = availability[key] || {
                      available: 0,
                      total: participants.length,
                      details: [],
                      availableParticipants: [],
                    }
                    return (
                      <td
                        key={key}
                        className="border p-2"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`p-2 rounded cursor-help text-sm ${
                                  data.available === data.total && data.total > 0
                                    ? 'bg-green-100'
                                    : data.available > 0
                                    ? 'bg-yellow-100'
                                    : 'bg-red-100'
                                }`}
                              >
                                {data.available}/{data.total}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                参加可能者:{' '}
                                {data.availableParticipants.join(', ') || 'なし'}
                              </div>
                              {data.details.map((d) => (
                                <div
                                  key={d.type}
                                  className="text-xs mt-1"
                                >
                                  {d.label}: {d.count}人
                                </div>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
