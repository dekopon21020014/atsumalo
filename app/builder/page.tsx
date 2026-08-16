"use client"

import type React from "react"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
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
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  colorPalettes,
  recurringTemplates,
  getOnetimeTemplates,
  scheduleTypeTemplates,
  xAxisTemplate,
  yAxisTemplate,
  gradeTemplates,
  defaultGradeOrder,
} from "../events/[eventId]/components/constants"
import type { ScheduleType } from "../events/[eventId]/components/constants"

// セクション見出し（番号バッジ付き）
function SectionHeader({
  step,
  title,
  description,
  icon,
}: {
  step: number
  title: string
  description?: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-tight">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
    </div>
  )
}

// ── カレンダー補助ウィジェット（行追加用） ─────────────────────────────
const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

function CalendarAssist({
  existingValues,
  onPickDate,
}: {
  existingValues: string[] // 現在の dateTimeOptions（ハイライト判定に使う）
  onPickDate: (label: string, date: Date) => void // 行追加コールバック（label = "M/D"、date = Date object）
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // existingValues の中に "M/D" で始まる行があるか判定（例：8/10が8/1にマッチしないよう厳密にチェック）
  const isAlreadyAdded = (day: number) => {
    const label = `${viewMonth + 1}/${day}`
    return existingValues.some((v) => v === label || v.startsWith(label + " ") || v.startsWith(label + "（"))
  }

  return (
    <div className="w-full rounded-lg border bg-muted/30">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="前月"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="翌月"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 曜日 */}
      <div className="grid grid-cols-7 border-b">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-1 text-center text-[10px] font-semibold",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 p-1 gap-0.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-7" />
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isToday = dateStr === todayStr
          const added = isAlreadyAdded(day)
          const col = idx % 7
          const label = `${viewMonth + 1}/${day}`
          const dateObj = new Date(viewYear, viewMonth, day)
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onPickDate(label, dateObj)}
              title={added ? `${label}（追加済み）` : `${label}を追加`}
              className={cn(
                "h-7 w-full rounded text-xs font-medium transition-colors",
                added
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-primary/15",
                isToday && !added && "ring-1 ring-inset ring-primary/50 font-bold",
                col === 0 && !added && "text-red-500",
                col === 6 && !added && "text-blue-500",
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [eventPassword, setEventPassword] = useState("")
  const [eventType, setEventType] = useState<"recurring" | "onetime" | undefined>(undefined)

  // 定期イベント用の軸
  const [xAxis, setXAxis] = useState<string[]>([])
  const [yAxis, setYAxis] = useState<string[]>([])

  // 単発イベント用の軸（日時の組み合わせ）
  const [dateTimeOptions, setDateTimeOptions] = useState<string[]>([])
  const onetimeTemplates = useMemo(() => getOnetimeTemplates(), [])

  // 時刻サフィックス（カレンダークリック時に付与）
  const [useTimeSuffix, setUseTimeSuffix] = useState(true)
  const [timeSuffix, setTimeSuffix] = useState("")

  // 所属/役職の選択肢
  const [gradeOptions, setGradeOptions] = useState<{ name: string; priority: number }[]>([])

  const router = useRouter()

  // 予定タイプの初期値
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>([])

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

  // 日時オプションを追加（空行）
  const addDateTimeOption = () => {
    setDateTimeOptions((prev) => {
      const newOptions = [...prev, ""]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        dateTimeRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // カレンダーからラベルで行を追加（曜日・時刻サフィックス付き）
  const addDateTimeByLabel = (label: string, date: Date) => {
    const dow = WEEK_DAYS[date.getDay()]
    const labelWithDow = `${label}（${dow}）`
    const trimmedSuffix = timeSuffix.trim()
    const finalLabel = useTimeSuffix && trimmedSuffix ? `${labelWithDow} ${trimmedSuffix}` : labelWithDow
    setDateTimeOptions((prev) => {
      const newOptions = [...prev, finalLabel]
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

  // 予定タイプを追加
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
    const newTypes = [...scheduleTypes]
    newTypes[index].isAvailable = isAvailable
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
    const trimmedSuffix = timeSuffix.trim()
    const newOptions = template.options.map((opt) =>
      useTimeSuffix && trimmedSuffix ? `${opt} ${trimmedSuffix}` : opt
    )
    setDateTimeOptions([...newOptions])
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

    if (!eventType) {
      toast({ title: "エラー", description: "イベントタイプを選択してください", variant: "destructive" })
      return
    }

    if (eventType === "recurring") {
      const validX = xAxis.filter((v) => v.trim() !== "")
      const validY = yAxis.filter((v) => v.trim() !== "")
      if (validX.length === 0 || validY.length === 0) {
        toast({ title: "エラー", description: "横軸と縦軸の項目を設定してください", variant: "destructive" })
        return
      }
    } else {
      const validDates = dateTimeOptions.filter((v) => v.trim() !== "")
      if (validDates.length === 0) {
        toast({ title: "エラー", description: "日時の項目を設定してください", variant: "destructive" })
        return
      }
    }

    const hasAvailableType = scheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "エラー",
        description: "「参加可能」として設定された予定タイプが必要です",
        variant: "destructive",
      })
      return
    }

    function removeEmptyScheduleTypes(arr: ScheduleType[]): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(scheduleTypes)
      const cleanedXAxis = xAxis.map((v) => v.trim()).filter((v) => v !== "")
      const cleanedYAxis = yAxis.map((v) => v.trim()).filter((v) => v !== "")
      const cleanedDateTimes = dateTimeOptions.map((v) => v.trim()).filter((v) => v !== "")
      const cleanedGrades = gradeOptions.map((g) => g.name.trim()).filter((v) => v !== "")
      const gradeOrder = gradeOptions.reduce(
        (acc, g) => {
          const name = g.name.trim()
          if (name) acc[name] = g.priority
          return acc
        },
        {} as Record<string, number>,
      )

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

  const availableType = scheduleTypes.find((t) => t.isAvailable)

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            イベント作成
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">日程調整イベントを作成</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            下のステップを順に埋めていくだけで、参加者に共有できる調整ページが作れます。作成から3ヶ月後にページは自動的に削除されます。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
            {/* 左：入力セクション */}
            <div className="space-y-6">
              {/* Step 1: 基本情報 */}
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={1}
                    icon={<Calendar className="h-5 w-5" />}
                    title="基本情報"
                    description="イベント名は参加者にそのまま表示されます。"
                  />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="eventName" className="flex items-center gap-1 text-sm font-medium">
                        イベント名
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="例：ゼミ日程調整"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eventDesc" className="flex items-center gap-1 text-sm font-medium">
                        <FileText className="h-3.5 w-3.5" />
                        説明（任意）
                      </Label>
                      <Textarea
                        id="eventDesc"
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="このイベントの概要を入力"
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: 形式 */}
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={2}
                    icon={<Settings className="h-5 w-5" />}
                    title="イベント形式を選ぶ"
                    description="調整したい内容に合わせて形式を選んでください。"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEventType("recurring")}
                      aria-pressed={eventType === "recurring"}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                        eventType === "recurring"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CalendarDays className="h-5 w-5" />
                        定期イベント
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty">
                        曜日 × 時限などのグリッド形式。ゼミや授業の調整に。
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType("onetime")}
                      aria-pressed={eventType === "onetime"}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                        eventType === "onetime"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Calendar className="h-5 w-5" />
                        単発イベント
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty">
                        特定の日時リストから選択。飲み会や会議の調整に。
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: 候補（グリッド or 日時） */}
              {eventType && (
                <Card>
                  <CardContent className="space-y-5 p-6">
                    <SectionHeader
                      step={3}
                      icon={eventType === "recurring" ? <CalendarDays className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      title={eventType === "recurring" ? "調整するグリッド" : "候補の日時"}
                      description={
                        eventType === "recurring"
                          ? "横軸（曜日など）と縦軸（時限など）を設定します。Enterで追加、空欄でBackspaceで削除できます。"
                          : "候補となる日時を追加します。Enterで追加、空欄でBackspaceで削除できます。"
                      }
                    />

                    {/* テンプレート */}
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        テンプレートから開始
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {eventType === "recurring"
                          ? recurringTemplates.map((template, index) => (
                              <Button
                                key={`rt-${index}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 bg-background"
                                onClick={() => applyRecurringTemplate(index)}
                              >
                                {template.name}
                              </Button>
                            ))
                          : onetimeTemplates.map((template: { name: string; options: string[] }, index: number) => (
                              <Button
                                key={`onetime-tpl-${index}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 bg-background"
                                onClick={() => applyOnetimeTemplate(index)}
                              >
                                {template.name}
                              </Button>
                            ))}
                      </div>
                    </div>

                    {eventType === "recurring" ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* X軸 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              <ArrowRight className="h-4 w-4" />
                              横軸（曜日など）
                            </Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addXItem}>
                              <Plus className="mr-1 h-4 w-4" />
                              追加
                            </Button>
                          </div>
                          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {xAxis.length === 0 && (
                              <p className="py-4 text-center text-xs text-muted-foreground">
                                「追加」ボタンで列を追加してください。
                              </p>
                            )}
                            {xAxis.map((item, i) => (
                              <div key={`x-${i}`} className="flex items-center gap-2">
                                <Input
                                  ref={(el) => {
                                    if (el) xAxisRefs.current[i] = el
                                  }}
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
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Y軸 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              <ArrowDown className="h-4 w-4" />
                              縦軸（時限など）
                            </Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addYItem}>
                              <Plus className="mr-1 h-4 w-4" />
                              追加
                            </Button>
                          </div>
                          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {yAxis.length === 0 && (
                              <p className="py-4 text-center text-xs text-muted-foreground">
                                「追加」ボタンで行を追加してください。
                              </p>
                            )}
                            {yAxis.map((item, i) => (
                              <div key={`y-${i}`} className="flex items-center gap-2">
                                <Input
                                  ref={(el) => {
                                    if (el) yAxisRefs.current[i] = el
                                  }}
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
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                        {/* 左：行入力リスト */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              <Clock className="h-4 w-4" />
                              日時オプション
                            </Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addDateTimeOption}>
                              <Plus className="mr-1 h-4 w-4" />
                              追加
                            </Button>
                          </div>
                          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                            {dateTimeOptions.length === 0 && (
                              <p className="py-4 text-center text-xs text-muted-foreground">
                                右のカレンダーで日付を選ぶか「追加」ボタンで行を追加してください。
                              </p>
                            )}
                            {dateTimeOptions.map((item, index) => (
                              <div key={`datetime-${index}`} className="flex items-center gap-2">
                                <Input
                                  ref={(el) => {
                                    if (el) dateTimeRefs.current[index] = el
                                  }}
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
                                  placeholder="例: 8/17 19:00"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDateTimeOption(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            「5/1 19:00」のような形式で入力。Enterで次の行を追加、空欄でBackspaceで削除。
                          </p>
                        </div>

                        {/* 右：補助カレンダー */}
                        <div className="w-full sm:w-[220px] shrink-0 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            カレンダーから追加
                          </p>
                          {/* 時刻オプション（調整さん方式） */}
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={useTimeSuffix}
                              onChange={(e) => setUseTimeSuffix(e.target.checked)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            日付の後に時刻を追加する
                          </label>
                          {useTimeSuffix && (
                            <Input
                              type="text"
                              value={timeSuffix}
                              onChange={(e) => setTimeSuffix(e.target.value)}
                              placeholder="例: 19:00 / 19:00@渋谷"
                              className="h-7 w-full text-xs"
                            />
                          )}
                          <CalendarAssist
                            existingValues={dateTimeOptions}
                            onPickDate={addDateTimeByLabel}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: 予定タイプ */}
              {eventType && (
                <Card>
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <SectionHeader
                        step={4}
                        icon={<Check className="h-5 w-5" />}
                        title="回答の選択肢（予定タイプ）"
                        description="参加者が各コマで選ぶ選択肢です。「参加可能」に設定すると集計の基準になります。"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addScheduleType} className="shrink-0 bg-background">
                        <Plus className="mr-1 h-4 w-4" />
                        追加
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {scheduleTypeTemplates.map((template, index) => (
                        <Button
                          key={`st-tpl-${index}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 bg-background"
                          onClick={() => {
                            setScheduleTypes(template.options.map(opt => ({ ...opt })))
                            toast({ title: "テンプレート適用", description: `「${template.name}」を適用しました` })
                          }}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {scheduleTypes.map((type, index) => (
                        <div key={`type-${index}`} className="rounded-lg border bg-card p-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-sm", type.color)}>
                              {type.label || "（無題）"}
                              {type.isAvailable && <Check className="ml-1 h-3 w-3" />}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              <Label htmlFor={`type-available-${index}`} className="text-xs text-muted-foreground">
                                参加可能
                              </Label>
                              <Switch
                                id={`type-available-${index}`}
                                checked={type.isAvailable}
                                onCheckedChange={(checked) => updateScheduleTypeAvailability(index, checked)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeScheduleType(index)}
                                disabled={scheduleTypes.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              ref={(el) => {
                                if (el) typeLabelRefs.current[index] = el
                              }}
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
                                  e.preventDefault()
                                  removeScheduleType(index)
                                  return
                                }
                              }}
                              placeholder="ラベル"
                              className="flex-1"
                            />
                            <Select value={type.color} onValueChange={(value) => updateScheduleTypeColor(index, value)}>
                              <SelectTrigger id={`type-color-${index}`} className={cn("w-28", type.color)}>
                                <SelectValue placeholder="色" />
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: 詳細設定 */}
              {eventType && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={5}
                    icon={<UserPlus className="h-5 w-5" />}
                    title="詳細設定（任意）"
                    description="所属/役職の選択肢と合言葉を設定できます。"
                  />

                  {/* 所属/役職 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">所属/役職の選択肢</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addGradeOption}>
                        <Plus className="mr-1 h-4 w-4" />
                        追加
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">数字が小さいほど優先度が高くなります。</p>
                    
                    <div className="flex flex-wrap gap-2 py-2">
                      {gradeTemplates.map((template, index) => (
                        <Button
                          key={`grade-tpl-${index}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 bg-background"
                          onClick={() => {
                            setGradeOptions(
                              template.options.map((grade) => ({
                                name: grade,
                                priority: defaultGradeOrder[grade] || 99,
                              }))
                            )
                            toast({ title: "テンプレート適用", description: `「${template.name}」を適用しました` })
                          }}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>

                    <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="flex-1">所属/役職</span>
                        <span className="w-20 text-center">優先度</span>
                        <span className="w-9" />
                      </div>
                      {gradeOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            ref={(el) => {
                              if (el) gradeOptionRefs.current[i] = el
                            }}
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
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 合言葉 */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="usePassword" className="flex-1 text-sm font-medium">
                        合言葉で保護する
                      </Label>
                      <Switch id="usePassword" checked={usePassword} onCheckedChange={setUsePassword} />
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
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

            {/* 右：ライブプレビュー + 作成ボタン */}
            <aside className="xl:sticky xl:top-6 xl:self-start">
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">プレビュー</span>
                  <span className="ml-auto text-xs text-muted-foreground">参加者に見える画面</span>
                </div>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <h3 className="font-semibold leading-tight text-balance">{eventName || "（イベント名未入力）"}</h3>
                    {eventDesc && <p className="mt-1 text-xs text-muted-foreground text-pretty">{eventDesc}</p>}
                  </div>

                  {!eventType ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      形式を選ぶと、ここに入力フォームのプレビューが表示されます。
                    </div>
                  ) : eventType === "recurring" ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-1.5" />
                            {xAxis.map((item, index) => (
                              <th key={`ph-${index}`} className="border p-1.5 text-center font-medium">
                                {item || `項目${index + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {yAxis.map((item, rowIndex) => (
                            <tr key={`pr-${rowIndex}`}>
                              <td className="border bg-muted/50 p-1.5 text-center font-medium">{item || `項目${rowIndex + 1}`}</td>
                              {xAxis.map((_, colIndex) => (
                                <td key={`pc-${rowIndex}-${colIndex}`} className="border p-1 text-center">
                                  <span
                                    className={cn(
                                      "inline-block w-full rounded px-1 py-0.5 text-[10px]",
                                      availableType?.color ?? "bg-muted",
                                    )}
                                  >
                                    {availableType?.label ?? "選択"}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {dateTimeOptions.map((dateTime, index) => (
                        <div key={`pl-${index}`} className="p-2.5">
                          <div className="mb-1.5 text-xs font-medium">{dateTime}</div>
                          <div className="flex flex-wrap gap-1">
                            {scheduleTypes.map((type, typeIndex) => (
                              <span
                                key={`po-${index}-${typeIndex}`}
                                className={cn("rounded px-2 py-0.5 text-[11px]", type.color)}
                              >
                                {type.label}
                                {type.isAvailable && <Check className="ml-0.5 inline-block h-2.5 w-2.5" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={!eventName.trim() || !eventType}>
                    <Save className="mr-2 h-4 w-4" />
                    イベントを作成
                  </Button>
                  {!eventType && (
                    <p className="text-center text-xs text-muted-foreground">
                      イベント名と形式を設定すると作成できます。
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}
