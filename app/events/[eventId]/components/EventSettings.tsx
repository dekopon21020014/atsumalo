"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Plus, Trash2, Save, Settings, Check } from "lucide-react"
import type { ScheduleType } from "./constants"
import { colorPalettes } from "./constants"

type EventSettingsProps = {
  eventId: string
  eventType: "recurring" | "onetime"
  eventName: string
  eventDescription: string
  dateTimeOptions?: string[]
  xAxis?: string[]
  yAxis?: string[]
  scheduleTypes: ScheduleType[]
  onUpdate: () => void
}

export default function EventSettings({
  eventId,
  eventType,
  eventName,
  eventDescription,
  dateTimeOptions = [],
  xAxis = [],
  yAxis = [],
  scheduleTypes,
  onUpdate,
}: EventSettingsProps) {
  const [name, setName] = useState(eventName)
  const [description, setDescription] = useState(eventDescription)
  const [editScheduleTypes, setEditScheduleTypes] = useState<ScheduleType[]>(scheduleTypes)
  const [editDateTimeOptions, setEditDateTimeOptions] = useState<string[]>(dateTimeOptions)
  const [editXAxis, setEditXAxis] = useState<string[]>(xAxis)
  const [editYAxis, setEditYAxis] = useState<string[]>(yAxis)
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dateTimeRefs = useRef<HTMLInputElement[]>([])
  const xAxisRefs = useRef<HTMLInputElement[]>([])
  const yAxisRefs = useRef<HTMLInputElement[]>([])
  const typeLabelRefs = useRef<HTMLInputElement[]>([])

  // 日時オプションを追加
  const addDateTimeOption = () => {
    setEditDateTimeOptions((prev) => {
      const newOptions = [...prev, `日時${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        dateTimeRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // 日時オプションを削除
  const removeDateTimeOption = (index: number) => {
    if (editDateTimeOptions.length <= 1) return
    const newOptions = [...editDateTimeOptions]
    newOptions.splice(index, 1)
    setEditDateTimeOptions(newOptions)
  }

  // 日時オプションを更新
  const updateDateTimeOption = (index: number, value: string) => {
    const newOptions = [...editDateTimeOptions]
    newOptions[index] = value
    setEditDateTimeOptions(newOptions)
  }

  // X軸の項目を追加
  const addXItem = () => {
    setEditXAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        xAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // X軸の項目を削除
  const removeXItem = (index: number) => {
    if (editXAxis.length <= 1) return
    const newXAxis = [...editXAxis]
    newXAxis.splice(index, 1)
    setEditXAxis(newXAxis)
  }

  // X軸の項目を更新
  const updateXItem = (index: number, value: string) => {
    const newXAxis = [...editXAxis]
    newXAxis[index] = value
    setEditXAxis(newXAxis)
  }

  // Y軸の項目を追加
  const addYItem = () => {
    setEditYAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        yAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // Y軸の項目を削除
  const removeYItem = (index: number) => {
    if (editYAxis.length <= 1) return
    const newYAxis = [...editYAxis]
    newYAxis.splice(index, 1)
    setEditYAxis(newYAxis)
  }

  // Y軸の項目を更新
  const updateYItem = (index: number, value: string) => {
    const newYAxis = [...editYAxis]
    newYAxis[index] = value
    setEditYAxis(newYAxis)
  }

  // 予定タイプを追加
  const addScheduleType = () => {
    const newId = `type_${Date.now()}`
    const randomColorIndex = Math.floor(Math.random() * colorPalettes.length)
    const randomColor = `${colorPalettes[randomColorIndex].bg} ${colorPalettes[randomColorIndex].text}`

    setEditScheduleTypes((prev) => {
      const newTypes = [
        ...prev,
        {
          id: newId,
          label: `予定${prev.length + 1}`,
          color: randomColor,
          isAvailable: false,
        },
      ]
      requestAnimationFrame(() => {
        const newIndex = newTypes.length - 1
        typeLabelRefs.current[newIndex]?.focus()
      })
      return newTypes
    })
  }

  // 予定タイプを削除
  const removeScheduleType = (index: number) => {
    if (editScheduleTypes.length <= 1) return
    const newTypes = [...editScheduleTypes]
    newTypes.splice(index, 1)
    setEditScheduleTypes(newTypes)
  }

  // 予定タイプのラベルを更新
  const updateScheduleTypeLabel = (index: number, label: string) => {
    const newTypes = [...editScheduleTypes]
    newTypes[index].label = label
    setEditScheduleTypes(newTypes)
  }

  // 予定タイプの色を更新
  const updateScheduleTypeColor = (index: number, colorClass: string) => {
    const newTypes = [...editScheduleTypes]
    newTypes[index].color = colorClass
    setEditScheduleTypes(newTypes)
  }

  // 予定タイプの「参加可能」状態を更新
  const updateScheduleTypeAvailability = (index: number, isAvailable: boolean) => {
    // 一旦すべてfalseにする
    const newTypes = editScheduleTypes.map((type) => ({
      ...type,
      isAvailable: false,
    }))

    // 選択された項目だけtrueにする
    if (isAvailable) {
      newTypes[index].isAvailable = true
    }

    setEditScheduleTypes(newTypes)
  }

  // イベント設定を保存
  const saveEventSettings = async () => {
    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "イベント名を入力してください",
        variant: "destructive",
      })
      return
    }

    // イベントタイプに応じたバリデーション
    if (eventType === "recurring") {
      if (editXAxis.length === 0 || editYAxis.length === 0) {
        toast({
          title: "エラー",
          description: "横軸と縦軸の項目を設定してください",
          variant: "destructive",
        })
        return
      }
    } else {
      if (editDateTimeOptions.length === 0) {
        toast({
          title: "エラー",
          description: "日時の項目を設定してください",
          variant: "destructive",
        })
        return
      }
    }

    // 参加可能な予定タイプが設定されているか確認
    const hasAvailableType = editScheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "エラー",
        description: "「参加可能」として設定された予定タイプが必要です",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // イベントタイプに応じたデータを準備
      const eventData = {
        name,
        description,
        scheduleTypes: editScheduleTypes,
        ...(eventType === "recurring"
          ? { xAxis: editXAxis, yAxis: editYAxis }
          : { dateTimeOptions: editDateTimeOptions }),
      }

      // APIエンドポイントに送信
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("イベント設定の更新に失敗しました")
      }

      toast({
        title: "設定を保存しました",
        description: "イベント設定が正常に更新されました。",
      })

      // 親コンポーネントに更新を通知
      onUpdate()
    } catch (error) {
      console.error("更新エラー:", error)
      toast({
        title: "更新エラー",
        description: "イベント設定の更新中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          イベント設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="options">{eventType === "recurring" ? "グリッド設定" : "日時設定"}</TabsTrigger>
            <TabsTrigger value="types">回答タイプ</TabsTrigger>
          </TabsList>

          {/* 基本情報タブ */}
          <TabsContent value="basic" className="space-y-4">
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
              <Textarea
                id="evt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="イベントの概要を入力"
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>

          {/* 日時/グリッド設定タブ */}
          <TabsContent value="options" className="space-y-4">
            {eventType === "recurring" ? (
              // 定期イベント用のグリッドビルダー
              <div className="flex flex-col md:flex-row gap-6">
                {/* X軸設定 */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">横軸の項目（曜日など）</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addXItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {editXAxis.map((item, i) => (
                      <div key={`x-${i}`} className="flex items-center gap-2">
                        <Input
                          ref={(el) => (xAxisRefs.current[i] = el)}
                          id={`x-axis-${i}`}
                          value={item}
                          onChange={(e) => updateXItem(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addXItem()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeXItem(i)}
                          disabled={editXAxis.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Y軸設定 */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">縦軸の項目（時限など）</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addYItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {editYAxis.map((item, i) => (
                      <div key={`y-${i}`} className="flex items-center gap-2">
                        <Input
                          ref={(el) => (yAxisRefs.current[i] = el)}
                          id={`y-axis-${i}`}
                          value={item}
                          onChange={(e) => updateYItem(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addYItem()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeYItem(i)}
                          disabled={editYAxis.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // 単発イベント用の日時リスト
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">日時オプション</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDateTimeOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                  {editDateTimeOptions.map((item, index) => (
                    <div key={`datetime-${index}`} className="flex items-center gap-2">
                      <Input
                        ref={(el) => (dateTimeRefs.current[index] = el)}
                        id={`datetime-option-${index}`}
                        value={item}
                        onChange={(e) => updateDateTimeOption(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addDateTimeOption()
                          }
                        }}
                        placeholder={`日時 ${index + 1} (例: 5/1 19:00)`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDateTimeOption(index)}
                        disabled={editDateTimeOptions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    日時は「5/1 19:00」のような形式で入力してください。参加者はこのリストから選択します。
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 回答タイプタブ */}
          <TabsContent value="types" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium">予定タイプの設定</h3>
              <Button type="button" variant="outline" size="sm" onClick={addScheduleType}>
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600">
                参加者が選択できる予定タイプを設定します。「参加可能」として設定された予定タイプは、集計時に「参加可能」としてカウントされます。
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
              {editScheduleTypes.map((type, index) => (
                <div key={`type-${index}`} className="border rounded-md p-3 bg-white">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* ラベル入力 */}
                    <div className="flex-1">
                      <Label htmlFor={`type-label-${index}`} className="text-xs mb-1 block">
                        ラベル
                      </Label>
                      <Input
                        ref={(el) => (typeLabelRefs.current[index] = el)}
                        id={`type-label-${index}`}
                        value={type.label}
                        onChange={(e) => updateScheduleTypeLabel(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addScheduleType()
                          }
                        }}
                        placeholder="予定タイプの名前"
                      />
                    </div>

                    {/* 色選択 */}
                    <div className="w-full md:w-40">
                      <Label htmlFor={`type-color-${index}`} className="text-xs mb-1 block">
                        色
                      </Label>
                      <Select value={type.color} onValueChange={(value) => updateScheduleTypeColor(index, value)}>
                        <SelectTrigger id={`type-color-${index}`} className={`w-full ${type.color}`}>
                          <SelectValue placeholder="色を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorPalettes.map((color, colorIndex) => (
                            <SelectItem
                              key={`color-${colorIndex}`}
                              value={`${color.bg} ${color.text}`}
                              className={`${color.bg} ${color.text}`}
                            >
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 参加可能フラグ */}
                    <div className="flex items-center space-x-2 mt-6 md:mt-0">
                      <Switch
                        id={`type-available-${index}`}
                        checked={type.isAvailable}
                        onCheckedChange={(checked) => updateScheduleTypeAvailability(index, checked)}
                      />
                      <Label htmlFor={`type-available-${index}`} className="text-sm">
                        参加可能
                      </Label>
                    </div>

                    {/* 削除ボタン */}
                    <div className="flex items-center mt-6 md:mt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeScheduleType(index)}
                        disabled={editScheduleTypes.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* プレビュー */}
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-gray-500 mb-1">プレビュー:</div>
                    <div className={`inline-block px-3 py-1 rounded-md ${type.color}`}>
                      {type.label}
                      {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={saveEventSettings} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
