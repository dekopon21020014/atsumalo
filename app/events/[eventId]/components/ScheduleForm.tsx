"use client"

import { type Dispatch, type SetStateAction, useEffect, useState, useRef, useMemo } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MousePointer, Smartphone, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { type ScheduleType } from "@/app/events/[eventId]/components/constants"
import type { Schedule, Participant } from "./types"
import {
  createEmptySchedule,
  buildEventAuthHeaders,
  type EventAccess,
  getParticipantToken,
  storeParticipantToken,
} from "./utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import ScheduleTable from "./ScheduleTable"
import ScheduleCellMobile from "./ScheduleCellMobile"
import { useParams, usePathname } from "next/navigation"

type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
  addGradeOption: (name: string, priority: number) => void
  currentName: string
  setCurrentName: Dispatch<SetStateAction<string>>
  currentGrade: string
  setCurrentGrade: Dispatch<SetStateAction<string>>
  currentComment: string
  setCurrentComment: Dispatch<SetStateAction<string>>
  currentSchedule: Schedule
  setCurrentSchedule: Dispatch<SetStateAction<Schedule>>
  participants: Participant[]
  setParticipants: Dispatch<SetStateAction<Participant[]>>
  editingIndex: number | null
  setEditingIndex: Dispatch<SetStateAction<number | null>>
  setActiveTab: (tab: string) => void
  eventAccess?: EventAccess
}

export default function ScheduleForm({
  xAxis,
  yAxis,
  scheduleTypes,
  gradeOptions,
  gradeOrder,
  addGradeOption,
  currentName,
  setCurrentName,
  currentGrade,
  setCurrentGrade,
  currentComment,
  setCurrentComment,
  currentSchedule,
  setCurrentSchedule,
  participants,
  setParticipants,
  editingIndex,
  setEditingIndex,
  setActiveTab,
  eventAccess,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const defaultTypeId = scheduleTypes.find((t) => t.isAvailable)?.id || ""
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: boolean }>({})
  const [bulkScheduleType, setBulkScheduleType] = useState<string>(defaultTypeId)
  const [selectionMode, setSelectionMode] = useState<"tap" | "drag">(isMobile ? "tap" : "drag")
  const [scheduleError, setScheduleError] = useState("")
  const [nameError, setNameError] = useState("")
  const [gradeError, setGradeError] = useState("")
  const params = useParams()
  const eventIdParam = params.eventId
  const eventIdStr = typeof eventIdParam === "string" ? eventIdParam : Array.isArray(eventIdParam) ? eventIdParam[0] : ""
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const authHeaders = useMemo(() => buildEventAuthHeaders(eventAccess), [eventAccess])
  const requireParticipantToken = Boolean(eventAccess?.password || eventAccess?.token)

  const withAuthHeaders = (extra?: Record<string, string>) => ({
    "Content-Type": "application/json",
    ...authHeaders,
    ...(extra ?? {}),
  })

  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectionMode(isMobile ? "tap" : "drag")
  }, [isMobile])


  useEffect(() => {
    if (editingIndex !== null) {
      const p = participants[editingIndex]
      setCurrentName(p.name)
      setCurrentGrade(p.grade || "")
      setCurrentSchedule({ ...p.schedule })
      setCurrentComment(p.comment ?? "")
    } else {
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis, defaultTypeId))
      setCurrentComment("")
    }
  }, [editingIndex, participants, xAxis, yAxis, defaultTypeId])

  useEffect(() => {
    setBulkScheduleType(defaultTypeId)
  },[defaultTypeId])

  const updateSchedule = (labelX: string, labelY: string, value: string) => {
    const key = `${labelX}-${labelY}`
    setCurrentSchedule((prev) => ({ ...prev, [key]: value }))
  }

  // 選択タイプが変更されたときの処理
  const handleBulkTypeChange = (value: string) => {
    setBulkScheduleType(value)

    // 既に選択されているセルがある場合は即時適用
    if (Object.keys(selectedCells).length > 0) {
      const updated = { ...currentSchedule }
      for (const key of Object.keys(selectedCells)) {
        updated[key] = value
      }
      setCurrentSchedule(updated)
    }
  }

  const submit = async () => {
    if (!currentName.trim()) {
      const message = isEnglish ? "Please enter your name" : "名前を入力してください"
      setNameError(message)
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: message,
        variant: "destructive",
      })
      return
    }
    setNameError("")
    if (!currentGrade) {
      const message = isEnglish
        ? "Please select affiliation/role"
        : "所属/役職を選択してください"
      setGradeError(message)
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: message,
        variant: "destructive",
      })
      return
    }
    setGradeError("")

    const total = Object.keys(currentSchedule).length
    const filled = Object.values(currentSchedule).filter(Boolean).length
    if (filled !== total) {
      const message = isEnglish
        ? "Please fill in all cells"
        : "すべてのセルに予定を入力してください"
      setScheduleError(message)
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: message,
        variant: "destructive",
      })
      return
    }
    setScheduleError("")

    const scheduleData = { ...currentSchedule }
    const trimmedComment = currentComment.trim()
    const commentValue = trimmedComment === "" ? "" : trimmedComment
    const payload = {
      eventId: eventIdStr,
      name: currentName,
      grade: currentGrade,
      gradePriority: gradeOrder[currentGrade],
      schedule: scheduleData,
      comment: commentValue,
    }

    try {
      if (editingIndex !== null) {
        const id = participants[editingIndex].id
        let token = ""
        if (requireParticipantToken) {
          token = getParticipantToken(eventIdStr, id)
          if (!token) {
            toast({
              title: isEnglish ? "Forbidden" : "編集権限がありません",
              description: isEnglish
                ? "Use the device that created this response to edit it."
                : "この回答を編集するには作成した端末で操作してください。",
              variant: "destructive",
            })
            return
          }
        }
        const headers = requireParticipantToken
          ? withAuthHeaders({ "x-participant-token": token })
          : withAuthHeaders()
        const res = await fetch(`/api/events/${eventIdStr}/participants/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(result?.error || (isEnglish ? "Failed to update" : "更新に失敗しました"))
        }
        const updated = [...participants]
        updated[editingIndex] = {
          id,
          name: currentName,
          grade: currentGrade,
          schedule: scheduleData,
          comment: commentValue,
        }
        setParticipants(updated)
        setEditingIndex(null)
      } else {
        const res = await fetch(`/api/events/${eventIdStr}/participants`, {
          method: "POST",
          headers: withAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const result = await res.json()
        if (!res.ok || !result?.id) {
          throw new Error(result?.error || (isEnglish ? "Failed to save" : "保存に失敗しました"))
        }
        if (result.editToken) {
          storeParticipantToken(eventIdStr, result.id, result.editToken)
        }
        setParticipants([
          ...participants,
          {
            id: result.id,
            name: currentName,
            grade: currentGrade,
            schedule: scheduleData,
            comment: commentValue,
          },
        ])
      }

      toast({
        title: isEnglish ? "Success" : "完了",
        description: isEnglish ? "Schedule saved" : "スケジュールを登録しました",
      })
      setCurrentName("")
      setCurrentGrade("")
      setCurrentComment("")
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis, defaultTypeId))
      setSelectedCells({})
      setBulkScheduleType(defaultTypeId)
      setScheduleError("")
      setActiveTab("summary")
    } catch {
      toast({
        title: isEnglish ? "Error" : "エラー",
        description: isEnglish ? "Failed to save" : "保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => (prev === "tap" ? "drag" : "tap"))
    setSelectedCells({})
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{isEnglish ? "Schedule Entry" : "スケジュール入力"}</CardTitle>

        <CardDescription>
          {editingIndex !== null
            ? isEnglish
              ? "Please edit your schedule"
              : "スケジュールを編集してください"
            : isEnglish
            ? "Enter your name and schedule"
            : "名前と予定を入力してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 名前・所属/役職入力 */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">{isEnglish ? "Name" : "名前"}</Label>
            <Input
              id="name"
              value={currentName}
              onChange={(e) => {
                setCurrentName(e.target.value)
                setNameError("")
              }}
              placeholder={isEnglish ? "Name" : "名前"}
            />
            {nameError && <p className="mt-2 text-sm text-red-500">{nameError}</p>}
          </div>
          <div>
            <Label htmlFor="grade-select">{isEnglish ? "Affiliation/Role" : "所属/役職"}</Label>
            <Select
              value={currentGrade}
              onValueChange={(v) => {
                if (v === "__add__") {
                  const newGrade = prompt(
                    isEnglish ? "Enter affiliation/role" : "所属/役職を入力してください",
                  )
                  if (newGrade) {
                    const trimmed = newGrade.trim()
                    const existing = gradeOptions
                      .map((g) => `${g}(${gradeOrder[g] ?? "-"})`)
                      .join("\n")
                    const pr = prompt(
                      isEnglish
                        ? `Enter priority (1-999). Smaller numbers appear first.\nCurrent settings:\n${existing}`
                        : `優先度を入力してください（1〜999の半角数字。小さい数字ほど優先度が高く表示順が前になります）\n現在の設定:\n${existing}`
                    )
                    let priority: number
                    if (!pr || pr.trim() === "") {
                      const maxPri = Math.max(0, ...Object.values(gradeOrder))
                      priority = maxPri + 1
                    } else if (/^\d+$/.test(pr.trim())) {
                      priority = Number(pr)
                      if (priority < 1 || priority > 999) {
                        alert(
                          isEnglish
                            ? "Priority must be a number between 1 and 999"
                            : "優先度は1〜999の半角数字で入力してください",
                        )
                        return
                      }
                    } else {
                      alert(
                        isEnglish
                          ? "Priority must be a number between 1 and 999"
                          : "優先度は1〜999の半角数字で入力してください",
                      )
                      return
                    }
                    addGradeOption(trimmed, priority)
                    setCurrentGrade(trimmed)
                  }
                  return
                }
                setCurrentGrade(v)
                setGradeError("")
              }}
            >
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue
                  placeholder={
                    isEnglish ? "Select affiliation/role" : "所属/役職を選択"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g} ({isEnglish ? "Priority" : "優先度"}: {gradeOrder[g]})
                  </SelectItem>
                ))}
                <SelectItem value="__add__">{isEnglish ? "Add" : "追加"}</SelectItem>
              </SelectContent>
            </Select>
            {gradeError && <p className="mt-2 text-sm text-red-500">{gradeError}</p>}
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="comment">{isEnglish ? "Comment" : "コメント"}</Label>
          <Textarea
            id="comment"
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            placeholder={
              isEnglish
                ? "Add an optional comment"
                : "補足があれば入力してください（任意）"
            }
            rows={3}
          />
        </div>

        {/* 一括入力 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectionMode}
              className="text-xs flex items-center gap-1"
            >
              {selectionMode === "tap" ? (
                <Smartphone className="w-3 h-3" />
              ) : (
                <MousePointer className="w-3 h-3" />
              )}
              {isEnglish
                ? selectionMode === "tap"
                  ? "Tap"
                  : "Drag"
                : selectionMode === "tap"
                ? "タップ"
                : "ドラッグ"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {scheduleTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleBulkTypeChange(type.id)}
                className={`
                  px-3 py-1.5 rounded-md text-sm transition-all
                  ${type.color}
                  ${bulkScheduleType === type.id ? "ring-2 ring-offset-1 ring-gray-900" : "hover:opacity-80"}
                `}
              >
                {type.label}
                {bulkScheduleType === type.id && <Check className="inline-block ml-1 h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* グリッド or モバイルビュー */}
        {isMobile ? (
          <div className="mb-3">
          {/* ─── X軸ヘッダー ─── */}
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `min-content repeat(${xAxis.length}, minmax(0, 1fr))` }}
          >
            {/* 左上のダミーセル */}
            <div></div>
            {xAxis.map((labelX) => (
              <div key={labelX} className="text-center font-medium text-sm">
                {labelX}
              </div>
            ))}
          </div>
        
          {/* ─── Y軸＋セル ─── */}
          <div
            className="grid gap-1 mt-1"
            style={{ gridTemplateColumns: `min-content repeat(${xAxis.length}, minmax(0, 1fr))` }}
          >
            {yAxis.map((labelY) => (
              <React.Fragment key={labelY}>
                {/* Y軸ラベル */}
                <div className="font-medium text-sm">{labelY}</div>
                {/* 各セル */}
                {xAxis.map((labelX) => (
                  <ScheduleCellMobile
                    key={`${labelX}-${labelY}`}
                    day={labelX}
                    period={labelY}
                    value={currentSchedule[`${labelX}-${labelY}`]}
                    selected={!!selectedCells[`${labelX}-${labelY}`]}
                    onTap={() => {
                      if (bulkScheduleType) {
                        updateSchedule(labelX, labelY, bulkScheduleType)
                      }
                    }}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        ) : (
          <div ref={tableRef}>
            <ScheduleTable
              xAxis={xAxis}
              yAxis={yAxis}
              scheduleTypes={scheduleTypes}
              schedule={currentSchedule}
              updateSchedule={updateSchedule}
              selectionMode={selectionMode}
              bulkScheduleType={bulkScheduleType}
            />
          </div>
        )}
        {scheduleError && (
          <p className="mt-2 text-sm text-red-500">{scheduleError}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={submit} className="w-full md:w-auto">
          {editingIndex !== null
            ? isEnglish
              ? "Update"
              : "更新する"
            : isEnglish
            ? "Submit"
            : "登録する"}
        </Button>
      </CardFooter>
    </Card>
  )
}
