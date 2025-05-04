"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Participant } from "./types"
import { days, periods, scheduleTypes } from "./constants"
import useMediaQuery from "@/hooks/use-mobile"
import { toast } from "@/components/ui/use-toast"
import { useParams } from 'next/navigation'


type Props = {
  participants: Participant[]
  setParticipants: (ps: Participant[]) => void
  setCurrentName: (s: string) => void
  setCurrentSchedule: (s: Participant["schedule"]) => void
  setEditingIndex: (i: number | null) => void
  setActiveTab: (t: string) => void
}

export default function ParticipantList({
  participants,
  setParticipants,
  setCurrentName,
  setCurrentSchedule,
  setEditingIndex,
  setActiveTab,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleEdit = (index: number) => {
    const participant = participants[index]
    setCurrentName(participant.name)
    setCurrentSchedule(participant.schedule)
    setEditingIndex(index)
    setActiveTab("input")
  }
  const { eventId } = useParams() 

  const handleDelete = async (index: number) => {
    const participant = participants[index]
    if (!confirm(`${participant.name}さんのスケジュールを削除しますか？`)) return

    try {
      const res = await fetch(`/api/events/${eventId}/participants/${participant.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")

      const newList = [...participants]
      newList.splice(index, 1)
      setParticipants(newList)

      toast({ title: "削除完了", description: "スケジュールが削除されました" })
    } catch (err) {
      console.error(err)
      toast({ title: "削除エラー", description: String(err), variant: "destructive" })
    }
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>参加者一覧</CardTitle>
          <CardDescription>まだ参加者が登録されていません</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {participants.map((participant, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{participant.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(index)}>
                  編集
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(index)}>
                  削除
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isMobile ? (
              <div>
                <div className="grid grid-cols-5 gap-1 mb-1">
                  {days.map((day) => (
                    <div key={day} className="text-center text-xs font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                {periods.map((period) => (
                  <div key={period} className="mb-2">
                    <div className="font-medium text-xs mb-1">{period}限</div>
                    <div className="grid grid-cols-5 gap-1">
                      {days.map((day) => {
                        const key = `${day}-${period}`
                        const value = participant.schedule[key]
                        const type = scheduleTypes.find((t) => t.id === value)

                        return (
                          <div
                            key={key}
                            className={`h-8 flex items-center justify-center rounded border border-gray-200 text-xs ${type?.color || "bg-gray-50"}`}
                          >
                            {value ? type?.label.charAt(0) : "-"}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-1"></th>
                      {days.map((day) => (
                        <th key={day} className="border p-1 text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period}>
                        <td className="border p-1 text-center font-medium">{period}限</td>
                        {days.map((day) => {
                          const key = `${day}-${period}`
                          const value = participant.schedule[key]
                          const type = scheduleTypes.find((t) => t.id === value)

                          return (
                            <td key={key} className="border p-1 text-center">
                              {value ? (
                                <span className={`px-2 py-1 rounded text-xs ${type?.color || ""}`}>
                                  {type?.label}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
