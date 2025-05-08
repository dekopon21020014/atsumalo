// app/events/[eventId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import SchedulePage from '@/app/events/[eventId]/components/SchedulePage'
import OneTimePage from '@/app/events/[eventId]/components/OneTimePage' // 単発用のコンポーネントを用意しておく
import { ScheduleType } from '@/app/events/[eventId]/components/constants'

type EventData = {
  name: string
  description: string
  eventType: 'recurring' | 'onetime'
  xAxis: string[]
  yAxis: string[]
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  existingResponses: Response[]
}

type Response = {
  id: string
  name: string
  grade?: string
  schedule: {
    dateTime: string
    typeId: string
    comment?: string
  }[]
}

export default function EventPage() {
  const { eventId } = useParams()

  const [data, setData] = useState<EventData>({
    name: '読み込み中…',
    description: '読み込み中…',
    eventType: 'recurring',
    xAxis: [],
    yAxis: [],
    dateTimeOptions: [],
    scheduleTypes: [],
    existingResponses: [],
  })
  const [name, setName] = useState(data.name)
  const [description, setDescription] = useState(data.description)
  const [editMode, setEditMode] = useState(false)

  // イベント情報の取得
  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          toast({
            title: '読み込みエラー',
            description: resData.error,
            variant: 'destructive',
          })
          return
        }
        setData({
          name: resData.name,
          description: resData.description ?? '',
          eventType: resData.eventType === 'onetime' ? 'onetime' : 'recurring',
          xAxis: Array.isArray(resData.xAxis) ? resData.xAxis : [],
          yAxis: Array.isArray(resData.yAxis) ? resData.yAxis : [],
          dateTimeOptions: Array.isArray(resData.dateTimeOptions)
            ? resData.dateTimeOptions
            : [],
          scheduleTypes: Array.isArray(resData.scheduleTypes)
            ? resData.scheduleTypes
            : [],
          existingResponses: Array.isArray(resData.participants)
            ? resData.participants.map((p: any) => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
                schedule: p.schedule,
              }))
            : [],
        })
        setName(resData.name)
        setDescription(resData.description ?? '')
      })
      .catch((err) => {
        console.error(err)
        toast({
          title: '読み込みエラー',
          description: '通信に失敗しました',
          variant: 'destructive',
        })
      })
  }, [eventId])

  const saveEdit = async () => {
    if (!name.trim()) {
      toast({
        title: 'エラー',
        description: 'イベント名を入力してください',
        variant: 'destructive',
      })
      return
    }
    if (!eventId) return

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '更新に失敗しました')

      toast({ title: '完了', description: 'イベント情報を更新しました' })
      setEditMode(false)
      setData((prev) => ({ ...prev, name, description }))
    } catch (err: any) {
      console.error(err)
      toast({
        title: '更新エラー',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {editMode ? (
        // 編集フォーム
        <div className="space-y-4 border p-4 rounded">
          <div>
            <Label htmlFor="evt-name">イベント名</Label>
            <Input
              id="evt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="イベント名を入力"
            />
          </div>
          <div>
            <Label htmlFor="evt-desc">イベント説明</Label>
            <textarea
              id="evt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="イベントの概要を入力"
              className="w-full p-2 border rounded resize-none h-24"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveEdit}>保存</Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{data.name}</h1>
          <p className="text-gray-700">{data.description}</p>
          <Button variant="outline" onClick={() => setEditMode(true)}>
            編集
          </Button>
        </div>
      )}

      {/* イベントタイプに応じてビュー切り替え */}
      <div className="mt-6">
        {data.eventType === 'recurring' ? (
          <SchedulePage
            xAxis={data.xAxis}
            yAxis={data.yAxis}
            scheduleTypes={data.scheduleTypes}
          />
        ) : (
          <OneTimePage
            eventId={eventId ? String(eventId) : ""}
            dateTimeOptions={data.dateTimeOptions}
            scheduleTypes={data.scheduleTypes}
            responses={data.existingResponses}
          />
        )}
      </div>
    </div>
  )
}
