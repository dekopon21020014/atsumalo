// app/events/[eventId]/components/ScheduleForm.tsx
'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, MousePointer, Smartphone } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { gradeOptions, type ScheduleType } from '@/app/events/[eventId]/components/constants'
import { Schedule, Participant } from './types'
import { createEmptySchedule } from './utils'
import { useMediaQuery } from '@/hooks/use-mobile'
import ScheduleTable from './ScheduleTable'
import ScheduleCellMobile from './ScheduleCellMobile'
import { useParams } from 'next/navigation'

type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  currentName: string
  setCurrentName: Dispatch<SetStateAction<string>>
  currentGrade: string
  setCurrentGrade: Dispatch<SetStateAction<string>>
  currentSchedule: Schedule
  setCurrentSchedule: Dispatch<SetStateAction<Schedule>>
  participants: Participant[]
  setParticipants: Dispatch<SetStateAction<Participant[]>>
  editingIndex: number | null
  setEditingIndex: Dispatch<SetStateAction<number | null>>
  setActiveTab: (tab: string) => void
}

export default function ScheduleForm({
  xAxis,
  yAxis,
  scheduleTypes,
  currentName,
  setCurrentName,
  currentGrade,
  setCurrentGrade,
  currentSchedule,
  setCurrentSchedule,
  participants,
  setParticipants,
  editingIndex,
  setEditingIndex,
  setActiveTab,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: boolean }>({})
  const [bulkScheduleType, setBulkScheduleType] = useState<string>('')
  const [selectionMode, setSelectionMode] = useState<'tap' | 'drag'>(isMobile ? 'tap' : 'drag')
  const { eventId } = useParams()

  const selectedCellCount = Object.keys(selectedCells).length

  useEffect(() => {
    setSelectionMode(isMobile ? 'tap' : 'drag')
  }, [isMobile])

  useEffect(() => {
    if (editingIndex !== null) {
      const p = participants[editingIndex]
      setCurrentName(p.name)
      setCurrentGrade(p.grade || '')
      setCurrentSchedule({ ...p.schedule })
    } else {
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis))
    }
  }, [editingIndex, participants, xAxis, yAxis])

  const updateSchedule = (labelX: string, labelY: string, value: string) => {
    const key = `${labelX}-${labelY}`
    setCurrentSchedule((prev) => ({ ...prev, [key]: value }))
  }

  const applyBulkSchedule = () => {
    if (!bulkScheduleType || selectedCellCount === 0) return
    const updated = { ...currentSchedule }
    for (const key of Object.keys(selectedCells)) {
      updated[key] = bulkScheduleType
    }
    setCurrentSchedule(updated)
    toast({ title: '一括適用', description: `${selectedCellCount}コマの予定を設定しました` })
    setSelectedCells({})
    setBulkScheduleType('')
  }

  const submit = async () => {    
    if (!currentName.trim()) {
      toast({ title: 'エラー', description: '名前を入力してください', variant: 'destructive' })
      return
    }
    if (!currentGrade) {
      toast({ title: 'エラー', description: '学年を選択してください', variant: 'destructive' })
      return
    }
    
    const filled = Object.values(currentSchedule).filter(Boolean).length
    if (filled < 5 && !confirm('入力が少ないようです。本当に登録しますか？')) return

    const payload = {
      eventId,
      name: currentName,
      grade: currentGrade,
      schedule: currentSchedule,
    }

    try {
      if (editingIndex !== null) {
        const id = participants[editingIndex].id
        const res = await fetch(`/api/events/${eventId}/participants/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated = [...participants]
        updated[editingIndex] = { id, ...payload }
        setParticipants(updated)
        setEditingIndex(null)
      } else {
        const res = await fetch(`/api/events/${eventId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const { id } = await res.json()
        setParticipants([...participants, { id, ...payload }])
      }

      toast({ title: '完了', description: 'スケジュールを登録しました' })
      setCurrentName('')
      setCurrentGrade('')
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis))
      setSelectedCells({})
      setBulkScheduleType('')
      setActiveTab('summary')
    } catch {
      toast({ title: 'エラー', description: '保存に失敗しました', variant: 'destructive' })
    }
  }

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => (prev === 'tap' ? 'drag' : 'tap'))
    setSelectedCells({})
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>スケジュール入力</CardTitle>
        <CardDescription>
          {editingIndex !== null ? 'スケジュールを編集してください' : '名前と予定を入力してください'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 名前・学年入力 */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              placeholder="名前"
            />
          </div>
          <div>
            <Label htmlFor="grade-select">学年</Label>
            <Select
              value={currentGrade}
              onValueChange={setCurrentGrade}
            >
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder="学年を選択" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 一括入力 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">一括入力</h3>
            <Button size="sm" variant="outline" onClick={toggleSelectionMode} className="text-xs flex items-center gap-1">
              {selectionMode === 'tap' ? <Smartphone className="w-3 h-3" /> : <MousePointer className="w-3 h-3" />}
              {selectionMode === 'tap' ? 'タップ' : 'ドラッグ'}
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={bulkScheduleType} onValueChange={setBulkScheduleType} disabled={selectedCellCount === 0}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="予定" />
              </SelectTrigger>
              <SelectContent>
                {scheduleTypes.map((type, idx) => (
                  <SelectItem 
                    key={`${type.id}-${idx}`} 
                    value={type.id} 
                    className={type.color}
                  >
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
          {selectedCellCount > 0 && (
            <div className="text-sm text-blue-600 mt-2">{selectedCellCount}コマ選択中</div>
          )}
        </div>

        {/* グリッド or モバイルビュー */}
        {isMobile ? (
          <div className="grid grid-cols-1 gap-1 mb-3">
            {yAxis.map((labelY) => (
              <div key={labelY} className="mb-2">
                <div className="font-medium text-sm">{labelY}</div>
                <div className={`grid grid-cols-${xAxis.length} gap-1`}>
                  {xAxis.map((labelX) => (
                    <ScheduleCellMobile
                      key={`${labelX}-${labelY}`}
                      day={labelX}
                      period={labelY}
                      value={currentSchedule[`${labelX}-${labelY}`]}
                      selected={!!selectedCells[`${labelX}-${labelY}`]}
                      onTap={() => {
                        const key = `${labelX}-${labelY}`
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
            xAxis={xAxis}
            yAxis={yAxis}
            scheduleTypes={scheduleTypes}
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
          {editingIndex !== null ? '更新する' : '登録する'}
        </Button>
      </CardFooter>
    </Card>
  )
}
