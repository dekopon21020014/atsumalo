"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  FileText,
  UserPlus,
  Lock,
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
  yAxisTemplate,
  defaultGradeOptions,
  defaultGradeOrder,
} from "../events/[eventId]/components/constants"
import type { ScheduleType } from "../events/[eventId]/components/constants"

export default function HomePage() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [eventPassword, setEventPassword] = useState("")
  const [eventType, setEventType] = useState<"recurring" | "onetime">("recurring")

  // 定期イベント用の軸
  const [xAxis, setXAxis] = useState(xAxisTemplate)
  const [yAxis, setYAxis] = useState(yAxisTemplate)

  // 単発イベント用の軸（日時の組み合わせ）
  const [dateTimeOptions, setDateTimeOptions] = useState(["5/1 19:00", "5/2 19:00", "5/3 20:00"])

  // 所属/役職の選択肢
  const [gradeOptions, setGradeOptions] = useState(
    defaultGradeOptions.map((g) => ({ name: g, priority: defaultGradeOrder[g] || 0 })),
  )

  const [activeTab, setActiveTab] = useState("builder")
  const router = useRouter()

  // 予定タイプの初期値
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(scheduleTypeTemplate)

  const xAxisRefs = useRef<HTMLInputElement[]>([])
  const yAxisRefs = useRef<HTMLInputElement[]>([])
  const dateTimeRefs = useRef<HTMLInputElement[]>([])
  const typeLabelRefs = useRef<HTMLInputElement[]>([])
  const gradeOptionRefs = useRef<HTMLInputElement[]>([])

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

  // 所属/役職の項目を追加
  const addGradeOption = () => {
    setGradeOptions((prev) => {
      const newOptions = [...prev, { name: `選択肢${prev.length + 1}`, priority: prev.length + 1 }]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        gradeOptionRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // 所属/役職の項目を削除
  const removeGradeOption = (index: number) => {
    if (gradeOptions.length <= 1) return
    const newOpts = [...gradeOptions]
    newOpts.splice(index, 1)
    setGradeOptions(newOpts)
  }

  // 所属/役職の名称を更新
  const updateGradeOptionName = (index: number, value: string) => {
    const newOpts = [...gradeOptions]
    newOpts[index].name = value
    setGradeOptions(newOpts)
  }

  // 所属/役職の優先度を更新
  const updateGradeOptionPriority = (index: number, value: number) => {
    const newOpts = [...gradeOptions]
    newOpts[index].priority = value
    setGradeOptions(newOpts)
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
    function removeEmptyScheduleTypes(arr: ScheduleType[]): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(scheduleTypes)
      const cleanedXAxis = xAxis.filter((v) => v.trim() !== "")
      const cleanedYAxis = yAxis.filter((v) => v.trim() !== "")
      const cleanedDateTimes = dateTimeOptions.filter((v) => v.trim() !== "")
      const cleanedGrades = gradeOptions.filter((g) => g.name.trim() !== "").map((g) => g.name.trim())
      const gradeOrder = gradeOptions.reduce(
        (acc, g) => {
          const name = g.name.trim()
          if (name) acc[name] = g.priority
          return acc
        },
        {} as Record<string, number>,
      )

      // イベントタイプに応じたデータを準備
      const eventData = {
        name: eventName,
        description: eventDesc,
        eventType,
        scheduleTypes: cleanedScheduleTypes,
        gradeOptions: cleanedGrades,
        gradeOrder,
        xAxis: eventType === "recurring" ? cleanedXAxis : undefined,
        yAxis: eventType === "recurring" ? cleanedYAxis : undefined,
        dateTimeOptions: eventType === "onetime" ? cleanedDateTimes : undefined,
        password: usePassword ? eventPassword : undefined,
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
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-black p-8 text-white">
        <h1 className="text-4xl font-extrabold tracking-tight">イベント管理アプリ</h1>
        <p className="mt-2 text-lg">研究室ゼミや勉強会などの「日程調整」をスマートに行うためのツールです。</p>
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>イベントを作成</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5" />
            <span>リンクを共有</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>参加者が回答</span>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>結果を確認</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                イベント名
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="例：ゼミ日程調整"
                required
              />
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                イベント説明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="eventDesc"
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="このイベントの概要を入力"
                className="h-24"
              />
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Lock className="h-5 w-5" />
                合言葉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="usePassword" checked={usePassword} onCheckedChange={setUsePassword} />
                <Label htmlFor="usePassword" className="text-sm">
                  合言葉を設定する
                </Label>
              </div>
              {usePassword && (
                <Input
                  id="eventPassword"
                  type="text"
                  value={eventPassword}
                  onChange={(e) => setEventPassword(e.target.value)}
                  placeholder="合言葉を入力"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* イベントタイプ選択 */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5" />
                イベントタイプ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                type="single"
                value={eventType}
                onValueChange={(value) => setEventType(value as "recurring" | "onetime")}
                className="grid w-full grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="recurring"
                  aria-label="定期イベント"
                  className="w-full data-[state=on]:bg-black data-[state=on]:text-white"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  定期イベント
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="onetime"
                  aria-label="単発イベント"
                  className="w-full data-[state=on]:bg-black data-[state=on]:text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  単発イベント
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {eventType === "recurring"
                  ? "定期的なミーティングや授業など、曜日×時間のグリッド形式で調整します。"
                  : "単発のイベントや会議など、特定の日時のリストから選択して調整します。"}
              </div>
            </CardContent>
          </Card>

          {/* 所属/役職設定 */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                所属/役職の選択肢
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {gradeOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      ref={(el) => (gradeOptionRefs.current[i] = el)}
                      value={opt.name}
                      onChange={(e) => updateGradeOptionName(i, e.target.value)}
                      onKeyDown={(e) => {
                        const isComposing = (e.nativeEvent as any).isComposing as boolean
                        if (e.key === "Enter" && !isComposing) {
                          e.preventDefault()
                          addGradeOption()
                        }
                        if (
                          (e.key === "Backspace" || e.key === "Delete") &&
                          !isComposing &&
                          e.currentTarget.value === ""
                        ) {
                          e.preventDefault()
                          removeGradeOption(i)
                          requestAnimationFrame(() => {
                            const prevIndex = Math.max(i - 1, 0)
                            gradeOptionRefs.current[prevIndex]?.focus()
                          })
                          return
                        }
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={opt.priority}
                      onChange={(e) => updateGradeOptionPriority(i, Number(e.target.value))}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGradeOption(i)}
                      disabled={gradeOptions.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGradeOption}
                className="mt-2 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              {eventType === "recurring" ? <CalendarDays className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              {eventType === "recurring" ? "グリッド設定" : "日時設定"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 flex w-full overflow-x-auto justify-start md:justify-center bg-white/60 dark:bg-gray-700/50 p-1 rounded-lg">
                <TabsTrigger value="builder">
                  {eventType === "recurring" ? "グリッドビルダー" : "日時リスト"}
                </TabsTrigger>
                <TabsTrigger value="scheduleTypes">予定タイプ</TabsTrigger>
                <TabsTrigger value="preview">プレビュー</TabsTrigger>
                <TabsTrigger value="templates">テンプレート</TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-6">
                {eventType === "recurring" ? (
                  // 定期イベント用のグリッドビルダー
                  <div className="flex flex-col lg:flex-row gap-6">
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
                                if (
                                  (e.key === "Backspace" || e.key === "Delete") &&
                                  !isComposing &&
                                  e.currentTarget.value === ""
                                ) {
                                  e.preventDefault()
                                  removeXItem(i)
                                  requestAnimationFrame(() => {
                                    const prevIndex = Math.max(i - 1, 0)
                                    xAxisRefs.current[prevIndex]?.focus()
                                  })
                                  return
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
                                if (
                                  (e.key === "Backspace" || e.key === "Delete") &&
                                  !isComposing &&
                                  e.currentTarget.value === ""
                                ) {
                                  e.preventDefault()
                                  removeYItem(i)
                                  requestAnimationFrame(() => {
                                    const prevIndex = Math.max(i - 1, 0)
                                    yAxisRefs.current[prevIndex]?.focus()
                                  })
                                  return
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
                              if (
                                (e.key === "Backspace" || e.key === "Delete") &&
                                !isComposing &&
                                e.currentTarget.value === ""
                              ) {
                                e.preventDefault()
                                removeDateTimeOption(index)
                                requestAnimationFrame(() => {
                                  const prevIndex = Math.max(index - 1, 0)
                                  dateTimeRefs.current[prevIndex]?.focus()
                                })
                                return
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

                <div className="grid gap-4 lg:grid-cols-2">
                  {scheduleTypes.map((type, index) => (
                    <div key={`type-${index}`} className="border rounded-md p-4 bg-white">
                      <div className="flex flex-col gap-3">
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
                                e.preventDefault() // 必要ならデフォルト動作を抑止
                                removeScheduleType(index)
                                return
                              }
                            }}
                            placeholder="予定タイプの名前"
                          />
                        </div>

                        <div className="flex items-end gap-3">
                          {/* 色選択 */}
                          <div className="flex-1">
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
                          <div className="flex items-center space-x-2">
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

                      {/* プレビュー */}
                      <div className="mt-3 pt-3 border-t">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            className="w-full bg-transparent"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            className="w-full bg-transparent"
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
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button type="submit" size="lg" className="px-8">
            <Save className="h-4 w-4 mr-2" />
            イベントを作成
          </Button>
        </div>
      </form>
    </div>
  )
}
