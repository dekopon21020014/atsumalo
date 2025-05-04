"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, MousePointer, Smartphone } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { scheduleTypes, days, periods } from "./constants"
import { Schedule, Participant } from "./types"
import { createEmptySchedule } from "./utils"
import useMediaQuery from "@/hooks/use-mobile"
import ScheduleTable from "./ScheduleTable"
import ScheduleCellMobile from "./ScheduleCellMobile"
import { useParams } from 'next/navigation'

type Props = {
  currentName: string
  setCurrentName: (name: string) => void
  currentSchedule: Schedule
  setCurrentSchedule: (schedule: Schedule) => void
  participants: Participant[]
  setParticipants: (ps: Participant[]) => void
  editingIndex: number | null
  setEditingIndex: (i: number | null) => void
  setActiveTab: (tab: string) => void
}

export default function ScheduleForm({
  currentName,
  setCurrentName,
  currentSchedule,
  setCurrentSchedule,
  participants,
  setParticipants,
  editingIndex,
  setEditingIndex,
  setActiveTab,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: boolean }>({})
  const [bulkScheduleType, setBulkScheduleType] = useState("")
  const [selectionMode, setSelectionMode] = useState<"tap" | "drag">(isMobile ? "tap" : "drag")
  const { eventId } = useParams() 

  const selectedCellCount = Object.keys(selectedCells).length

  useEffect(() => {
    setSelectionMode(isMobile ? "tap" : "drag")
  }, [isMobile])

  const updateSchedule = (day: string, period: number, value: string) => {
    const key = `${day}-${period}`
    setCurrentSchedule((prev) => ({ ...prev, [key]: value }))
  }

  const applyBulkSchedule = () => {
    if (!bulkScheduleType || selectedCellCount === 0) return
    const updated = { ...currentSchedule }
    for (const key of Object.keys(selectedCells)) {
      updated[key] = bulkScheduleType
    }
    setCurrentSchedule(updated)
    toast({ title: "一括適用", description: `${selectedCellCount}コマの予定を設定しました` })
    setSelectedCells({})
    setBulkScheduleType("")
  }

  const submit = async () => {
    if (!currentName.trim()) {
      toast({ title: "エラー", description: "名前を入力してください", variant: "destructive" })
      return
    }

    const filled = Object.values(currentSchedule).filter(Boolean).length
    if (filled < 5 && !confirm("入力が少ないようです。本当に登録しますか？")) return    

    const payload = { 
      eventId,
      name: currentName, 
      schedule: currentSchedule       
    }

    try {
      if (editingIndex !== null) {
        const id = participants[editingIndex].id
        const res = await fetch(`/api/events/${eventId}/participants/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated = [...participants]
        updated[editingIndex] = { id, ...payload }
        setParticipants(updated)
        setEditingIndex(null)
      } else {
        const res = await fetch(`/api/events/${eventId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const { id } = await res.json()
        setParticipants([...participants, { id, ...payload }])
      }

      toast({ title: "完了", description: "スケジュールを登録しました" })
      setCurrentName("")
      setCurrentSchedule(createEmptySchedule())
      setSelectedCells({})
      setBulkScheduleType("")
      setActiveTab("summary")
    } catch {
      toast({ title: "エラー", description: "保存に失敗しました", variant: "destructive" })
    }
  }

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => (prev === "tap" ? "drag" : "tap"))
    setSelectedCells({})
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>スケジュール入力</CardTitle>
        <CardDescription>
          {editingIndex !== null ? "スケジュールを編集してください" : "名前と予定を入力してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="name">名前</Label>
          <Input id="name" value={currentName} onChange={(e) => setCurrentName(e.target.value)} placeholder="名前" />
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">一括入力</h3>
            <Button size="sm" variant="outline" onClick={toggleSelectionMode} className="text-xs flex items-center gap-1">
              {selectionMode === "tap" ? <Smartphone className="w-3 h-3" /> : <MousePointer className="w-3 h-3" />}
              {selectionMode === "tap" ? "タップ" : "ドラッグ"}
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={bulkScheduleType} onValueChange={setBulkScheduleType} disabled={selectedCellCount === 0}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="予定" />
              </SelectTrigger>
              <SelectContent>
                {scheduleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className={type.color}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={applyBulkSchedule} size="sm" disabled={!bulkScheduleType || selectedCellCount === 0}>
              <Check className="w-4 h-4 mr-1" />
              適用
            </Button>
          </div>
          {selectedCellCount > 0 && <div className="text-sm text-blue-600 mt-2">{selectedCellCount}コマ選択中</div>}
        </div>

        {isMobile ? (
          <div className="grid grid-cols-5 gap-1 mb-3">
            {days.map((day) => (
              <div key={day} className="text-sm text-center font-medium col-span-1">
                {day}
              </div>
            ))}
            {periods.map((period) => (
              <div key={period} className="col-span-5">
                <div className="font-medium text-sm">{period}限</div>
                <div className="grid grid-cols-5 gap-1">
                  {days.map((day) => (
                    <ScheduleCellMobile
                      key={`${day}-${period}`}
                      day={day}
                      period={period}
                      value={currentSchedule[`${day}-${period}`]}
                      selected={!!selectedCells[`${day}-${period}`]}
                      onTap={() => {
                        const key = `${day}-${period}`
                        setSelectedCells((prev) => {
                          const updated = { ...prev }
                          if (updated[key]) delete updated[key]
                          else updated[key] = true
                          return updated
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScheduleTable
            schedule={currentSchedule}
            updateSchedule={updateSchedule}
            selectedCells={selectedCells}
            setSelectedCells={setSelectedCells}
            selectionMode={selectionMode}
          />
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={submit} className="w-full md:w-auto">
          {editingIndex !== null ? "更新する" : "登録する"}
        </Button>
      </CardFooter>
    </Card>
  )
}
