"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Save,
  User,
  MessageSquare,
  X,
  GraduationCap,
} from "lucide-react"
import { type ScheduleType, type Response, gradeOptions } from "./constants"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

type Props = {
  eventId: string
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  existingResponses: Response[]
  setExistingResponses: React.Dispatch<React.SetStateAction<Response[]>>
  setActiveTab: (tab: string) => void
}

export default function OneTimeInputTab({
  eventId,
  dateTimeOptions,
  scheduleTypes,
  existingResponses = [],
  setExistingResponses,
  setActiveTab,
}: Props) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelection = (dateTime: string, typeId: string) => {
    const newSelections = { ...selections, [dateTime]: typeId }
    setSelections(newSelections)
    localStorage.setItem(`event_${eventId}_selections`, JSON.stringify(newSelections))
  }

  const toggleComment = (dateTime: string) => {
    setShowComments((prev) => ({
      ...prev,
      [dateTime]: !prev[dateTime],
    }))
  }

  const handleSubmit = async () => {    
    if (!name.trim()) {
      toast({
        title: "名前を入力してください",
        variant: "destructive",
      })
      alert("送信処理は実装されていません。")
      return
    }

    // 少なくとも1つの選択があるか確認
    if (Object.keys(selections).length === 0) {      
      toast({
        title: "少なくとも1つの日時に回答してください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 送信データの準備
      const responseData = {
        eventId,
        name,
        grade,
        schedule: Object.entries(selections).map(([dateTime, typeId]) => ({
          dateTime,
          typeId,
          comment: comments[dateTime] || "",
        })),
      }

      // APIエンドポイントに送信（実際の実装に合わせて調整）      
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      })

      if (!response.ok) {
        throw new Error("回答の送信に失敗しました")
      }

      const { id } = await response.json()
      // ローカル state に「自分の回答」を追加
      setExistingResponses((prev) => [...prev, { id, name, grade, schedule: responseData.schedule }])

      toast({
        title: "回答を送信しました",
        description: "あなたの回答が正常に保存されました。",
      })

      // 送信成功後、回答状況タブに切り替え
      setActiveTab("responses")
    } catch (error) {
      console.error("送信エラー:", error)
      toast({
        title: "送信エラー",
        description: "回答の送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  const clearResponses = () => {
    setSelections({})
    setComments({})
  }

  // 参加可能数
  const getAvailableCount = (dateTime: string) =>
    existingResponses.filter((r) => {
      const sel = r.schedule.find((s) => s.dateTime === dateTime)
      if (!sel) return false
      const t = scheduleTypes.find((t) => t.id === sel.typeId)
      return t?.isAvailable
    }).length

  return (
    <TabsContent value="input" className="space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSubmit()
        }}
      >
        {/* 名前と学年 */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="participant-name" className="text-sm font-medium mb-1 block">
                <User className="h-4 w-4 inline-block mr-1" />
                名前
              </Label>
              <Input
                id="participant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名前を入力してください"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="participant-grade" className="text-sm font-medium mb-1 block">
                <GraduationCap className="h-4 w-4 inline-block mr-1" />
                学年
              </Label>
              <Select value={grade} onValueChange={(v) => setGrade(v)}>
                <SelectTrigger id="participant-grade">
                  <SelectValue placeholder="学年を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 日時選択 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">参加可能日時の選択</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearResponses}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-1" />クリア
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="whitespace-nowrap">
                <Save className="h-4 w-4 mr-1" />回答を保存
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md mb-2">
            <p className="text-sm text-gray-600">
              各日時について、あなたの参加可否を選択してください。
            </p>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 pl-3 font-medium text-sm w-1/3">
                    日時
                  </th>
                  <th className="text-left p-2 font-medium text-sm">選択肢</th>
                  {existingResponses.length > 0 && (
                    <th className="text-center p-2 font-medium text-sm w-24">
                      参加可能
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {dateTimeOptions.map((dt, idx) => {
                  const sel = selections[dt]
                  const cnt = getAvailableCount(dt)
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 pl-3 align-middle">
                        <div className="font-medium">{dt}</div>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {scheduleTypes.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`
                                px-2 py-1 rounded-md ${t.color}
                                hover:opacity-90 transition-opacity text-sm
                                ${sel === t.id ? "ring-2 ring-offset-1 ring-gray-900" : ""}
                              `}
                              onClick={() => handleSelection(dt, t.id)}
                            >
                              {t.label}
                              {sel === t.id && (
                                <Check className="inline-block ml-1 h-3 w-3" />
                              )}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="text-xs text-gray-500 flex items-center hover:text-gray-700 ml-1"
                            onClick={() => toggleComment(dt)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {showComments[dt] ? "閉じる" : "コメント"}
                          </button>
                        </div>
                        {showComments[dt] && (
                          <div className="mt-2">
                            <Textarea
                              placeholder="コメントを入力"
                              value={comments[dt] || ""}
                              onChange={(e) =>
                                setComments((prev) => ({
                                  ...prev,
                                  [dt]: e.target.value,
                                }))
                              }
                              className="w-full h-16 text-sm"
                            />
                          </div>
                        )}
                      </td>
                      {existingResponses.length > 0 && (
                        <td className="p-2 text-center">
                          <span className="font-semibold">{cnt}人</span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </TabsContent>
  )
}
