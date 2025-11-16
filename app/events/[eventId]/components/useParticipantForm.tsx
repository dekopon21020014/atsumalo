// hooks/useParticipantForm.ts
import { useState, useEffect, useMemo } from "react"
import { type ScheduleType, type Response } from "@/app/events/[eventId]/components/constants"
import { toast } from "@/components/ui/use-toast"
import {
  buildEventAuthHeaders,
  type EventAccess,
  getParticipantToken,
  storeParticipantToken,
  removeParticipantToken,
} from "./utils"

export function useParticipantForm(
  eventId: string,
  dateTimeOptions: string[],
  scheduleTypes: ScheduleType[],
  responses: Response[],
  setActiveTab: (tab: string) => void,
  gradeOptions: string[],
  gradeOrder: Record<string, number>,
  eventAccess?: EventAccess,
) {
  const [name, setName] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [comment, setComment] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [editSelections, setEditSelections] = useState<Record<string, string>>({})
  const sanitizeResponses = (items: Response[]): Response[] =>
    items.map((r) => ({
      ...r,
      comment: typeof r.comment === "string" ? r.comment.trim() : "",
    }))

  const [existingResponses, setExistingResponses] = useState<Response[]>(
    Array.isArray(responses) ? sanitizeResponses(responses) : [],
  )
  const [editComment, setEditComment] = useState<string>("")
  const [editingResponse, setEditingResponse] = useState<Response | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editGrade, setEditGrade] = useState<string>("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [filterTypeId, setFilterTypeId] = useState<string | null>(null)
  const [filterDateTime, setFilterDateTime] = useState<string | null>(null)
  const [filterGrades, setFilterGrades] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<"name" | "grade" | "availability">("grade")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const authHeaders = useMemo(() => buildEventAuthHeaders(eventAccess), [eventAccess])
  const requireParticipantToken = Boolean(eventAccess?.password || eventAccess?.token)

  const withAuthHeaders = (extra?: Record<string, string>) => ({
    "Content-Type": "application/json",
    ...authHeaders,
    ...(extra ?? {}),
  })

  const ensureParticipantToken = (participantId: string) => {
    if (!requireParticipantToken) {
      return ''
    }
    const token = getParticipantToken(eventId, participantId)
    if (!token) {
      toast({
        title: "操作できません / Forbidden",
        description:
          "この回答を編集・削除できるのは作成した端末のみです。\nOnly the device that created this response can modify it.",
        variant: "destructive",
      })
    }
    return token
  }

  useEffect(() => {
    const s = localStorage.getItem(`event_${eventId}_selections`)
    if (s) setSelections(JSON.parse(s))
    const c = localStorage.getItem(`event_${eventId}_comment`)
    if (c) setComment(c)
  }, [eventId])

  // sync external responses when parent data changes
  useEffect(() => {
    setExistingResponses(Array.isArray(responses) ? sanitizeResponses(responses) : [])
  }, [responses])

  // 回答者の参加可能日数を取得
  const getAvailableDatesCount = (response: Response) => {
    return response.schedule.filter((selection) => {
      const type = scheduleTypes.find((t) => t.id === selection.typeId)
      return type?.isAvailable
    }).length
  }

  const handleSelection = (dateTime: string, typeId: string) => {
    const newSelections = { ...selections, [dateTime]: typeId }
    setSelections(newSelections)
    localStorage.setItem(`event_${eventId}_selections`, JSON.stringify(newSelections))
  }

  const handleEditSelection = (dateTime: string, typeId: string) => {
    setEditSelections(prev => ({ ...prev, [dateTime]: typeId }))
  }

  const handleNameChange = (value: string) => {
    setName(value)
    localStorage.setItem(`event_${eventId}_name`, value)
  }

  const handleGradeChange = (value: string) => {
    setGrade(value)
    localStorage.setItem(`event_${eventId}_grade`, value)
  }

  const clearResponses = () => {
    setSelections({})
    setComment("")
    localStorage.removeItem(`event_${eventId}_selections`)
    localStorage.removeItem(`event_${eventId}_comment`)
    toast({ title: "回答をクリアしました", description: "すべての選択とコメントがクリアされました。" })
  }

  const clearEditResponses = () => {
    setEditSelections({})
    setEditComment("")
    toast({ title: "回答をクリアしました", description: "すべての選択とコメントがクリアされました。" })
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "名前を入力してください", variant: "destructive" })
      alert("送信処理は実装されていません。")
      return
    }
    if (Object.keys(selections).length === 0) {
      toast({ title: "少なくとも1つの日時に回答してください", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const trimmedComment = comment.trim()
      const responseData = {
        eventId,
        name,
        grade,
        gradePriority: gradeOrderMap[grade],
        schedule: Object.entries(selections).map(([dateTime, typeId]) => ({ dateTime, typeId })),
        comment: trimmedComment === "" ? "" : trimmedComment,
      }
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: withAuthHeaders(),
        body: JSON.stringify(responseData),
      })
      const result = await response.json()
      if (!response.ok || !result?.id) throw new Error(result?.error || "回答の送信に失敗しました")
      if (result.editToken) {
        storeParticipantToken(eventId, result.id, result.editToken)
      }
      setExistingResponses(prev => [
        ...prev,
        { id: result.id, name, grade, schedule: responseData.schedule, comment: responseData.comment },
      ])
      toast({ title: "回答を送信しました", description: "あなたの回答が正常に保存されました。" })
      setActiveTab("responses")
      setComment("")
      localStorage.removeItem(`event_${eventId}_comment`)
    } catch (error) {
      console.error(error)
      toast({ title: "送信エラー", description: "回答の送信中にエラーが発生しました。再度お試しください。", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateResponse = async () => {
    if (!editingResponse) return
    if (!editName.trim()) { toast({ title: "名前を入力してください", variant: "destructive" }); return }
    if (Object.keys(editSelections).length === 0) { toast({ title: "少なくとも1つの日時に回答してください", variant: "destructive" }); return }
    setIsEditing(true)
    try {
      const trimmedComment = editComment.trim()
      const responseData = {
        name: editName,
        grade: editGrade,
        gradePriority: gradeOrderMap[editGrade],
        schedule: Object.entries(editSelections).map(([dateTime, typeId]) => ({ dateTime, typeId })),
        comment: trimmedComment === "" ? "" : trimmedComment,
      }
      let headers = withAuthHeaders()
      if (requireParticipantToken) {
        const token = ensureParticipantToken(editingResponse.id)
        if (!token) {
          setIsEditing(false)
          return
        }
        headers = withAuthHeaders({ "x-participant-token": token })
      }
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(responseData),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "回答の更新に失敗しました")
      }
      setExistingResponses(prev =>
        prev.map(r =>
          r.id === editingResponse.id
            ? { ...r, name: editName, grade: editGrade, schedule: responseData.schedule, comment: responseData.comment }
            : r,
        ),
      )
      toast({ title: "回答を更新しました", description: `${editName}さんの回答が更新されました。` })
      setIsEditDialogOpen(false)
      setEditingResponse(null)
    } catch (error) {
      console.error(error)
      toast({ title: "更新エラー", description: "回答の更新中にエラーが発生しました。再度お試しください。", variant: "destructive" })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteResponse = async () => {
    if (!editingResponse) return
    setIsDeleting(true)
    try {
      let headers = withAuthHeaders()
      if (requireParticipantToken) {
        const token = ensureParticipantToken(editingResponse.id)
        if (!token) {
          setIsDeleting(false)
          return
        }
        headers = withAuthHeaders({ "x-participant-token": token })
      }
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, {
        method: "DELETE",
        headers,
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "回答の削除に失敗しました")
      }
      setExistingResponses(prev => prev.filter(r => r.id !== editingResponse.id))
      removeParticipantToken(eventId, editingResponse.id)
      toast({ title: "回答を削除しました", description: `${editingResponse.name}さんの回答が削除されました。` })
      setIsDeleteDialogOpen(false)
      setIsEditDialogOpen(false)
      setEditingResponse(null)
    } catch (error) {
      console.error(error)
      toast({ title: "削除エラー", description: "回答の削除中にエラーが発生しました。再度お試しください。", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (response: Response) => {
    if (requireParticipantToken) {
      const token = ensureParticipantToken(response.id)
      if (!token) return
    }
    setEditingResponse(response)
    setEditName(response.name)
    setEditGrade(response.grade || "")
    const sel: Record<string, string> = {}
    response.schedule.forEach(item => {
      sel[item.dateTime] = item.typeId
    })
    setEditSelections(sel)
    setEditComment(response.comment ?? "")
    setIsEditDialogOpen(true)
  }

  const openDeleteConfirmation = () => {
    if (!editingResponse) return
    if (requireParticipantToken) {
      const token = ensureParticipantToken(editingResponse.id)
      if (!token) return
    }
    setIsDeleteDialogOpen(true)
  }

  const gradeOrderMap = useMemo(() => {
    return gradeOrder
  }, [gradeOrder])

  const getSortedResponses = () => {
    if (!existingResponses.length) return []

    // 検索フィルタリング
    let filtered = existingResponses

    // 名前または所属/役職で検索
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (response) =>
          response.name.toLowerCase().includes(query) ||
          (response.grade && response.grade.toLowerCase().includes(query)),
      )
    }

    // 特定の回答タイプでフィルタリング
    if (filterTypeId) {
      filtered = filtered.filter((response) => response.schedule.some((s) => s.typeId === filterTypeId))
    }

    // 特定の日時でフィルタリング
    if (filterDateTime) {
      filtered = filtered.filter((response) => response.schedule.some((s) => s.dateTime === filterDateTime))
    }

    // 所属/役職でフィルタリング
    if (filterGrades.length > 0) {
      filtered = filtered.filter((response) => response.grade && filterGrades.includes(response.grade))
    }

    // ソート
    return [...filtered].sort((a, b) => {
      if (sortColumn === "name") {
        const comparison = a.name.localeCompare(b.name)
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortColumn === "grade") {
        // 所属/役職でソート
        const gradeA = a.grade ? gradeOrderMap[a.grade] ?? 999 : 999
        const gradeB = b.grade ? gradeOrderMap[b.grade] ?? 999 : 999
        return sortDirection === "asc" ? gradeA - gradeB : gradeB - gradeA
      } else if (sortColumn === "availability") {
        // 参加可能日数でソート
        const availableA = getAvailableDatesCount(a)
        const availableB = getAvailableDatesCount(b)
        return sortDirection === "asc" ? availableA - availableB : availableB - availableA
      }
      return 0
    })
  }

  const handleSort = (column: "name" | "grade" | "availability") => {    
    if (sortColumn === column) {
      // 同じカラムをクリックした場合は方向を反転
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const resetFilters = () => {
    setFilterTypeId(null)
    setFilterDateTime(null)
    setFilterGrades([])
    setSearchQuery("")
    setSortColumn("grade")
    setSortDirection("asc")
  }

  const toggleGradeFilter = (g: string) => {
    setFilterGrades(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g])
  }

  const getResponseTypeDistributionByGrade = (g: string) => {
    const dist: Record<string, number> = {}
    scheduleTypes.forEach(t => dist[t.id] = 0)
    existingResponses.filter(r=>r.grade===g).forEach(r=>{
      r.schedule.forEach(s=>{ if(dist[s.typeId]!=null) dist[s.typeId]++ })
    })
    return dist
  }

  const getResponseCountByType = (dateTime: string, typeId: string) =>
    existingResponses.filter(r=>r.schedule.some(s=>s.dateTime===dateTime && s.typeId===typeId)).length

  const getRespondentsByType = (dateTime: string, typeId: string) =>
    existingResponses.filter(r=>r.schedule.some(s=>s.dateTime===dateTime && s.typeId===typeId)).map(r=>r.name)

  const getAvailableCountByGradeAndDateTime = (g: string, dateTime: string) =>
    existingResponses.filter(r=>r.grade===g && r.schedule.some(s=>s.dateTime===dateTime && scheduleTypes.find(t=>t.id===s.typeId)?.isAvailable)).length

  const getAvailableCount = (dateTime: string) =>
    existingResponses.filter(r=>r.schedule.some(s=>s.dateTime===dateTime && scheduleTypes.find(t=>t.id===s.typeId)?.isAvailable)).length

  const getBestDateTime = () => {
    if (!dateTimeOptions.length) return null
    let best = dateTimeOptions[0]
    let max = getAvailableCount(best)
    dateTimeOptions.forEach((dt) => {
      const cnt = getAvailableCount(dt)
      if (cnt > max) {
        max = cnt
        best = dt
      }
    })
    return { dateTime: best, count: max }
  }

  return {
    name, setName,
    grade, setGrade,
    selections, setSelections,
    comment, setComment,
    isSubmitting, setIsSubmitting,
    editSelections, setEditSelections,
    existingResponses, setExistingResponses,
    editComment, setEditComment,
    editingResponse, setEditingResponse,
    editName, setEditName,
    editGrade, setEditGrade,
    isEditDialogOpen, setIsEditDialogOpen,
    isEditing, setIsEditing,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    isDeleting, setIsDeleting,
    filterTypeId, setFilterTypeId,
    filterDateTime, setFilterDateTime,
    filterGrades, setFilterGrades,
    sortColumn, setSortColumn,
    sortDirection, setSortDirection,
    searchQuery, setSearchQuery,
    handleSelection,
    handleEditSelection,
    handleNameChange,
    handleGradeChange,
    clearResponses,
    clearEditResponses,
    handleSubmit,
    handleUpdateResponse,
    handleDeleteResponse,
    openEditDialog,
    openDeleteConfirmation,
    getSortedResponses,
    handleSort,
    resetFilters,
    toggleGradeFilter,
    getResponseTypeDistributionByGrade,
    getResponseCountByType,
    getRespondentsByType,
    getAvailableCountByGradeAndDateTime,
    getAvailableCount,
    getBestDateTime,
  }
}
