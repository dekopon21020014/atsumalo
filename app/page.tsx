// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function HomePage() {
  const [eventName, setEventName] = useState('')
  const [eventDesc, setEventDesc] = useState('')   // ← 追加
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast({ title: 'エラー', description: 'イベント名を入力してください', variant: 'destructive' })
      return
    }

    try {
      // イベント作成API呼び出し
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName, description: eventDesc }),  // ← description も送る
      })
      const { id } = await res.json()
      router.push(`/events/${id}`)
    } catch (err) {
      console.error(err)
      toast({ title: '作成エラー', description: 'イベントの作成に失敗しました', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">イベント管理アプリ</h1>

      <p className="mb-4 text-gray-700">
        このアプリは、研究室ゼミや勉強会などの「日程調整」を簡単に行うためのツールです。
      </p>

      <ol className="list-decimal list-inside mb-8 text-gray-600">
        <li>イベント名と説明を入力し、「イベントを作成」をクリック。</li>
        <li>生成されたリンクを参加者に共有。</li>
        <li>参加者は各自の空きコマを入力。</li>
        <li>管理画面で全員の回答を集計し、最適な日程を確認。</li>
      </ol>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div>
          <Label htmlFor="eventName">イベント名</Label>
          <Input
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="例：ゼミ日程調整"
            required
          />
        </div>
        <div>
          <Label htmlFor="eventDesc">イベント説明</Label>
          <textarea
            id="eventDesc"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            placeholder="このイベントの概要を入力"
            className="w-full p-2 border rounded resize-none h-24"
          />
        </div>
        <Button type="submit" className="w-full">
          イベントを作成
        </Button>
      </form>
    </div>
  )
}
