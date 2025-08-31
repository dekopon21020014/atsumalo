// app/events/[eventId]/components/SchedulePage.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, UserPlus, PenSquare, BarChart3, Users, Check } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'

import ScheduleForm from './ScheduleForm'
import ParticipantList from './ParticipantList'
import ScheduleSummary from './ScheduleSummary'
import BestTimeSlots from './BestTimeSlots'
import { createEmptySchedule } from './utils'
import type { Participant, Schedule } from './types'
import { useParams } from 'next/navigation'
import { ScheduleType } from './constants'

type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
}

export default function SchedulePage({ xAxis, yAxis, scheduleTypes, gradeOptions, gradeOrder }: Props) {
  const defaultTypeId = scheduleTypes.find((t) => t.isAvailable)?.id || ''
  const [participants, setParticipants] = useState<Participant[]>([])
  const [availableOptions, setAvailableOptions] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('input')
  const [currentName, setCurrentName] = useState('')
  const [currentGrade, setCurrentGrade] = useState('')
  const [currentSchedule, setCurrentSchedule] = useState<Schedule>(
    () => createEmptySchedule(xAxis, yAxis, defaultTypeId)
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [filterGrades, setFilterGrades] = useState<string[]>([])
  const [gradeOpts, setGradeOpts] = useState<string[]>(gradeOptions)
  const [gradeOrderMap, setGradeOrderMap] = useState<Record<string, number>>(gradeOrder)
  const { eventId } = useParams()

  useEffect(() => {
    const availableIds: string[] = scheduleTypes
      .filter((t) => t.isAvailable)
      .map((t) => t.id)    
    setAvailableOptions(availableIds)
  }, [scheduleTypes])

  // イベント参加者の読み込み
  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}/participants`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.participants)) {
          setParticipants(data.participants)
        }
      })
      .catch((e) => {
        console.error('Failed to load participants', e)
      })
  }, [eventId])

  useEffect(() => {
    setGradeOpts(gradeOptions)
    setGradeOrderMap(gradeOrder)
  }, [gradeOptions, gradeOrder])

  // 編集モード切り替え時または軸変更時に currentSchedule をリセット
  useEffect(() => {
    if (editingIndex !== null) {
      const p = participants[editingIndex]
      setCurrentName(p.name)
      setCurrentGrade(p.grade || '')
      setCurrentSchedule({ ...p.schedule })
    } else {
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis, defaultTypeId))
    }
  }, [editingIndex, participants, xAxis, yAxis, defaultTypeId])

  const toggleGradeFilter = (g: string) => {
    setFilterGrades(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g])
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          setParticipants(data)
          toast({
            title: 'インポート完了',
            description: `${data.length}人分のスケジュールを読み込みました。`,
          })
        }
      } catch {
        toast({ title: 'エラー', description: 'ファイル形式が不正です', variant: 'destructive' })
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(participants))
    const link = document.createElement('a')
    link.href = dataStr
    link.download = 'lab-schedule.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // 所属/役職フィルタリング
  const filteredParticipants =
    filterGrades.length === 0
      ? participants
      : participants.filter((p) => filterGrades.includes(p.grade || ''))

  const addGrade = (name: string, priority: number) => {
    setGradeOrderMap(prev => {
      const updated = { ...prev, [name]: priority }
      setGradeOpts(prevOpts => {
        const next = prevOpts.includes(name) ? prevOpts : [...prevOpts, name]
        return [...next].sort((a, b) => (updated[a] ?? 999) - (updated[b] ?? 999))
      })
      return updated
    })
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            エクスポート
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-1" />
                インポート
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>スケジュールのインポート</DialogTitle>
                <DialogDescription>JSONファイルを読み込みます。</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="file" accept=".json" onChange={handleImport} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="input" className="flex-1">
            <PenSquare className="h-4 w-4 mr-2" />
            入力
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            回答状況
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex-1">
            <BarChart3 className="h-4 w-4 mr-2" />
            集計結果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <ScheduleForm
            xAxis={xAxis}
            yAxis={yAxis}
            scheduleTypes={scheduleTypes}
            gradeOptions={gradeOpts}
            gradeOrder={gradeOrderMap}
            addGradeOption={addGrade}
            currentName={currentName}
            setCurrentName={setCurrentName}
            currentGrade={currentGrade}
            setCurrentGrade={setCurrentGrade}
            currentSchedule={currentSchedule}
            setCurrentSchedule={setCurrentSchedule}
            participants={participants}
            setParticipants={setParticipants}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantList
            participants={participants}
            setParticipants={setParticipants}
            setCurrentName={setCurrentName}
            setCurrentGrade={setCurrentGrade}
            setCurrentSchedule={setCurrentSchedule}
            setEditingIndex={setEditingIndex}
            setActiveTab={setActiveTab}
            xAxis={xAxis}
            yAxis={yAxis}
            availableOptions={availableOptions}
            gradeOptions={gradeOpts}
            gradeOrder={gradeOrderMap}
          />
        </TabsContent>

        <TabsContent value="summary">
           <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">所属/役職で絞り込み</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilterGrades(gradeOpts)} className="text-xs">
              全選択
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFilterGrades([])} className="text-xs">
              全解除
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {gradeOpts.map((g) => {
            const isSelected = filterGrades.includes(g)
            const count = participants.filter((p) => p.grade === g).length

            return (
              <button
                key={g}
                onClick={() => toggleGradeFilter(g)}
                className={`
            px-3 py-2 rounded-md text-sm font-medium transition-all
            flex items-center gap-2 min-w-[100px] justify-between
            ${
              isSelected
                ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300"
            }
          `}
              >
                <span>{g}</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-blue-200 text-blue-900" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </button>
            )
          })}
        </div>

        {filterGrades.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            {filterGrades.length}個の所属/役職を選択中 ({filteredParticipants.length}名が対象)
          </div>
        )}
      </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ScheduleSummary 
              participants={filteredParticipants} 
              xAxis={xAxis}
              yAxis={yAxis}
              availableOptions={availableOptions}
            />
            <BestTimeSlots
              participants={filteredParticipants}
              xAxis={xAxis}
              yAxis={yAxis}
              availableOptions={availableOptions}
            />
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">所属/役職別集計（全体表示）</h3>
            <div className="space-y-8">
              {gradeOptions.map((g) => {
                const group = participants.filter((p) => p.grade === g)
                if (group.length === 0) return null                
                return (
                  <div key={g}>
                    <h4 className="text-lg font-medium mb-2">
                      {g} ({group.length}名)
                    </h4>
                    <ScheduleSummary 
                      participants={group} 
                      availableOptions={availableOptions}
                      xAxis={xAxis}
                      yAxis={yAxis}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}
