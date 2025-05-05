// app/events/[eventId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import SchedulePage from '@/app/events/[eventId]/components/SchedulePage'

export default function EventPage() {
  const { eventId } = useParams()
  const [name, setName] = useState('読み込み中…')
  const [description, setDescription] = useState('読み込み中…')
  const [editMode, setEditMode] = useState(false)

  // イベント情報の取得
  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({ title: '読み込みエラー', description: data.error, variant: 'destructive' })
        } else {
          setName(data.name)
          setDescription(data.description || '')
        }
      })
      .catch((err) => {
        console.error(err)
        toast({ title: '読み込みエラー', description: '通信に失敗しました', variant: 'destructive' })
      })
  }, [eventId])

  // 編集内容を保存
  const saveEdit = async () => {
    if (!name.trim()) {
      toast({ title: 'エラー', description: 'イベント名を入力してください', variant: 'destructive' })
      return
    }
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
    } catch (err: any) {
      console.error(err)
      toast({ title: '更新エラー', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {editMode ? (
        // ─── 編集フォーム ─────────────────────
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
        // ─── 表示モード ───────────────────────
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
          <p className="text-gray-700">{description}</p>
          <Button variant="outline" onClick={() => setEditMode(true)}>
            編集
          </Button>
        </div>
      )}

      {/* ─── スケジュール調整UI ───────────────────── */}
      <div className="mt-6">
        <SchedulePage />
      </div>
    </div>
  )
}
