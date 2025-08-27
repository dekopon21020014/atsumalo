// hooks/useParticipantForm.ts
import { useState, useEffect } from "react"
import { type ScheduleType, type Response, gradeOrder } from "@/app/events/[eventId]/components/constants"
import { toast } from "@/components/ui/use-toast"

export function useParticipantForm(
  eventId: string,
  dateTimeOptions: string[],
  scheduleTypes: ScheduleType[],
  responses: Response[],
  setActiveTab: (tab: string) => void,
) {
  const [name, setName] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [editSelections, setEditSelections] = useState<Record<string, string>>({})
  const [existingResponses, setExistingResponses] = useState<Response[]>(responses)
  const [editComments, setEditComments] = useState<Record<string, string>>({})
  const [editingResponse, setEditingResponse] = useState<Response | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editGrade, setEditGrade] = useState<string>("")
  const [showEditComments, setShowEditComments] = useState<Record<string, boolean>>({})
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

  useEffect(() => {
    const s = localStorage.getItem(`event_${eventId}_selections`)
    if (s) setSelections(JSON.parse(s))
    const c = localStorage.getItem(`event_${eventId}_comments`)
    if (c) setComments(JSON.parse(c))
  }, [eventId])

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

  const handleCommentChange = (dateTime: string, comment: string) => {
    const newComments = { ...comments, [dateTime]: comment }
    setComments(newComments)
    localStorage.setItem(`event_${eventId}_comments`, JSON.stringify(newComments))
  }

  const toggleComment = (dateTime: string) => {
    setShowComments(prev => ({ ...prev, [dateTime]: !prev[dateTime] }))
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
    setComments({})
    localStorage.removeItem(`event_${eventId}_selections`)
    localStorage.removeItem(`event_${eventId}_comments`)
    toast({ title: "回答をクリアしました", description: "すべての選択とコメントがクリアされました。" })
  }

  const clearEditResponses = () => {
    setEditSelections({})
    setEditComments({})
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
      const responseData = { eventId, name, grade,
        schedule: Object.entries(selections).map(([dateTime, typeId]) => ({ dateTime, typeId, comment: comments[dateTime] || "" }))
      }
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })
      if (!response.ok) throw new Error("回答の送信に失敗しました")
      const { id } = await response.json()
      setExistingResponses(prev => [...prev, { id, name, grade, schedule: responseData.schedule }])
      toast({ title: "回答を送信しました", description: "あなたの回答が正常に保存されました。" })
      setActiveTab("responses")
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
      const responseData = {
        name: editName, grade: editGrade,
        schedule: Object.entries(editSelections).map(([dateTime, typeId]) => ({ dateTime, typeId, comment: editComments[dateTime] || "" }))
      }
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })
      if (!response.ok) throw new Error("回答の更新に失敗しました")
      setExistingResponses(prev => prev.map(r => r.id === editingResponse.id ? { ...r, name: editName, grade: editGrade, schedule: responseData.schedule } : r))
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

  const handleEditCommentChange = (dateTime: string, comment: string) => {
    setEditComments(prev => ({ ...prev, [dateTime]: comment }))
  }

  const toggleEditComment = (dateTime: string) => {
    setShowEditComments(prev => ({ ...prev, [dateTime]: !prev[dateTime] }))
  }

  const handleDeleteResponse = async () => {
    if (!editingResponse) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("回答の削除に失敗しました")
      setExistingResponses(prev => prev.filter(r => r.id !== editingResponse.id))
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
    setEditingResponse(response)
    setEditName(response.name)
    setEditGrade(response.grade || "")
    const sel: Record<string, string> = {}
    const com: Record<string, string> = {}
    response.schedule.forEach(item => { sel[item.dateTime] = item.typeId; if (item.comment) com[item.dateTime] = item.comment })
    setEditSelections(sel)
    setEditComments(com)
    setShowEditComments({})
    setIsEditDialogOpen(true)
  }

  const openDeleteConfirmation = () => {
    setIsDeleteDialogOpen(true)
  }

  const getSortedResponses = () => {
    if (!existingResponses.length) return []

    // 検索フィルタリング
    let filtered = existingResponses

    // 名前または学年で検索
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

    // 学年でフィルタリング
    if (filterGrades.length > 0) {
      filtered = filtered.filter((response) => response.grade && filterGrades.includes(response.grade))
    }

    // ソート
    return [...filtered].sort((a, b) => {
      if (sortColumn === "name") {
        const comparison = a.name.localeCompare(b.name)
        return sortDirection === "asc" ? comparison : -comparison
      } else if (sortColumn === "grade") {
        // 学年でソート
        const gradeA = a.grade ? gradeOrder[a.grade as keyof typeof gradeOrder] || 999 : 999
        const gradeB = b.grade ? gradeOrder[b.grade as keyof typeof gradeOrder] || 999 : 999
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
    comments, setComments,
    showComments, setShowComments,
    isSubmitting, setIsSubmitting,
    editSelections, setEditSelections,
    existingResponses, setExistingResponses,
    editComments, setEditComments,
    editingResponse, setEditingResponse,
    editName, setEditName,
    editGrade, setEditGrade,
    showEditComments, setShowEditComments,
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
    handleCommentChange,
    toggleComment,
    handleNameChange,
    handleGradeChange,
    clearResponses,
    clearEditResponses,
    handleSubmit,
    handleUpdateResponse,
    handleEditCommentChange,
    toggleEditComment,
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
