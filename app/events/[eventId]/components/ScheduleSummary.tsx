"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Participant } from "./types"
import { scheduleTypes, days, periods } from "./constants"

type Props = {
  participants: Participant[]
}

export default function ScheduleSummary({ participants }: Props) {
  const availability = calculateAvailability(participants)

  function calculateAvailability(participants: Participant[]) {
    const availability: { [key: string]: any } = {}

    days.forEach((day) => {
      periods.forEach((period) => {
        const key = `${day}-${period}`

        const details = scheduleTypes
          .map((type) => ({
            type: type.id,
            label: type.label,
            count: participants.filter((p) => p.schedule[key] === type.id).length,
            participants: participants.filter((p) => p.schedule[key] === type.id).map((p) => p.name),
          }))
          .filter((item) => item.count > 0)

        availability[key] = {
          available: participants.filter((p) => p.schedule[key] === "available").length,
          total: participants.length,
          details,
          availableParticipants: participants.filter((p) => p.schedule[key] === "available").map((p) => p.name),
        }
      })
    })

    return availability
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>集計結果</CardTitle>
        <CardDescription>全参加者のスケジュールを集計</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2"></th>
                {days.map((day) => (
                  <th key={day} className="border p-2 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period}>
                  <td className="border p-2 text-center font-medium">{period}限</td>
                  {days.map((day) => {
                    const key = `${day}-${period}`
                    const data = availability[key]

                    return (
                      <td key={key} className="border p-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`p-2 rounded cursor-help text-sm ${
                                  data.available === data.total && data.total > 0
                                    ? "bg-green-100"
                                    : data.available > 0
                                      ? "bg-yellow-100"
                                      : "bg-red-100"
                                }`}
                              >
                                {data.available}/{data.total}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                参加可能者: {data.availableParticipants.join(", ") || "なし"}
                              </div>
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
