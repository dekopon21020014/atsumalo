"use client"

import React, { useMemo, useState } from "react"
import { Check, Save, User, MessageSquare, X, GraduationCap } from "lucide-react"
import { type ScheduleType, type Response } from "./constants"
import { buildEventAuthHeaders, type EventAccess, storeParticipantToken } from "./utils"
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
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
  addGradeOption: (name: string, priority: number) => void
  eventAccess?: EventAccess
}

export default function OneTimeInputTab({
  eventId,
  dateTimeOptions,
  scheduleTypes,
  existingResponses = [],
  setExistingResponses,
  setActiveTab,
  gradeOptions,
  gradeOrder,
  addGradeOption,
  eventAccess,
}: Props) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const available = scheduleTypes.find((t) => t.isAvailable)
  const initialSelections: Record<string, string> = {}
  if (available) {
    dateTimeOptions.forEach((dt) => {
      initialSelections[dt] = available.id
    })
  }
  const [selections, setSelections] = useState<Record<string, string>>(initialSelections)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const authHeaders = useMemo(() => buildEventAuthHeaders(eventAccess), [eventAccess])

  const handleSelection = (dateTime: string, typeId: string) => {
    const newSelections = { ...selections, [dateTime]: typeId }
    setSelections(newSelections)
    localStorage.setItem(`event_${eventId}_selections`, JSON.stringify(newSelections))
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
      const trimmedComment = comment.trim()
      const responseData = {
        eventId,
        name,
        grade,
        gradePriority: gradeOrder[grade],
        schedule: Object.entries(selections).map(([dateTime, typeId]) => ({
          dateTime,
          typeId,
        })),
        comment: trimmedComment === "" ? "" : trimmedComment,
      }

      // APIエンドポイントに送信（実際の実装に合わせて調整）      
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(responseData),
      })

      const result = await response.json()
      if (!response.ok || !result?.id) {
        throw new Error(result?.error || "回答の送信に失敗しました")
      }
      if (result.editToken) {
        storeParticipantToken(eventId, result.id, result.editToken)
      }
      // ローカル state に「自分の回答」を追加
      setExistingResponses((prev) => [
        ...prev,
        { id: result.id, name, grade, schedule: responseData.schedule, comment: responseData.comment },
      ])

      toast({
        title: "回答を送信しました",
        description: "あなたの回答が正常に保存されました。",
      })

      // 送信成功後、回答状況タブに切り替え
      setActiveTab("responses")
      setName("")
      setGrade("")
      setComment("")
      setSelections(initialSelections)
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
    setSelections(initialSelections)
    setComment("")
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
        {/* 名前と所属/役職 */}
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
                所属/役職
              </Label>
              <Select
                value={grade}
                onValueChange={(v) => {
                  if (v === "__add__") {
                    const newGrade = prompt("所属/役職を入力してください")
                    if (newGrade) {
                      const trimmed = newGrade.trim()
                      const existing = gradeOptions
                        .map((g) => `${g}(${gradeOrder[g] ?? "-"})`)
                        .join("\n")
                      const pr = prompt(
                        `優先度を入力してください（1〜999の半角数字。小さい数字ほど優先度が高く表示順が前になります）\n現在の設定:\n${existing}`
                      )
                      let priority: number
                      if (!pr || pr.trim() === "") {
                        const maxPri = Math.max(0, ...Object.values(gradeOrder))
                        priority = maxPri + 1
                      } else if (/^\d+$/.test(pr.trim())) {
                        priority = Number(pr)
                        if (priority < 1 || priority > 999) {
                          alert("優先度は1〜999の半角数字で入力してください")
                          return
                        }
                      } else {
                        alert("優先度は1〜999の半角数字で入力してください")
                        return
                      }
                      addGradeOption(trimmed, priority)
                      setGrade(trimmed)
                    }
                    return
                  }
                  setGrade(v)
                }}
              >
                <SelectTrigger id="participant-grade">
                  <SelectValue placeholder="所属/役職を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt} (優先度: {gradeOrder[opt]})
                    </SelectItem>
                  ))}
                  <SelectItem value="__add__">追加</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="participant-comment" className="text-sm font-medium mb-1 block">
                <MessageSquare className="h-4 w-4 inline-block mr-1" />
                コメント（任意）
              </Label>
              <Textarea
                id="participant-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="補足があれば入力してください（任意）"
                className="w-full"
                rows={3}
              />
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
                        </div>
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
