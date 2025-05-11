"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import SchedulePage from "@/app/events/[eventId]/components/SchedulePage"
import OneTimePage from "@/app/events/[eventId]/components/OneTimePage"
import type { EventData, ScheduleType } from "@/app/events/[eventId]/components/constants"
import { colorPalettes } from "@/app/events/[eventId]/components/constants"

export default function EventPage() {
  const { eventId } = useParams()

  const [data, setData] = useState<EventData>({
    name: "読み込み中…",
    description: "読み込み中…",
    eventType: "recurring",
    xAxis: [],
    yAxis: [],
    dateTimeOptions: [],
    scheduleTypes: [],
    existingResponses: [],
  })

  // 編集用の状態
  const [name, setName] = useState(data.name)
  const [description, setDescription] = useState(data.description)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  // 編集用の日程候補と選択肢
  const [editXAxis, setEditXAxis] = useState<string[]>([])
  const [editYAxis, setEditYAxis] = useState<string[]>([])
  const [editDateTimeOptions, setEditDateTimeOptions] = useState<string[]>([])
  const [editScheduleTypes, setEditScheduleTypes] = useState<ScheduleType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // イベント情報の取得
  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          toast({
            title: "読み込みエラー",
            description: resData.error,
            variant: "destructive",
          })
          return
        }
        setData({
          name: resData.name,
          description: resData.description ?? "",
          eventType: resData.eventType === "onetime" ? "onetime" : "recurring",
          xAxis: Array.isArray(resData.xAxis) ? resData.xAxis : [],
          yAxis: Array.isArray(resData.yAxis) ? resData.yAxis : [],
          dateTimeOptions: Array.isArray(resData.dateTimeOptions) ? resData.dateTimeOptions : [],
          scheduleTypes: Array.isArray(resData.scheduleTypes) ? resData.scheduleTypes : [],
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
        setDescription(resData.description ?? "")
        setEditXAxis(Array.isArray(resData.xAxis) ? [...resData.xAxis] : [])
        setEditYAxis(Array.isArray(resData.yAxis) ? [...resData.yAxis] : [])
        setEditDateTimeOptions(Array.isArray(resData.dateTimeOptions) ? [...resData.dateTimeOptions] : [])
        setEditScheduleTypes(Array.isArray(resData.scheduleTypes) ? [...resData.scheduleTypes] : [])
      })
      .catch((err) => {
        console.error(err)
        toast({
          title: "読み込みエラー",
          description: "通信に失敗しました",
          variant: "destructive",
        })
      })
  }, [eventId])

  // X軸の項目を追加
  const addXItem = () => {
    setEditXAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      setTimeout(() => {
        const newIndex = newItems.length - 1
        const inputElement = document.getElementById(`x-axis-${newIndex}`)
        if (inputElement) inputElement.focus()
      }, 10)
      return newItems
    })
  }

  // Y軸の項目を追加
  const addYItem = () => {
    setEditYAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      setTimeout(() => {
        const newIndex = newItems.length - 1
        const inputElement = document.getElementById(`y-axis-${newIndex}`)
        if (inputElement) inputElement.focus()
      }, 10)
      return newItems
    })
  }

  // 日時オプションを追加
  const addDateTimeOption = () => {
    setEditDateTimeOptions((prev) => {
      const newOptions = [...prev, `日時${prev.length + 1}`]
      setTimeout(() => {
        const newIndex = newOptions.length - 1
        const inputElement = document.getElementById(`datetime-option-${newIndex}`)
        if (inputElement) inputElement.focus()
      }, 10)
      return newOptions
    })
  }

  // X軸の項目を削除
  const removeXItem = (index: number) => {
    if (editXAxis.length <= 1) return
    const newXAxis = [...editXAxis]
    newXAxis.splice(index, 1)
    setEditXAxis(newXAxis)
  }

  // Y軸の項目を削除
  const removeYItem = (index: number) => {
    if (editYAxis.length <= 1) return
    const newYAxis = [...editYAxis]
    newYAxis.splice(index, 1)
    setEditYAxis(newYAxis)
  }

  // 日時オプションを削除
  const removeDateTimeOption = (index: number) => {
    if (editDateTimeOptions.length <= 1) return
    const newOptions = [...editDateTimeOptions]
    newOptions.splice(index, 1)
    setEditDateTimeOptions(newOptions)
  }

  // X軸の項目を更新
  const updateXItem = (index: number, value: string) => {
    const newXAxis = [...editXAxis]
    newXAxis[index] = value
    setEditXAxis(newXAxis)
  }

  // Y軸の項目を更新
  const updateYItem = (index: number, value: string) => {
    const newYAxis = [...editYAxis]
    newYAxis[index] = value
    setEditYAxis(newYAxis)
  }

  // 日時オプションを更新
  const updateDateTimeOption = (index: number, value: string) => {
    const newOptions = [...editDateTimeOptions]
    newOptions[index] = value
    setEditDateTimeOptions(newOptions)
  }

  // 予定タイプを追加
  const addScheduleType = () => {
    // IDを生成
    const newId = `type_${Date.now()}`

    // デフォルトの色をランダムに選択
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

      setTimeout(() => {
        const newIndex = newTypes.length - 1
        const inputElement = document.getElementById(`type-label-${newIndex}`)
        if (inputElement) inputElement.focus()
      }, 10)

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

  // 編集をキャンセル
  const cancelEdit = () => {
    setName(data.name)
    setDescription(data.description)
    setEditXAxis([...data.xAxis])
    setEditYAxis([...data.yAxis])
    setEditDateTimeOptions([...data.dateTimeOptions])
    setEditScheduleTypes([...data.scheduleTypes])
    setEditMode(false)
    setActiveTab("basic")
  }

  // 編集内容を保存
  const saveEdit = async () => {
    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "イベント名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (!eventId) return

    // イベントタイプに応じたバリデーション
    if (data.eventType === "recurring") {
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
    function removeEmptyStrings(arr: string[]): string[] {
      return arr.filter((v) => v.trim() !== "")
    }
    
    function removeEmptyScheduleTypes(
      arr: ScheduleType[]
    ): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(editScheduleTypes)
      const cleanedXAxis         = removeEmptyStrings(editXAxis)
      const cleanedYAxis         = removeEmptyStrings(editYAxis)
      const cleanedDateTimes     = removeEmptyStrings(editDateTimeOptions)
      // イベントタイプに応じたデータを準備
      const updateData = {
        name,
        description,
        eventType: data.eventType,
        scheduleTypes: cleanedScheduleTypes,
        ...(data.eventType === "recurring"
          ? { xAxis: cleanedXAxis, yAxis: cleanedYAxis }
          : { dateTimeOptions: cleanedDateTimes }),
      }

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "更新に失敗しました")

      toast({ title: "完了", description: "イベント情報を更新しました" })

      // データを更新
      setData((prev) => ({
        ...prev,
        name,
        description,
        xAxis: cleanedXAxis,
        yAxis: cleanedYAxis,
        dateTimeOptions: cleanedDateTimes,
        scheduleTypes: cleanedScheduleTypes,
      }))

      setEditMode(false)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "更新エラー",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {editMode ? (
        // 編集フォーム
        <div className="space-y-4 border p-4 rounded">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="options">{data.eventType === "recurring" ? "グリッド設定" : "日時設定"}</TabsTrigger>
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
                <textarea
                  id="evt-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="イベントの概要を入力"
                  className="w-full p-2 border rounded resize-none h-24"
                />
              </div>
            </TabsContent>

            {/* 日時/グリッド設定タブ */}
            <TabsContent value="options" className="space-y-4">
              {data.eventType === "recurring" ? (
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

              <div className="space-y-3 overflow-y-auto p-1">
                {editScheduleTypes.map((type, index) => (
                  <div key={`type-${index}`} className="border rounded-md p-3 bg-white">
                    <div className="flex flex-col md:flex-row gap-3">
                      {/* ラベル入力 */}
                      <div className="flex-1">
                        <Label htmlFor={`type-label-${index}`} className="text-xs mb-1 block">
                          ラベル
                        </Label>
                        <Input
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
                      <div className={`inline-block px-3 py-1 rounded-md ${type.color}`}>{type.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={saveEdit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "保存中..." : "変更を保存"}
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-2" />
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
      {!editMode && (
        <div className="mt-6">
          {data.eventType === "recurring" ? (
            <SchedulePage xAxis={data.xAxis} yAxis={data.yAxis} scheduleTypes={data.scheduleTypes} />
          ) : (
            <OneTimePage
              eventId={eventId ? String(eventId) : ""}
              dateTimeOptions={data.dateTimeOptions}
              scheduleTypes={data.scheduleTypes}
              responses={data.existingResponses}
            />
          )}
        </div>
      )}
    </div>
  )
}
