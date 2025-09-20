"use client"

import { useParams, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, BarChart3, Share2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import SchedulePage from "@/app/events/[eventId]/components/SchedulePage"
import OneTimePage from "@/app/events/[eventId]/components/OneTimePage"
import type { EventData, ScheduleType } from "@/app/events/[eventId]/components/constants"
import * as ja from "@/app/events/[eventId]/components/constants"
import * as en from "@/app/en/events/[eventId]/components/constants"
import Link from "next/link"

export default function EventPage() {
  const { eventId } = useParams()
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const { defaultGradeOrder, defaultGradeOptions, colorPalettes } = isEnglish ? en : ja

  const [data, setData] = useState<EventData>({
    name: isEnglish ? "Loading..." : "読み込み中…",
    description: isEnglish ? "Loading..." : "読み込み中…",
    eventType: "recurring",
    xAxis: [],
    yAxis: [],
    dateTimeOptions: [],
    scheduleTypes: [],
    existingResponses: [],
    gradeOptions: [],
    gradeOrder: defaultGradeOrder,
  })

  // 編集用の状態
  const [name, setName] = useState(data.name)
  const [description, setDescription] = useState(data.description)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [needPassword, setNeedPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)

  // 編集用の日程候補と選択肢
  const [editXAxis, setEditXAxis] = useState<string[]>([])
  const [editYAxis, setEditYAxis] = useState<string[]>([])
  const [editDateTimeOptions, setEditDateTimeOptions] = useState<string[]>([])
  const [editScheduleTypes, setEditScheduleTypes] = useState<ScheduleType[]>([])
  const [editGradeOptions, setEditGradeOptions] = useState<{ name: string; priority: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const xAxisRefs = useRef<HTMLInputElement[]>([])
  const yAxisRefs = useRef<HTMLInputElement[]>([])
  const dateTimeRefs = useRef<HTMLInputElement[]>([])
  const typeLabelRefs = useRef<HTMLInputElement[]>([])
  const gradeOptionRefs = useRef<HTMLInputElement[]>([])
  const eventIdValue = typeof eventId === "string" ? eventId : ""


  
  const loadEvent = async (pass?: string) => {
    if (!eventIdValue) return
  
    const tokenStorageKey = `event_${eventIdValue}_token`
  
    try {
      const headers: HeadersInit = {}
      let tokenToUse = accessToken
  
      if (!pass && !tokenToUse && typeof window !== "undefined") {
        const stored = window.localStorage.getItem(tokenStorageKey)
        if (stored) {
          tokenToUse = stored
          setAccessToken(stored)
        }
      }
  
      if (tokenToUse) {
        headers["Authorization"] = `Bearer ${tokenToUse}`
      }
  
      const url = `/api/events/${eventIdValue}${pass ? `?password=${encodeURIComponent(pass)}` : ""}`
      const res = await fetch(url, { headers })
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(tokenStorageKey)
        }
        setAccessToken(null)
        setRequiresPassword(true)
        setNeedPassword(true)
        return
      }
  
      const resData = await res.json()
      if (resData.error) {
        toast({
          title: isEnglish ? "Load error" : "読み込みエラー",
          description: resData.error,
          variant: "destructive",
        })
        return
      }
  
      const passwordRequired = Boolean(resData.requiresPassword)
      setRequiresPassword(passwordRequired)
  
      if (passwordRequired && typeof resData.accessToken === "string") {
        setAccessToken(resData.accessToken)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(tokenStorageKey, resData.accessToken)
        }
      } else {
        setAccessToken(null)
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(tokenStorageKey)
        }
      }
  
      setData({
        name: resData.name,
        description: resData.description ?? "",
        eventType: resData.eventType === "onetime" ? "onetime" : "recurring",
        xAxis: Array.isArray(resData.xAxis) ? resData.xAxis : [],
        yAxis: Array.isArray(resData.yAxis) ? resData.yAxis : [],
        dateTimeOptions: Array.isArray(resData.dateTimeOptions)
          ? resData.dateTimeOptions
          : [],
        scheduleTypes: Array.isArray(resData.scheduleTypes) ? resData.scheduleTypes : [],
        existingResponses: Array.isArray(resData.participants)
          ? resData.participants.map((p: any) => ({
              id: p.id,
              name: p.name,
              grade: p.grade,
              comment: typeof p?.comment === "string" ? p.comment.trim() : "",
              schedule: p.schedule,
            }))
          : [],
        gradeOptions: Array.isArray(resData.gradeOptions)
          ? resData.gradeOptions.sort(
              (a: string, b: string) =>
                (resData.gradeOrder?.[a] ?? 999) - (resData.gradeOrder?.[b] ?? 999),
            )
          : [],
        gradeOrder:
          typeof resData.gradeOrder === "object" ? resData.gradeOrder : defaultGradeOrder,
      })
      setName(resData.name)
      setDescription(resData.description ?? "")
      setEditXAxis(Array.isArray(resData.xAxis) ? [...resData.xAxis] : [])
      setEditYAxis(Array.isArray(resData.yAxis) ? [...resData.yAxis] : [])
      setEditDateTimeOptions(
        Array.isArray(resData.dateTimeOptions) ? [...resData.dateTimeOptions] : [],
      )
      setEditScheduleTypes(
        Array.isArray(resData.scheduleTypes) ? [...resData.scheduleTypes] : [],
      )
      setEditGradeOptions(
        Array.isArray(resData.gradeOptions)
          ? resData.gradeOptions
              .map((g: string) => ({
                name: g,
                priority:
                  (resData.gradeOrder && typeof resData.gradeOrder[g] === "number"
                    ? resData.gradeOrder[g]
                    : defaultGradeOrder[g]) ?? 0,
              }))
              .sort((a, b) => a.priority - b.priority)
          : defaultGradeOptions.map((g) => ({
              name: g,
              priority: defaultGradeOrder[g] ?? 0,
            }))
      )
      setNeedPassword(false)
      setPasswordInput("")
    } catch (err) {
      console.error(err)
      toast({
        title: isEnglish ? "Load error" : "読み込みエラー",
        description: isEnglish ? "Failed to communicate" : "通信に失敗しました",
        variant: "destructive",
      })
    }
  }


  useEffect(() => {
    loadEvent()
  }, [eventIdValue])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await loadEvent(passwordInput)
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

  const shareEvent = () => {
    const url = window.location.href

    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: isEnglish ? "URL copied" : "URLをコピーしました",
          description: isEnglish
            ? "Event URL copied to clipboard."
            : "イベントのURLがクリップボードにコピーされました。",
        })
      },
      (err) => {
        console.error("URLのコピーに失敗しました:", err)
        toast({
          title: isEnglish ? "Copy failed" : "コピーに失敗しました",
          description: isEnglish
            ? "Failed to copy URL. Please try again."
            : "URLのコピーに失敗しました。もう一度お試しください。",
          variant: "destructive",
        })
      },
    )

    if (navigator.share) {
      navigator
        .share({
          title: data.name,
          text: data.description,
          url,
        })
        .catch((err) => {
          console.error("URLの共有に失敗しました:", err)
          toast({
            title: isEnglish ? "Share failed" : "共有に失敗しました",
            description: isEnglish
              ? "Failed to share URL. Please try again."
              : "URLの共有に失敗しました。もう一度お試しください。",
            variant: "destructive",
          })
        })
    }
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

  // 所属/役職の項目を追加
  const addGradeOption = () => {
    setEditGradeOptions((prev) => {
      const newOptions = [
        ...prev,
        { name: `選択肢${prev.length + 1}`, priority: prev.length + 1 },
      ]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        gradeOptionRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // 所属/役職の項目を削除
  const removeGradeOption = (index: number) => {
    if (editGradeOptions.length <= 1) return
    const newOpts = [...editGradeOptions]
    newOpts.splice(index, 1)
    setEditGradeOptions(newOpts)
  }

  // 所属/役職の名称を更新
  const updateGradeOptionName = (index: number, value: string) => {
    const newOpts = [...editGradeOptions]
    newOpts[index].name = value
    setEditGradeOptions(newOpts)
  }

  // 所属/役職の優先度を更新
  const updateGradeOptionPriority = (index: number, value: number) => {
    const newOpts = [...editGradeOptions]
    newOpts[index].priority = value
    setEditGradeOptions(newOpts)
  }

  // 編集をキャンセル
  const cancelEdit = () => {
    setName(data.name)
    setDescription(data.description)
    setEditXAxis([...data.xAxis])
    setEditYAxis([...data.yAxis])
    setEditDateTimeOptions([...data.dateTimeOptions])
    setEditScheduleTypes([...data.scheduleTypes])
    setEditGradeOptions(
      data.gradeOptions.map((g) => ({
        name: g,
        priority: data.gradeOrder[g] ?? 0,
      }))
    )
    setEditMode(false)
    setActiveTab("basic")
  }

  // 編集内容を保存
  const saveEdit = async () => {
    if (!name.trim()) {
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: isEnglish
          ? "Please enter an event name"
          : "イベント名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (!eventIdValue) return

    if (requiresPassword && !accessToken) {
      toast({
        title: isEnglish ? "Authentication required" : "認証が必要です",
        description: isEnglish
          ? "Please unlock the event with the correct password before updating."
          : "正しい合言葉でイベントを解錠してから更新してください。",
        variant: "destructive",
      })
      return
    }

    // イベントタイプに応じたバリデーション
    if (data.eventType === "recurring") {
      if (editXAxis.length === 0 || editYAxis.length === 0) {
        toast({
          title: isEnglish ? "Error" : "エラー",
          description: isEnglish
            ? "Please set both X and Y axis items"
            : "横軸と縦軸の項目を設定してください",
          variant: "destructive",
        })
        return
      }
    } else {
      if (editDateTimeOptions.length === 0) {
        toast({
          title: isEnglish ? "Error" : "エラー",
          description: isEnglish
            ? "Please set at least one date/time option"
            : "日時の項目を設定してください",
          variant: "destructive",
        })
        return
      }
    }

    // 参加可能な予定タイプが設定されているか確認
    const hasAvailableType = editScheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: isEnglish
          ? 'At least one schedule type must be marked as "Available"'
          : '「参加可能」として設定された予定タイプが必要です',
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
      const cleanedGrades        = editGradeOptions.filter((o) => o.name.trim() !== "")
      const gradeOptions         = cleanedGrades.map((o) => o.name)
      const gradeOrder: Record<string, number> = {}
      cleanedGrades.forEach((o) => {
        gradeOrder[o.name] = o.priority
      })
      // イベントタイプに応じたデータを準備
      const updateData = {
        name,
        description,
        eventType: data.eventType,
        scheduleTypes: cleanedScheduleTypes,
        gradeOptions,
        gradeOrder,
        ...(data.eventType === "recurring"
          ? { xAxis: cleanedXAxis, yAxis: cleanedYAxis }
          : { dateTimeOptions: cleanedDateTimes }),
      }

      const res = await fetch(`/api/events/${eventIdValue}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(updateData),
      })

      const json = await res.json()
      if (!res.ok)
        throw new Error(json.error || (isEnglish ? "Update failed" : "更新に失敗しました"))

      toast({
        title: isEnglish ? "Success" : "完了",
        description: isEnglish ? "Event information updated" : "イベント情報を更新しました",
      })

      // データを更新
      setData((prev) => ({
        ...prev,
        name,
        description,
        xAxis: cleanedXAxis,
        yAxis: cleanedYAxis,
        dateTimeOptions: cleanedDateTimes,
        scheduleTypes: cleanedScheduleTypes,
        gradeOptions: gradeOptions.sort(
          (a, b) => (gradeOrder[a] ?? 999) - (gradeOrder[b] ?? 999)
        ),
        gradeOrder,
      }))

      setEditGradeOptions(cleanedGrades)

      setEditMode(false)
    } catch (err: any) {
      console.error(err)
      toast({
        title: isEnglish ? "Update error" : "更新エラー",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (needPassword) {
    return (
      <div className="container mx-auto py-10 px-4">
        <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{isEnglish ? "Password" : "合言葉"}</Label>
            <Input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>
          <Button type="submit">{isEnglish ? "Submit" : "送信"}</Button>
        </form>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {editMode ? (
        // 編集フォーム
        <div className="space-y-4 border p-4 rounded">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">
                {isEnglish ? "Basic Info" : "基本情報"}
              </TabsTrigger>
              <TabsTrigger value="options">
                {isEnglish
                  ? data.eventType === "recurring"
                    ? "Grid Settings"
                    : "Date Options"
                  : data.eventType === "recurring"
                    ? "グリッド設定"
                    : "日時設定"}
              </TabsTrigger>
              <TabsTrigger value="types">
                {isEnglish ? "Response Types" : "回答タイプ"}
              </TabsTrigger>
              <TabsTrigger value="grades">
                {isEnglish ? "Affiliation/Role" : "所属/役職"}
              </TabsTrigger>
            </TabsList>

            {/* 基本情報タブ */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="evt-name">
                  {isEnglish ? "Event Name" : "イベント名"}
                </Label>
                <Input
                  id="evt-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    isEnglish ? "Enter event name" : "イベント名を入力"
                  }
                />
              </div>
              <div>
                <Label htmlFor="evt-desc">
                  {isEnglish ? "Event Description" : "イベント説明"}
                </Label>
                <textarea
                  id="evt-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isEnglish ? "Enter event overview" : "イベントの概要を入力"
                  }
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
                      <Label className="text-base font-medium">
                        {isEnglish
                          ? "X-axis items (e.g., days)"
                          : "横軸の項目（曜日など）"}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addXItem}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {isEnglish ? "Add" : "追加"}
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
                      <Label className="text-base font-medium">
                        {isEnglish
                          ? "Y-axis items (e.g., periods)"
                          : "縦軸の項目（時限など）"}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addYItem}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {isEnglish ? "Add" : "追加"}
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
                  <Label className="text-base font-medium">
                    {isEnglish ? "Date/Time Options" : "日時オプション"}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDateTimeOption}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isEnglish ? "Add" : "追加"}
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
                          placeholder={
                            isEnglish
                              ? `Slot ${index + 1} (e.g., 5/1 7:00 PM)`
                              : `日時 ${index + 1} (例: 5/1 19:00)`
                          }
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
                      {isEnglish
                        ? 'Enter date/time like "5/1 19:00". Participants will select from this list.'
                        : '日時は「5/1 19:00」のような形式で入力してください。参加者はこのリストから選択します。'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 回答タイプタブ */}
            <TabsContent value="types" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium">
                {isEnglish ? "Schedule Type Settings" : "予定タイプの設定"}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addScheduleType}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isEnglish ? "Add" : "追加"}
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600">
                {isEnglish
                  ? 'Configure the schedule types participants can choose. Types marked as "Available" count as available in summaries.'
                  : '参加者が選択できる予定タイプを設定します。「参加可能」として設定された予定タイプは、集計時に「参加可能」としてカウントされます。'}
              </p>
            </div>

              <div className="space-y-3 overflow-y-auto p-1">
                {editScheduleTypes.map((type, index) => (
                  <div key={`type-${index}`} className="border rounded-md p-3 bg-white">
                    <div className="flex flex-col md:flex-row gap-3">
                    {/* ラベル入力 */}
                    <div className="flex-1">
                      <Label
                        htmlFor={`type-label-${index}`}
                        className="text-xs mb-1 block"
                      >
                        {isEnglish ? "Label" : "ラベル"}
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
                        placeholder={
                          isEnglish ? "Schedule type name" : "予定タイプの名前"
                        }
                      />
                    </div>

                    {/* 色選択 */}
                    <div className="w-full md:w-40">
                      <Label
                        htmlFor={`type-color-${index}`}
                        className="text-xs mb-1 block"
                      >
                        {isEnglish ? "Color" : "色"}
                      </Label>
                      <Select
                        value={type.color}
                        onValueChange={(value) => updateScheduleTypeColor(index, value)}
                      >
                        <SelectTrigger
                          id={`type-color-${index}`}
                          className={`w-full ${type.color}`}
                        >
                          <SelectValue
                            placeholder={isEnglish ? "Select color" : "色を選択"}
                          />
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
                        onCheckedChange={(checked) =>
                          updateScheduleTypeAvailability(index, checked)
                        }
                      />
                      <Label
                        htmlFor={`type-available-${index}`}
                        className="text-sm"
                      >
                        {isEnglish ? "Available" : "参加可能"}
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
                      <div className="text-xs text-gray-500 mb-1">
                        {isEnglish ? "Preview:" : "プレビュー:"}
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-md ${type.color}`}>
                        {type.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 所属/役職タブ */}
            <TabsContent value="grades" className="space-y-4">
              <div className="space-y-2">
                {editGradeOptions.map((opt, i) => (
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
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGradeOption(i)}
                      disabled={editGradeOptions.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGradeOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isEnglish ? "Add" : "追加"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={saveEdit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting
                ? isEnglish
                  ? "Saving..."
                  : "保存中..."
                : isEnglish
                  ? "Save Changes"
                  : "変更を保存"}
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-2" />
              {isEnglish ? "Cancel" : "キャンセル"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{data.name}</h1>
          <p className="text-gray-700">{data.description}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={shareEvent}>
              <Share2 className="h-4 w-4 mr-2" />
              {isEnglish ? "Share" : "共有"}
            </Button>
            <Button variant="outline" onClick={() => setEditMode(true)}>
              {isEnglish ? "Edit" : "編集"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}/analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {isEnglish ? "Analytics" : "統計"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* イベントタイプに応じてビュー切り替え */}
      {!editMode && (
        <div className="mt-6">
          {data.eventType === "recurring" ? (
            <SchedulePage
              eventId={eventIdValue}
              accessToken={accessToken}
              xAxis={data.xAxis}
              yAxis={data.yAxis}
              scheduleTypes={data.scheduleTypes}
              gradeOptions={data.gradeOptions}
              gradeOrder={data.gradeOrder}
            />
          ) : (
            <OneTimePage
              eventId={eventIdValue}
              accessToken={accessToken}
              dateTimeOptions={data.dateTimeOptions}
              scheduleTypes={data.scheduleTypes}
              responses={data.existingResponses}
              gradeOptions={data.gradeOptions}
              gradeOrder={data.gradeOrder}
            />
          )}
        </div>
      )}
    </div>
  )
}
