"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, UserPlus, Trash2, Check, Smartphone, MousePointer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-mobile"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// スケジュールの種類と対応する色
const scheduleTypes = [
  { id: "class", label: "授業", color: "bg-red-100 text-red-800" },
  { id: "parttime", label: "バイト", color: "bg-blue-100 text-blue-800" },
  { id: "ta", label: "TA", color: "bg-purple-100 text-purple-800" },
  { id: "available", label: "可能", color: "bg-green-100 text-green-800" },
  { id: "unavailable", label: "不可", color: "bg-gray-100 text-gray-800" },
]

// 曜日と時限の定義
const days = ["月", "火", "水", "木", "金"]
const periods = [1, 2, 3, 4, 5]

// 初期スケジュールデータ
const createEmptySchedule = () => {
  const schedule = {}
  days.forEach((day) => {
    periods.forEach((period) => {
      schedule[`${day}-${period}`] = ""
    })
  })
  return schedule
}

export default function SchedulePage() {
  const [currentName, setCurrentName] = useState("")
  const [currentSchedule, setCurrentSchedule] = useState(createEmptySchedule())
  const [participants, setParticipants] = useState([])
  const [activeTab, setActiveTab] = useState("input")
  const [editingParticipantIndex, setEditingParticipantIndex] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 複数選択関連の状態
  const [selectedCells, setSelectedCells] = useState({})
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [bulkScheduleType, setBulkScheduleType] = useState("")
  const tableRef = useRef(null)

  // スマホ対応
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectionMode, setSelectionMode] = useState("tap") // "tap" or "drag"

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch("/api/participants")
        const json = await res.json()
        if (Array.isArray(json.participants)) {
          setParticipants(json.participants)
        }
      } catch (e) {
        console.error("参加者の取得に失敗:", e)
      }
    }
  
    fetchParticipants()
  
    if (isMobile) {
      setSelectionMode("tap")
    } else {
      setSelectionMode("drag")
    }
  }, [isMobile])

  // スケジュールの更新
  const updateSchedule = (day, period, value) => {
    const newSchedule = { ...currentSchedule }
    newSchedule[`${day}-${period}`] = value
    setCurrentSchedule(newSchedule)
  }

  // セルのタップ処理（スマホ向け）
  const handleCellTap = (day, period) => {
    if (selectionMode !== "tap") return

    const key = `${day}-${period}`
    const newSelectedCells = { ...selectedCells }

    if (newSelectedCells[key]) {
      // 既に選択されている場合は選択解除
      delete newSelectedCells[key]
    } else {
      // 選択されていない場合は選択
      newSelectedCells[key] = true
    }

    setSelectedCells(newSelectedCells)
  }

  // 複数選択の開始（PC向け）
  const handleCellMouseDown = (day, period, e) => {
    if (selectionMode !== "drag" || e.button !== 0) return // 左クリックのみ

    e.preventDefault()
    setIsSelecting(true)
    setSelectionStart({ day, period })

    // 選択状態を初期化
    const key = `${day}-${period}`
    setSelectedCells({ [key]: true })
  }

  // 複数選択の途中（PC向け）
  const handleCellMouseEnter = (day, period) => {
    if (selectionMode !== "drag" || !isSelecting || !selectionStart) return

    // 選択範囲を計算
    const startDayIndex = days.indexOf(selectionStart.day)
    const endDayIndex = days.indexOf(day)
    const startPeriodIndex = periods.indexOf(selectionStart.period)
    const endPeriodIndex = periods.indexOf(period)

    const minDayIndex = Math.min(startDayIndex, endDayIndex)
    const maxDayIndex = Math.max(startDayIndex, endDayIndex)
    const minPeriodIndex = Math.min(startPeriodIndex, endPeriodIndex)
    const maxPeriodIndex = Math.max(startPeriodIndex, endPeriodIndex)

    // 選択状態を更新
    const newSelectedCells = {}
    for (let d = minDayIndex; d <= maxDayIndex; d++) {
      for (let p = minPeriodIndex; p <= maxPeriodIndex; p++) {
        const key = `${days[d]}-${periods[p]}`
        newSelectedCells[key] = true
      }
    }

    setSelectedCells(newSelectedCells)
  }

  // 複数選択の終了（PC向け）
  const handleMouseUp = () => {
    if (selectionMode !== "drag") return
    setIsSelecting(false)
  }

  // マウスがテーブル外に出た場合も選択を終了（PC向け）
  const handleMouseLeave = () => {
    if (selectionMode !== "drag") return
    setIsSelecting(false)
  }

  useEffect(() => {
    // マウスアップイベントをグローバルに設定
    if (selectionMode === "drag") {
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [selectionMode])

  // 選択したセルに一括で予定を適用
  const applyBulkSchedule = () => {
    if (!bulkScheduleType || Object.keys(selectedCells).length === 0) return

    const newSchedule = { ...currentSchedule }
    Object.keys(selectedCells).forEach((key) => {
      newSchedule[key] = bulkScheduleType
    })

    setCurrentSchedule(newSchedule)
    setSelectedCells({})
    setBulkScheduleType("")

    toast({
      title: "一括設定完了",
      description: `${Object.keys(selectedCells).length}コマの予定を設定しました`,
    })
  }

  // 選択をクリア
  const clearSelection = () => {
    setSelectedCells({})
    setBulkScheduleType("")
  }

  // 選択モードの切り替え
  const toggleSelectionMode = () => {
    setSelectionMode(selectionMode === "drag" ? "tap" : "drag")
    setSelectedCells({})
  }

  // スケジュールの登録
  const submitSchedule = async () => {
    if (!currentName.trim()) {
      toast({
        title: "エラー",
        description: "名前を入力してください",
        variant: "destructive",
      })
      return
    }
  
    const filledCells = Object.values(currentSchedule).filter((v) => v).length
    if (filledCells < 5) {
      if (!confirm("入力されたスケジュールが少ないようです。このまま登録しますか？")) {
        return
      }
    }
  
    const payload = {
      name: currentName,
      schedule: currentSchedule,
    }
  
    try {
      if (editingParticipantIndex !== null) {
        // 編集（PUT）
        const participant = participants[editingParticipantIndex]
        const res = await fetch(`/api/participants/${participant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("更新に失敗しました")
  
        // 状態更新
        const updated = [...participants]
        updated[editingParticipantIndex] = { ...participant, ...payload }
        setParticipants(updated)
        setEditingParticipantIndex(null)
      } else {
        // 新規登録（POST）
        const res = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("登録に失敗しました")
        const json = await res.json()
        setParticipants([...participants, { id: json.id, ...payload }])
      }
  
      toast({
        title: "完了",
        description: editingParticipantIndex !== null ? "更新しました" : "登録しました",
      })
      setCurrentName("")
      setCurrentSchedule(createEmptySchedule())
      setSelectedCells({})
      setBulkScheduleType("")
      setActiveTab("summary")
    } catch (err) {
      console.error(err)
      toast({
        title: "エラー",
        description: String(err),
        variant: "destructive",
      })
    }
  }
  
  
  // 参加者の編集
  const editParticipant = (index) => {
    const participant = participants[index]
    setCurrentName(participant.name)
    setCurrentSchedule({ ...participant.schedule })
    setEditingParticipantIndex(index)
    setActiveTab("input")
    setSelectedCells({})
    setBulkScheduleType("")
  }

  const deleteParticipant = async (index: number) => {
    const participant = participants[index]
    if (!participant?.id) {
      toast({
        title: "削除失敗",
        description: "削除対象のIDが見つかりません",
        variant: "destructive",
      })
      return
    }
  
    if (!confirm(`${participant.name}さんのスケジュールを削除しますか？`)) return
  
    try {
      const res = await fetch(`/api/participants/${participant.id}`, {
        method: "DELETE",
      })
  
      if (!res.ok) throw new Error("削除に失敗しました")
  
      const newParticipants = [...participants]
      newParticipants.splice(index, 1)
      setParticipants(newParticipants)
  
      toast({
        title: "削除完了",
        description: "スケジュールが削除されました",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "削除エラー",
        description: String(err),
        variant: "destructive",
      })
    }
  }
  
  // スケジュールのエクスポート
  const exportSchedule = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(participants))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "lab-schedule.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  // スケジュールのインポート
  const importSchedule = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (Array.isArray(data)) {
          setParticipants(data)
          localStorage.setItem("labScheduleData", JSON.stringify(data))
          toast({
            title: "インポート完了",
            description: `${data.length}人分のスケジュールをインポートしました`,
          })
        }
      } catch (error) {
        toast({
          title: "エラー",
          description: "ファイルの形式が正しくありません",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  // 全データのリセット
  const resetAllData = () => {
    if (confirm("全てのデータを削除しますか？この操作は元に戻せません。")) {
      setParticipants([])
      localStorage.removeItem("labScheduleData")
      toast({
        title: "リセット完了",
        description: "全てのデータが削除されました",
      })
    }
  }

  // 集計ビューの計算
  const calculateAvailability = () => {
    const availability = {}

    days.forEach((day) => {
      periods.forEach((period) => {
        const key = `${day}-${period}`

        const details = scheduleTypes
          .map((type) => ({
            type: type.id,
            label: type.label,
            count: participants.filter((p) => p.schedule[key] === type.id).length,
            participants: participants.filter((p) => p.schedule[key] === type.id).map((p) => p.name),
          }))
          .filter((item) => item.count > 0)

        availability[key] = {
          available: participants.filter((p) => p.schedule[key] === "available").length,
          total: participants.length,
          details: details,
          availableParticipants: participants.filter((p) => p.schedule[key] === "available").map((p) => p.name),
        }
      })
    })

    return availability
  }

  const availability = calculateAvailability()

  // 最適な時間枠を見つける
  const findBestTimeSlots = () => {
    if (participants.length === 0) return []

    const slots = []

    days.forEach((day) => {
      periods.forEach((period) => {
        const key = `${day}-${period}`
        const availableCount = participants.filter((p) => p.schedule[key] === "available").length

        slots.push({
          day,
          period,
          key,
          availableCount,
          availablePercentage: participants.length > 0 ? (availableCount / participants.length) * 100 : 0,
          availableParticipants: participants.filter((p) => p.schedule[key] === "available").map((p) => p.name),
        })
      })
    })

    // 参加可能人数で降順ソート
    slots.sort((a, b) => b.availableCount - a.availableCount)

    return slots.slice(0, 3) // 上位3つを返す
  }

  const bestTimeSlots = findBestTimeSlots()

  // 選択されたセルの数
  const selectedCellCount = Object.keys(selectedCells).length

  // スマホ向けのセル表示
  const renderMobileCell = (day, period) => {
    const key = `${day}-${period}`
    const isSelected = !!selectedCells[key]
    const value = currentSchedule[key]
    const scheduleType = scheduleTypes.find((t) => t.id === value)

    return (
      <div
        className={`
          w-full h-12 flex items-center justify-center rounded border
          ${isSelected ? "bg-blue-200 border-blue-400" : "border-gray-200"}
          ${scheduleType?.color || ""}
          transition-colors
        `}
        onClick={() => handleCellTap(day, period)}
      >
        {scheduleType ? (
          <span className="text-xs font-medium">{scheduleType.label}</span>
        ) : (
          <span className="text-gray-400 text-xs">タップ</span>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">研究室ゼミ日程調整</h1>

      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportSchedule} className="flex items-center gap-1 text-xs md:text-sm">
            <Download className="h-3 w-3 md:h-4 md:w-4" />
            エクスポート
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1 text-xs md:text-sm">
                <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
                インポート
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>スケジュールのインポート</DialogTitle>
                <DialogDescription>エクスポートしたJSONファイルをインポートします</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="file" accept=".json" onChange={importSchedule} className="cursor-pointer" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="input" className="flex-1">
            スケジュール入力
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex-1">
            参加者一覧
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex-1">
            集計結果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>スケジュール入力</CardTitle>
              <CardDescription>
                {editingParticipantIndex !== null
                  ? "スケジュールを編集してください"
                  : "名前と各コマの予定を選択してください"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="名前を入力"
                  className="max-w-xs"
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">複数コマ一括入力</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="h-8 text-xs flex items-center gap-1"
                  >
                    {selectionMode === "tap" ? (
                      <>
                        <Smartphone className="h-3 w-3" />
                        タップモード
                      </>
                    ) : (
                      <>
                        <MousePointer className="h-3 w-3" />
                        ドラッグモード
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectionMode === "tap"
                    ? "コマをタップして選択し、一括で予定を設定できます"
                    : "ドラッグして複数のコマを選択し、一括で予定を設定できます"}
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex-grow max-w-xs">
                    <Select
                      value={bulkScheduleType}
                      onValueChange={setBulkScheduleType}
                      disabled={selectedCellCount === 0}
                    >
                      <SelectTrigger
                        className={`w-full ${scheduleTypes.find((t) => t.id === bulkScheduleType)?.color || ""}`}
                      >
                        <SelectValue placeholder="予定を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id} className={type.color}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={applyBulkSchedule}
                    disabled={!bulkScheduleType || selectedCellCount === 0}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    適用
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm" disabled={selectedCellCount === 0}>
                    選択解除
                  </Button>
                </div>
                {selectedCellCount > 0 && (
                  <div className="mt-2 text-sm text-blue-600 font-medium">{selectedCellCount}コマ選択中</div>
                )}
              </div>

              {isMobile ? (
                // スマホ向けのグリッド表示
                <div className="mb-4">
                  <div className="grid grid-cols-5 gap-1 mb-1">
                    {days.map((day) => (
                      <div key={day} className="text-center font-medium text-sm">
                        {day}
                      </div>
                    ))}
                  </div>
                  {periods.map((period) => (
                    <div key={period} className="mb-3">
                      <div className="font-medium text-sm mb-1">{period}限</div>
                      <div className="grid grid-cols-5 gap-1">
                        {days.map((day) => (
                          <div key={`${day}-${period}`}>{renderMobileCell(day, period)}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // PC向けのテーブル表示
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" ref={tableRef} onMouseLeave={handleMouseLeave}>
                    <thead>
                      <tr>
                        <th className="border p-2"></th>
                        {days.map((day) => (
                          <th key={day} className="border p-2 text-center">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period) => (
                        <tr key={period}>
                          <td className="border p-2 text-center font-medium">{period}限</td>
                          {days.map((day) => {
                            const key = `${day}-${period}`
                            const isSelected = !!selectedCells[key]

                            return (
                              <td
                                key={key}
                                className={`border p-2 ${isSelected ? "bg-blue-200" : ""}`}
                                onMouseDown={(e) => handleCellMouseDown(day, period, e)}
                                onMouseEnter={() => handleCellMouseEnter(day, period)}
                                onClick={() => selectionMode === "tap" && handleCellTap(day, period)}
                                style={{ userSelect: "none" }}
                              >
                                <Select
                                  value={currentSchedule[key]}
                                  onValueChange={(value) => updateSchedule(day, period, value)}
                                >
                                  <SelectTrigger
                                    className={`w-full ${
                                      scheduleTypes.find((t) => t.id === currentSchedule[key])?.color || ""
                                    }`}
                                  >
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">未選択</SelectItem>
                                    {scheduleTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id} className={type.color}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 選択したセルの予定設定（スマホ向け） */}
              {isMobile && selectedCellCount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium mb-2">選択したコマの予定を設定</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {scheduleTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`p-2 rounded text-center text-xs ${type.color} border border-gray-200`}
                        onClick={() => {
                          setBulkScheduleType(type.id)
                          applyBulkSchedule()
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={submitSchedule} className="w-full md:w-auto">
                {editingParticipantIndex !== null ? "更新する" : "登録する"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>参加者一覧</CardTitle>
              <CardDescription>登録された参加者のスケジュール</CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">まだ参加者が登録されていません</div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{participant.name}</CardTitle>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editParticipant(index)}>
                              編集
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteParticipant(index)}>
                              削除
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {isMobile ? (
                          // スマホ向けのグリッド表示
                          <div>
                            <div className="grid grid-cols-5 gap-1 mb-1">
                              {days.map((day) => (
                                <div key={day} className="text-center font-medium text-xs">
                                  {day}
                                </div>
                              ))}
                            </div>
                            {periods.map((period) => (
                              <div key={period} className="mb-2">
                                <div className="font-medium text-xs mb-1">{period}限</div>
                                <div className="grid grid-cols-5 gap-1">
                                  {days.map((day) => {
                                    const key = `${day}-${period}`
                                    const value = participant.schedule[key]
                                    const scheduleType = scheduleTypes.find((t) => t.id === value)

                                    return (
                                      <div
                                        key={key}
                                        className={`
                                          h-8 flex items-center justify-center rounded border border-gray-200
                                          ${scheduleType?.color || "bg-gray-50"}
                                        `}
                                      >
                                        {value ? (
                                          <span className="text-xs">{scheduleType?.label.charAt(0) || "-"}</span>
                                        ) : (
                                          <span className="text-gray-300 text-xs">-</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // PC向けのテーブル表示
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="border p-1"></th>
                                  {days.map((day) => (
                                    <th key={day} className="border p-1 text-center">
                                      {day}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {periods.map((period) => (
                                  <tr key={period}>
                                    <td className="border p-1 text-center font-medium">{period}限</td>
                                    {days.map((day) => {
                                      const key = `${day}-${period}`
                                      const value = participant.schedule[key]
                                      const scheduleType = scheduleTypes.find((t) => t.id === value)

                                      return (
                                        <td key={key} className="border p-1 text-center">
                                          {value ? (
                                            <span className={`px-2 py-1 rounded text-xs ${scheduleType?.color || ""}`}>
                                              {scheduleType?.label || value}
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">-</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>集計結果</CardTitle>
                <CardDescription>全参加者のスケジュール集計（参加者数: {participants.length}人）</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">まだ参加者が登録されていません</div>
                ) : isMobile ? (
                  // スマホ向けのグリッド表示
                  <div>
                    {periods.map((period) => (
                      <div key={period} className="mb-6">
                        <h3 className="font-medium mb-2">{period}限</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {days.map((day) => {
                            const key = `${day}-${period}`
                            const data = availability[key]

                            return (
                              <div key={key} className="border rounded p-2">
                                <div className="font-medium text-sm">{day}曜日</div>
                                <div
                                  className={`mt-1 p-2 rounded ${
                                    data.available === data.total && data.total > 0
                                      ? "bg-green-100"
                                      : data.available > 0
                                        ? "bg-yellow-100"
                                        : "bg-red-100"
                                  }`}
                                >
                                  <div className="text-sm font-medium">
                                    参加可能: {data.available}/{data.total}
                                    {data.total > 0 && (
                                      <span className="text-xs ml-1">
                                        ({Math.round((data.available / data.total) * 100)}%)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs mt-1">
                                    {data.details.map((detail, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span>{detail.label}:</span>
                                        <span>{detail.count}人</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // PC向けのテーブル表示
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2"></th>
                          {days.map((day) => (
                            <th key={day} className="border p-2 text-center">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period}>
                            <td className="border p-2 text-center font-medium">{period}限</td>
                            {days.map((day) => {
                              const key = `${day}-${period}`
                              const data = availability[key]

                              return (
                                <td key={key} className="border p-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`p-2 rounded cursor-help ${
                                            data.available === data.total && data.total > 0
                                              ? "bg-green-100"
                                              : data.available > 0
                                                ? "bg-yellow-100"
                                                : "bg-red-100"
                                          }`}
                                        >
                                          <div className="font-medium">
                                            参加可能: {data.available}/{data.total}
                                            {data.total > 0 && (
                                              <span className="text-xs ml-1">
                                                ({Math.round((data.available / data.total) * 100)}%)
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-sm mt-1">
                                            {data.details.map((detail, i) => (
                                              <div key={i} className="flex justify-between">
                                                <span>{detail.label}:</span>
                                                <span>{detail.count}人</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-medium">参加可能者:</p>
                                        <p className="text-xs">
                                          {data.availableParticipants.length > 0
                                            ? data.availableParticipants.join(", ")
                                            : "なし"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>おすすめ日程</CardTitle>
                <CardDescription>参加可能人数が多い時間帯</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">まだ参加者が登録されていません</div>
                ) : bestTimeSlots.length > 0 ? (
                  <div className="space-y-4">
                    {bestTimeSlots.map((slot, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="font-medium">
                          {index + 1}. {slot.day}曜 {slot.period}限
                        </div>
                        <div className="text-sm mt-1">
                          参加可能: {slot.availableCount}/{participants.length}人 (
                          {Math.round(slot.availablePercentage)}%)
                        </div>
                        <div className="text-xs mt-1 text-muted-foreground">
                          参加可能者: {slot.availableParticipants.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">参加可能な時間帯がありません</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}
