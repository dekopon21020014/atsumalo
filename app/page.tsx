"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Copy,
  ArrowDown,
  ArrowRight,
  Save,
  Check,
  Settings,
  Calendar,
  CalendarDays,
  Clock,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Textarea } from "@/components/ui/textarea"
import { 
  colorPalettes,
  recurringTemplates,
  onetimeTemplates,
  scheduleTypeTemplate,
  xAxisTemplate,
  yAxisTemplate
} from "./events/[eventId]/components/constants"
import type { ScheduleType } from "./events/[eventId]/components/constants"

export default function HomePage() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [eventType, setEventType] = useState<"recurring" | "onetime">("recurring")

  // 定期イベント用の軸
  const [xAxis, setXAxis] = useState(xAxisTemplate)
  const [yAxis, setYAxis] = useState(yAxisTemplate)

  // 単発イベント用の軸（日時の組み合わせ）
  const [dateTimeOptions, setDateTimeOptions] = useState(["5/1 19:00", "5/2 19:00", "5/3 20:00"])

  const [activeTab, setActiveTab] = useState("builder")
  const router = useRouter()

  // 予定タイプの初期値
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(scheduleTypeTemplate)

  const xAxisRefs = useRef<HTMLInputElement[]>([])
  const yAxisRefs = useRef<HTMLInputElement[]>([])
  const dateTimeRefs = useRef<HTMLInputElement[]>([])
  const typeLabelRefs = useRef<HTMLInputElement[]>([])

  // X軸の項目を追加
  const addXItem = () => {
    setXAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        xAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // Y軸の項目を追加
  const addYItem = () => {
    setYAxis((prev) => {
      const newItems = [...prev, `項目${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        yAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // 日時オプションを追加
  const addDateTimeOption = () => {
    setDateTimeOptions((prev) => {
      const newOptions = [...prev, `日時${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        dateTimeRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // X軸の項目を削除
  const removeXItem = (index: number) => {
    if (xAxis.length <= 1) return
    const newXAxis = [...xAxis]
    newXAxis.splice(index, 1)
    setXAxis(newXAxis)
  }

  // Y軸の項目を削除
  const removeYItem = (index: number) => {
    if (yAxis.length <= 1) return
    const newYAxis = [...yAxis]
    newYAxis.splice(index, 1)
    setYAxis(newYAxis)
  }

  // 日時オプションを削除
  const removeDateTimeOption = (index: number) => {
    if (dateTimeOptions.length <= 1) return
    const newOptions = [...dateTimeOptions]
    newOptions.splice(index, 1)
    setDateTimeOptions(newOptions)
  }

  // X軸の項目を更新
  const updateXItem = (index: number, value: string) => {
    const newXAxis = [...xAxis]
    newXAxis[index] = value
    setXAxis(newXAxis)
  }

  // Y軸の項目を更新
  const updateYItem = (index: number, value: string) => {
    const newYAxis = [...yAxis]
    newYAxis[index] = value
    setYAxis(newYAxis)
  }

  // 日時オプションを更新
  const updateDateTimeOption = (index: number, value: string) => {
    const newOptions = [...dateTimeOptions]
    newOptions[index] = value
    setDateTimeOptions(newOptions)
  }

  // 予定タイプを追加する関数を修正して、フォーカス移動の処理を追加
  const addScheduleType = () => {
    const newId = `type_${Date.now()}`
    const randomColorIndex = Math.floor(Math.random() * colorPalettes.length)
    const randomColor = `${colorPalettes[randomColorIndex].bg} ${colorPalettes[randomColorIndex].text}`

    setScheduleTypes((prev) => {
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
    if (scheduleTypes.length <= 1) return
    const newTypes = [...scheduleTypes]
    newTypes.splice(index, 1)
    setScheduleTypes(newTypes)
  }

  // 予定タイプのラベルを更新
  const updateScheduleTypeLabel = (index: number, label: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].label = label
    setScheduleTypes(newTypes)
  }

  // 予定タイプの色を更新
  const updateScheduleTypeColor = (index: number, colorClass: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].color = colorClass
    setScheduleTypes(newTypes)
  }

  // 予定タイプの「参加可能」状態を更新
  const updateScheduleTypeAvailability = (index: number, isAvailable: boolean) => {
    // 一旦すべてfalseにする
    const newTypes = scheduleTypes.map((type) => ({
      ...type,
      isAvailable: false,
    }))

    // 選択された項目だけtrueにする
    if (isAvailable) {
      newTypes[index].isAvailable = true
    }

    setScheduleTypes(newTypes)
  }

  // 定期イベント用テンプレートを適用
  const applyRecurringTemplate = (templateIndex: number) => {
    const template = recurringTemplates[templateIndex]
    setXAxis([...template.x])
    setYAxis([...template.y])
    toast({
      title: "テンプレート適用",
      description: `「${template.name}」を適用しました`,
    })
  }

  // 単発イベント用テンプレートを適用
  const applyOnetimeTemplate = (templateIndex: number) => {
    const template = onetimeTemplates[templateIndex]
    setDateTimeOptions([...template.options])
    toast({
      title: "テンプレート適用",
      description: `「${template.name}」を適用しました`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast({ title: "エラー", description: "イベント名を入力してください", variant: "destructive" })
      return
    }

    // イベントタイプに応じたバリデーション
    if (eventType === "recurring") {
      if (xAxis.length === 0 || yAxis.length === 0) {
        toast({ title: "エラー", description: "横軸と縦軸の項目を設定してください", variant: "destructive" })
        return
      }
    } else {
      if (dateTimeOptions.length === 0) {
        toast({ title: "エラー", description: "日時の項目を設定してください", variant: "destructive" })
        return
      }
    }

    // 参加可能な予定タイプが設定されているか確認
    const hasAvailableType = scheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "エラー",
        description: "「参加可能」として設定された予定タイプが必要です",
        variant: "destructive",
      })
      return
    }


    // から文字列が選択肢にあれば除外するためのヘルパー
    function removeEmptyStrings(arr: string[]): string[] {
      return arr.filter((v) => v.trim() !== "")
    }
    
    function removeEmptyScheduleTypes(
      arr: ScheduleType[]
    ): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(scheduleTypes)
      const cleanedXAxis         = removeEmptyStrings(xAxis)
      const cleanedYAxis         = removeEmptyStrings(yAxis)
      const cleanedDateTimes     = removeEmptyStrings(dateTimeOptions)

      // イベントタイプに応じたデータを準備
      const eventData = {
        name: eventName,
        description: eventDesc,
        eventType,
        scheduleTypes: cleanedScheduleTypes,
        xAxis: eventType === "recurring" ? cleanedXAxis : undefined,
        yAxis: eventType === "recurring" ? cleanedYAxis : undefined,
        dateTimeOptions: eventType === "onetime" ? cleanedDateTimes : undefined,
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      if (!res.ok) throw new Error("Network response was not ok")
      const { id } = await res.json()
      router.push(`/events/${id}`)
    } catch (err) {
      console.error(err)
      toast({ title: "作成エラー", description: "イベントの作成に失敗しました", variant: "destructive" })
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

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
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
            <Textarea
              id="eventDesc"
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="このイベントの概要を入力"
              className="h-24"
            />
          </div>
        </div>

        {/* イベントタイプ選択 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">イベントタイプ</h2>
          <ToggleGroup
            type="single"
            variant="outline"
            value={eventType}
            onValueChange={(value) => setEventType(value as "recurring" | "onetime")}
            className="grid w-full grid-cols-2 gap-2 md:w-1/2"
          >
            <ToggleGroupItem value="recurring" aria-label="定期イベント" className="w-full">
              <CalendarDays className="mr-2 h-4 w-4" />
              定期イベント
            </ToggleGroupItem>
            <ToggleGroupItem value="onetime" aria-label="単発イベント" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              単発イベント
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="mt-2 text-sm text-gray-600">
            {eventType === "recurring"
              ? "定期的なミーティングや授業など、曜日×時間のグリッド形式で調整します。"
              : "単発のイベントや会議など、特定の日時のリストから選択して調整します。"}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">{eventType === "recurring" ? "グリッド設定" : "日時設定"}</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="builder">{eventType === "recurring" ? "グリッドビルダー" : "日時リスト"}</TabsTrigger>
              <TabsTrigger value="scheduleTypes">予定タイプ</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
              <TabsTrigger value="templates">テンプレート</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              {eventType === "recurring" ? (
                // 定期イベント用のグリッドビルダー
                <div className="flex flex-col md:flex-row gap-6">
                  {/* X軸設定 */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium flex items-center">
                        <ArrowRight className="h-4 w-4 mr-1" />
                        横軸の項目（曜日など）
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addXItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        追加
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                      {xAxis.map((item, i) => (
                        <div key={`x-${i}`} className="flex items-center gap-2">
                          <Input
                            ref={(el) => (xAxisRefs.current[i] = el)}
                            id={`x-axis-${i}`}
                            value={item}
                            onChange={(e) => updateXItem(i, e.target.value)}
                            onKeyDown={(e) => {
                              const isComposing = (e.nativeEvent as any).isComposing as boolean
                              if (e.key === "Enter" && !isComposing) {
                                e.preventDefault()
                                addXItem()
                              }
                              if (e.key === "Backspace" && !isComposing && e.currentTarget.value === "") {
                                e.preventDefault();  // 必要ならデフォルト動作を抑止
                                removeXItem(i);
                                return;
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeXItem(i)}
                            disabled={xAxis.length <= 1}
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
                      <Label className="text-base font-medium flex items-center">
                        <ArrowDown className="h-4 w-4 mr-1" />
                        縦軸の項目（時限など）
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addYItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        追加
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                      {yAxis.map((item, i) => (
                        <div key={`y-${i}`} className="flex items-center gap-2">
                          <Input
                            ref={(el) => (yAxisRefs.current[i] = el)}
                            id={`y-axis-${i}`}
                            value={item}
                            onChange={(e) => updateYItem(i, e.target.value)}
                            onKeyDown={(e) => {
                              const isComposing = (e.nativeEvent as any).isComposing as boolean
                              if (e.key === "Enter" && !isComposing) {
                                e.preventDefault()
                                addYItem()
                              }
                              if (e.key === "Backspace" && !isComposing && e.currentTarget.value === "") {
                                e.preventDefault();  // 必要ならデフォルト動作を抑止
                                removeYItem(i);
                                return;
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeYItem(i)}
                            disabled={yAxis.length <= 1}
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
                    <Label className="text-base font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      日時オプション
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDateTimeOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {dateTimeOptions.map((item, index) => (
                      <div key={`datetime-${index}`} className="flex items-center gap-2">
                        <Input
                          ref={(el) => (dateTimeRefs.current[index] = el)}
                          id={`datetime-option-${index}`}
                          value={item}
                          onChange={(e) => updateDateTimeOption(index, e.target.value)}
                          onKeyDown={(e) => {
                            const isComposing = (e.nativeEvent as any).isComposing as boolean
                            if (e.key === "Enter" && !isComposing) {
                              e.preventDefault()
                              addDateTimeOption()                              
                            }
                            if (e.key === "Backspace" && !isComposing && e.currentTarget.value === "") {
                              e.preventDefault();  // 必要ならデフォルト動作を抑止
                              removeDateTimeOption(index);
                              return;
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
                          disabled={dateTimeOptions.length <= 1}
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

            <TabsContent value="scheduleTypes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  予定タイプの設定
                </h3>
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
                {scheduleTypes.map((type, index) => (
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
                            const isComposing = (e.nativeEvent as any).isComposing as boolean
                            if (e.key === "Enter" && !isComposing) {
                              e.preventDefault()
                              addScheduleType()
                            }
                            if (e.key === "Backspace" && !isComposing && e.currentTarget.value === "") {
                              e.preventDefault();  // 必要ならデフォルト動作を抑止
                              removeScheduleType(index);
                              return;
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
                          disabled={scheduleTypes.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* ���レビュー */}
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

            <TabsContent value="preview">
              {eventType === "recurring" ? (
                // 定期イベント用のプレビュー（グリッド形式）
                <div className="border rounded overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2"></th>
                        {xAxis.map((item, index) => (
                          <th key={`header-${index}`} className="border p-2 text-center min-w-[80px]">
                            {item || `項目${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {yAxis.map((item, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          <td className="border p-2 font-medium text-center">{item || `項目${rowIndex + 1}`}</td>
                          {xAxis.map((_, colIndex) => (
                            <td key={`cell-${rowIndex}-${colIndex}`} className="border p-2 text-center">
                              <Select>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {scheduleTypes.map((type, typeIndex) => (
                                    <SelectItem
                                      key={`preview-type-${typeIndex}`}
                                      value={type.id}
                                      className={type.color}
                                    >
                                      {type.label}
                                      {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // 単発イベント用のプレビュー（リスト形式）
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md mb-2">
                    <p className="text-sm text-gray-600">
                      参加者は各日時に対して、以下のような選択肢から1つを選びます。
                    </p>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b font-medium">参加可否の入力例</div>
                    <div className="divide-y">
                      {dateTimeOptions.map((dateTime, index) => (
                        <div key={`preview-datetime-${index}`} className="p-3">
                          <div className="font-medium mb-2">{dateTime}</div>
                          <div className="flex flex-wrap gap-2">
                            {scheduleTypes.map((type, typeIndex) => (
                              <button
                                key={`option-${index}-${typeIndex}`}
                                className={`px-3 py-1 rounded-md ${type.color} hover:opacity-80 transition-opacity`}
                              >
                                {type.label}
                                {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                これは入力フォームのプレビューです。実際の入力フォームはこのような形式になります。
              </p>
            </TabsContent>

            <TabsContent value="templates">
              {eventType === "recurring" ? (
                // 定期イベント用のテンプレート
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recurringTemplates.map((template, index) => (
                    <Card key={`template-${index}`} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>
                            横軸: <span className="font-mono">{template.x.join(", ")}</span>
                          </div>
                          <div>
                            縦軸: <span className="font-mono">{template.y.join(", ")}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => applyRecurringTemplate(index)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          このテンプレートを使用
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // 単発イベント用のテンプレート
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onetimeTemplates.map((template, index) => (
                    <Card key={`template-${index}`} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>
                            日時オプション: <span className="font-mono">{template.options.join(", ")}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => applyOnetimeTemplate(index)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          このテンプレートを使用
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Button type="submit" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          イベントを作成
        </Button>
      </form>
    </div>
  )
}
