"use client"

import { useState, useEffect } from "react"
import {
  Check,
  Save,
  User,
  MessageSquare,
  X,
  GraduationCap,
  BarChart3,
  Users,
  PenSquare,
  Search,
  Calendar,
  CheckCircle2,
  Circle,
  XCircle,
  Filter,
  Clock,
  PieChart,
  Edit,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import type { ScheduleType } from "./constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  eventId: string
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  responses?: Response[]
}

type Response = {
  id: string
  name: string
  grade?: string
  schedule: {
    dateTime: string
    typeId: string
    comment?: string
  }[]
}

// 学年の順序を定義
const gradeOrder = {
  学部1年: 1,
  学部2年: 2,
  学部3年: 3,
  学部4年: 4,
  修士1年: 5,
  修士2年: 6,
  博士1年: 7,
  博士2年: 8,
  博士3年: 9,
  教員: 10,
  その他: 11,
}

export default function OneTimePage({ eventId, dateTimeOptions, scheduleTypes, responses = [] }: Props) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const [sortColumn, setSortColumn] = useState<"name" | "grade" | "availability">("grade")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [existingResponses, setExistingResponses] = useState<Response[]>(responses)
  const [filterTypeId, setFilterTypeId] = useState<string | null>(null)
  const [filterDateTime, setFilterDateTime] = useState<string | null>(null)
  const [filterGrades, setFilterGrades] = useState<string[]>([])
  const [summaryView, setSummaryView] = useState<"dates" | "grades">("dates")
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 編集モード用の状態
  const [editingResponse, setEditingResponse] = useState<Response | null>(null)
  const [editName, setEditName] = useState("")
  const [editGrade, setEditGrade] = useState("")
  const [editSelections, setEditSelections] = useState<Record<string, string>>({})
  const [editComments, setEditComments] = useState<Record<string, string>>({})
  const [showEditComments, setShowEditComments] = useState<Record<string, boolean>>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 削除確認用の状態を追加
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ローカルストレージから以前の回答を読み込む
  useEffect(() => {
    const savedName = localStorage.getItem(`event_${eventId}_name`)
    if (savedName) setName(savedName)

    const savedGrade = localStorage.getItem(`event_${eventId}_grade`)
    if (savedGrade) setGrade(savedGrade)

    const savedSelections = localStorage.getItem(`event_${eventId}_selections`)
    if (savedSelections) setSelections(JSON.parse(savedSelections))

    const savedComments = localStorage.getItem(`event_${eventId}_comments`)
    if (savedComments) setComments(JSON.parse(savedComments))
  }, [eventId])

  // 選択を処理する関数
  const handleSelection = (dateTime: string, typeId: string) => {
    const newSelections = { ...selections, [dateTime]: typeId }
    setSelections(newSelections)
    localStorage.setItem(`event_${eventId}_selections`, JSON.stringify(newSelections))
  }

  // 編集モードでの選択を処理する関数
  const handleEditSelection = (dateTime: string, typeId: string) => {
    setEditSelections((prev) => ({ ...prev, [dateTime]: typeId }))
  }

  // コメントを処理する関数
  const handleCommentChange = (dateTime: string, comment: string) => {
    const newComments = { ...comments, [dateTime]: comment }
    setComments(newComments)
    localStorage.setItem(`event_${eventId}_comments`, JSON.stringify(newComments))
  }

  // 編集モードでのコメントを処理する関数
  const handleEditCommentChange = (dateTime: string, comment: string) => {
    setEditComments((prev) => ({ ...prev, [dateTime]: comment }))
  }

  // コメント表示切り替え
  const toggleComment = (dateTime: string) => {
    setShowComments((prev) => ({
      ...prev,
      [dateTime]: !prev[dateTime],
    }))
  }

  // 編集モードでのコメント表示切り替え
  const toggleEditComment = (dateTime: string) => {
    setShowEditComments((prev) => ({
      ...prev,
      [dateTime]: !prev[dateTime],
    }))
  }

  // 名前変更時の処理
  const handleNameChange = (value: string) => {
    setName(value)
    localStorage.setItem(`event_${eventId}_name`, value)
  }

  // 学年変更時の処理
  const handleGradeChange = (value: string) => {
    setGrade(value)
    localStorage.setItem(`event_${eventId}_grade`, value)
  }

  // 回答を送信する関数
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "名前を入力してください",
        variant: "destructive",
      })
      return
    }

    // 少なくとも1つの選択があるか確認
    if (Object.keys(selections).length === 0) {
      toast({
        title: "少なくとも1つの日時に回答してください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 送信データの準備
      const responseData = {
        eventId,
        name,
        grade,
        schedule: Object.entries(selections).map(([dateTime, typeId]) => ({
          dateTime,
          typeId,
          comment: comments[dateTime] || "",
        })),
      }

      // APIエンドポイントに送信（実際の実装に合わせて調整）
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      })

      if (!response.ok) {
        throw new Error("回答の送信に失敗しました")
      }

      const { id } = await response.json()
      // ローカル state に「自分の回答」を追加
      setExistingResponses((prev) => [...prev, { id, name, grade, schedule: responseData.schedule }])

      toast({
        title: "回答を送信しました",
        description: "あなたの回答が正常に保存されました。",
      })

      // 送信成功後、回答状況タブに切り替え
      setActiveTab("responses")
    } catch (error) {
      console.error("送信エラー:", error)
      toast({
        title: "送信エラー",
        description: "回答の送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 編集した回答を更新する関数
  const handleUpdateResponse = async () => {
    if (!editingResponse) return

    if (!editName.trim()) {
      toast({
        title: "名前を入力してください",
        variant: "destructive",
      })
      return
    }

    // 少なくとも1つの選択があるか確認
    if (Object.keys(editSelections).length === 0) {
      toast({
        title: "少なくとも1つの日時に回答してください",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)

    try {
      // 送信データの準備
      const responseData = {
        name: editName,
        grade: editGrade,
        schedule: Object.entries(editSelections).map(([dateTime, typeId]) => ({
          dateTime,
          typeId,
          comment: editComments[dateTime] || "",
        })),
      }

      // APIエンドポイントに送信
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      })

      if (!response.ok) {
        throw new Error("回答の更新に失敗しました")
      }

      // ローカルステートを更新
      setExistingResponses((prev) =>
        prev.map((r) =>
          r.id === editingResponse.id
            ? {
                ...r,
                name: editName,
                grade: editGrade,
                schedule: Object.entries(editSelections).map(([dateTime, typeId]) => ({
                  dateTime,
                  typeId,
                  comment: editComments[dateTime] || "",
                })),
              }
            : r,
        ),
      )

      toast({
        title: "回答を更新しました",
        description: `${editName}さんの回答が正常に更新されました。`,
      })

      // 編集モードを終了
      setIsEditDialogOpen(false)
      setEditingResponse(null)
    } catch (error) {
      console.error("更新エラー:", error)
      toast({
        title: "更新エラー",
        description: "回答の更新中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  // 参加者の回答を削除する関数を追加
  const handleDeleteResponse = async () => {
    if (!editingResponse) return

    setIsDeleting(true)

    try {
      // APIエンドポイントに送信
      const response = await fetch(`/api/events/${eventId}/participants/${editingResponse.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("回答の削除に失敗しました")
      }

      // ローカルステートを更新
      setExistingResponses((prev) => prev.filter((r) => r.id !== editingResponse.id))

      toast({
        title: "回答を削除しました",
        description: `${editingResponse.name}さんの回答が削除されました。`,
      })

      // 編集モードと削除確認ダイアログを閉じる
      setIsDeleteDialogOpen(false)
      setIsEditDialogOpen(false)
      setEditingResponse(null)
    } catch (error) {
      console.error("削除エラー:", error)
      toast({
        title: "削除エラー",
        description: "回答の削除中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // 回答をクリアする関数
  const clearResponses = () => {
    setSelections({})
    setComments({})
    localStorage.removeItem(`event_${eventId}_selections`)
    localStorage.removeItem(`event_${eventId}_comments`)
    toast({
      title: "回答をクリアしました",
      description: "すべての選択とコメントがクリアされました。",
    })
  }

  // 編集モードの回答をクリアする関数
  const clearEditResponses = () => {
    setEditSelections({})
    setEditComments({})
    toast({
      title: "回答をクリアしました",
      description: "すべての選択とコメントがクリアされました。",
    })
  }

  // 参加者の回答を編集するためのダイアログを開く
  const openEditDialog = (response: Response) => {
    setEditingResponse(response)
    setEditName(response.name)
    setEditGrade(response.grade || "")

    // 選択とコメントを初期化
    const selections: Record<string, string> = {}
    const comments: Record<string, string> = {}

    response.schedule.forEach((item) => {
      selections[item.dateTime] = item.typeId
      if (item.comment) {
        comments[item.dateTime] = item.comment
      }
    })

    setEditSelections(selections)
    setEditComments(comments)
    setShowEditComments({})
    setIsEditDialogOpen(true)
  }

  // 削除確認ダイアログを開く関数を追加
  const openDeleteConfirmation = () => {
    setIsDeleteDialogOpen(true)
  }

  // 参加可能な回答数を集計
  const getAvailableCount = (dateTime: string) => {
    if (!existingResponses.length) return 0

    return existingResponses.filter((response) => {
      const selection = response.schedule.find((s) => s.dateTime === dateTime)
      if (!selection) return false

      const selectedType = scheduleTypes.find((type) => type.id === selection.typeId)
      return selectedType?.isAvailable
    }).length
  }

  // 最も参加可能人数が多い日時を取得
  const getBestDateTime = () => {
    if (!dateTimeOptions.length || !existingResponses.length) return null

    let bestDateTime = dateTimeOptions[0]
    let maxCount = getAvailableCount(dateTimeOptions[0])

    dateTimeOptions.forEach((dateTime) => {
      const count = getAvailableCount(dateTime)
      if (count > maxCount) {
        maxCount = count
        bestDateTime = dateTime
      }
    })

    return { dateTime: bestDateTime, count: maxCount }
  }

  // ソート関数
  const handleSort = (column: "name" | "grade" | "availability") => {
    if (sortColumn === column) {
      // 同じカラムをクリックした場合は方向を反転
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // 新しいカラムをクリックした場合はそのカラムで昇順ソート
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // 回答者の参加可能日数を取得
  const getAvailableDatesCount = (response: Response) => {
    return response.schedule.filter((selection) => {
      const type = scheduleTypes.find((t) => t.id === selection.typeId)
      return type?.isAvailable
    }).length
  }

  // 回答者をソートして返す
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

  // 学年のオプション
  const gradeOptions = [
    "学部1年",
    "学部2年",
    "学部3年",
    "学部4年",
    "修士1年",
    "修士2年",
    "博士1年",
    "博士2年",
    "博士3年",
    "教員",
    "その他",
  ]

  // 特定の日時に対する特定のタイプの回答者数を取得
  const getResponseCountByType = (dateTime: string, typeId: string) => {
    return existingResponses.filter((response) => {
      const selection = response.schedule.find((s) => s.dateTime === dateTime)
      return selection && selection.typeId === typeId
    }).length
  }

  // 特定の日時に対する回答者の名前を取得
  const getRespondentsByType = (dateTime: string, typeId: string) => {
    return existingResponses
      .filter((response) => {
        const selection = response.schedule.find((s) => s.dateTime === dateTime)
        return selection && selection.typeId === typeId
      })
      .map((response) => response.name)
  }

  // 学年ごとの日時別参加可能人数を取得
  const getAvailableCountByGradeAndDateTime = (grade: string, dateTime: string) => {
    return existingResponses.filter((response) => {
      if (response.grade !== grade) return false

      const selection = response.schedule.find((s) => s.dateTime === dateTime)
      if (!selection) return false

      const type = scheduleTypes.find((t) => t.id === selection.typeId)
      return type?.isAvailable
    }).length
  }

  // 最適な日時を取得
  const bestDateTime = getBestDateTime()

  // 回答状況のアイコンを取得
  const getResponseIcon = (response: Response, dateTime: string) => {
    const selection = response.schedule.find((s) => s.dateTime === dateTime)
    if (!selection) return null

    const type = scheduleTypes.find((t) => t.id === selection.typeId)
    if (!type) return null

    if (type.isAvailable) {
      return (
        <CheckCircle2
          className="h-4 w-4 text-green-500"
          role="img"
          aria-label={`${type.label}${selection.comment ? `: ${selection.comment}` : ""}`}
        />
      )
    } else {
      return (
        <XCircle
          className="h-4 w-4 text-red-500"
          role="img"
          aria-label={`${type.label}${selection.comment ? `: ${selection.comment}` : ""}`}
        />
      )
    }
  }

  // 回答状況のセル背景色を取得
  const getResponseCellClass = (response: Response, dateTime: string) => {
    const selection = response.schedule.find((s) => s.dateTime === dateTime)
    if (!selection) return "bg-gray-50"

    const type = scheduleTypes.find((t) => t.id === selection.typeId)
    if (!type) return "bg-gray-50"

    // 色クラスから背景色のみを抽出
    const bgClass = type.color.split(" ")[0]
    return bgClass
  }

  // フィルターをリセット
  const resetFilters = () => {
    setFilterTypeId(null)
    setFilterDateTime(null)
    setFilterGrades([])
    setSearchQuery("")
    setSortColumn("grade")
    setSortDirection("asc")
  }

  // 学年フィルターの切り替え
  const toggleGradeFilter = (grade: string) => {
    setFilterGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]))
  }

  // 学年ごとの回答タイプ分布を取得
  const getResponseTypeDistributionByGrade = (grade: string) => {
    const distribution: Record<string, number> = {}

    scheduleTypes.forEach((type) => {
      distribution[type.id] = 0
    })

    existingResponses
      .filter((response) => response.grade === grade)
      .forEach((response) => {
        response.schedule.forEach((selection) => {
          if (distribution[selection.typeId] !== undefined) {
            distribution[selection.typeId]++
          }
        })
      })

    return distribution
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="input" className="flex items-center">
            <PenSquare className="h-4 w-4 mr-2" />
            入力
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            回答状況
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            集計結果
          </TabsTrigger>
        </TabsList>

        {/* 入力タブ */}
        <TabsContent value="input" className="space-y-4">
          {/* 名前と学年入力セクション */}
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="participant-name" className="text-sm font-medium mb-1 block">
                    <User className="h-4 w-4 inline-block mr-1" />
                    名前
                  </Label>
                  <Input
                    id="participant-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="名前を入力してください"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="participant-grade" className="text-sm font-medium mb-1 block">
                    <GraduationCap className="h-4 w-4 inline-block mr-1" />
                    学年
                  </Label>
                  <Select value={grade} onValueChange={handleGradeChange}>
                    <SelectTrigger id="participant-grade">
                      <SelectValue placeholder="学年を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 日時選択セクション */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">参加可能日時の選択</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearResponses} className="whitespace-nowrap">
                  <X className="h-4 w-4 mr-1" />
                  クリア
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="whitespace-nowrap">
                  <Save className="h-4 w-4 mr-1" />
                  回答を保存
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md mb-2">
              <p className="text-sm text-gray-600">各日時について、あなたの参加可否を選択してください。</p>
            </div>

            {/* コンパクトなリスト表示 */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-2 pl-3 font-medium text-sm w-1/3">日時</th>
                    <th className="text-left p-2 font-medium text-sm">選択肢</th>
                    {existingResponses.length > 0 && (
                      <th className="text-center p-2 font-medium text-sm w-24">参加可能</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dateTimeOptions.map((dateTime, index) => {
                    const selectedTypeId = selections[dateTime]
                    const availableCount = getAvailableCount(dateTime)

                    return (
                      <tr key={`datetime-${index}`} className="hover:bg-gray-50">
                        <td className="p-2 pl-3 align-middle">
                          <div className="font-medium">{dateTime}</div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {scheduleTypes.map((type) => (
                              <button
                                key={`${type.id}-${index}`}
                                className={`px-2 py-1 rounded-md ${type.color} hover:opacity-90 transition-opacity text-sm ${
                                  selectedTypeId === type.id ? "ring-2 ring-offset-1 ring-gray-900" : ""
                                }`}
                                onClick={() => handleSelection(dateTime, type.id)}
                              >
                                {type.label}
                                {selectedTypeId === type.id && <Check className="inline-block ml-1 h-3 w-3" />}
                              </button>
                            ))}
                            <button
                              onClick={() => toggleComment(dateTime)}
                              className="text-xs text-gray-500 flex items-center hover:text-gray-700 ml-1"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {showComments[dateTime] ? "閉じる" : "コメント"}
                            </button>
                          </div>
                          {showComments[dateTime] && (
                            <div className="mt-2">
                              <Textarea
                                placeholder="コメントを入力"
                                value={comments[dateTime] || ""}
                                onChange={(e) => handleCommentChange(dateTime, e.target.value)}
                                className="w-full h-16 text-sm"
                              />
                            </div>
                          )}
                        </td>
                        {existingResponses.length > 0 && (
                          <td className="p-2 text-center">
                            <span className="font-semibold">{availableCount}人</span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 回答状況タブ */}
        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold">参加者の回答状況</h2>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {/* 検索ボックス */}
                  <div className="relative w-full md:w-40">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="名前 or 学年で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>

                  {/* ソートボタン */}
                  <div className="flex gap-1">
                    <Button
                      variant={sortColumn === "name" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSort("name")}
                    >
                      名前{sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </Button>
                    <Button
                      variant={sortColumn === "grade" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSort("grade")}
                    >
                      学年{sortColumn === "grade" && (sortDirection === "asc" ? "↑" : "↓")}
                    </Button>
                    <Button
                      variant={sortColumn === "availability" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSort("availability")}
                    >
                      参加可能数{sortColumn === "availability" && (sortDirection === "asc" ? "↑" : "↓")}
                    </Button>
                  </div>

                  {/* フィルターポップオーバー */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        フィルター
                        {(filterTypeId || filterDateTime || filterGrades.length > 0) && (
                          <Badge variant="secondary" className="ml-1 h-4 px-1">
                            {[filterTypeId ? 1 : 0, filterDateTime ? 1 : 0, filterGrades.length > 0 ? 1 : 0].reduce(
                              (a, b) => a + b,
                              0,
                            )}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">フィルター設定</h4>

                        {/* 回答タイプフィルター */}
                        <div className="space-y-2">
                          <Label className="text-xs">回答タイプ</Label>
                          <Select value={filterTypeId || ""} onValueChange={(value) => setFilterTypeId(value || null)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="回答タイプで絞り込み" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">すべて</SelectItem>
                              {scheduleTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id} className={type.color}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 日時フィルター */}
                        <div className="space-y-2">
                          <Label className="text-xs">日時</Label>
                          <Select
                            value={filterDateTime || ""}
                            onValueChange={(value) => setFilterDateTime(value || null)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="日時で絞り込み" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">すべて</SelectItem>
                              {dateTimeOptions.map((dateTime) => (
                                <SelectItem key={dateTime} value={dateTime}>
                                  {dateTime}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 学年フィルター */}
                        <div className="space-y-2">
                          <Label className="text-xs">学年</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {gradeOptions.map((grade) => (
                              <div key={grade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`grade-${grade}`}
                                  checked={filterGrades.includes(grade)}
                                  onCheckedChange={() => toggleGradeFilter(grade)}
                                />
                                <label htmlFor={`grade-${grade}`} className="text-xs cursor-pointer">
                                  {grade}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button size="sm" variant="outline" onClick={resetFilters} className="w-full text-xs">
                          フィルターをリセット
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* アクティブなフィルター表示 */}
              {(filterTypeId || filterDateTime || filterGrades.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {filterTypeId && (
                    <Badge variant="outline" className="text-xs">
                      {scheduleTypes.find((t) => t.id === filterTypeId)?.label}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setFilterTypeId(null)} />
                    </Badge>
                  )}
                  {filterDateTime && (
                    <Badge variant="outline" className="text-xs">
                      {filterDateTime}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setFilterDateTime(null)} />
                    </Badge>
                  )}
                  {filterGrades.map((grade) => (
                    <Badge key={grade} variant="outline" className="text-xs">
                      {grade}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleGradeFilter(grade)} />
                    </Badge>
                  ))}
                </div>
              )}

              {existingResponses.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-1 px-2 font-medium sticky left-0 bg-gray-50 z-10 border-r">日時</th>
                        {getSortedResponses().map((response) => (
                          <th
                            key={response.id}
                            className="py-1 px-1 text-center font-medium whitespace-nowrap cursor-pointer hover:bg-gray-100"
                            onClick={() => openEditDialog(response)}
                          >
                            <div className="flex items-center justify-center">
                              <div
                                className="truncate max-w-[60px]"
                                title={`${response.name}${response.grade ? ` (${response.grade})` : ""} - クリックして編集`}
                              >
                                {response.name}
                              </div>
                              <Pencil className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                            {response.grade && (
                              <div className="text-[10px] text-gray-500 truncate">{response.grade}</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dateTimeOptions.map((dateTime, index) => (
                        <tr key={`datetime-row-${index}`} className="hover:bg-gray-50">
                          <td className="py-1 px-2 font-medium sticky left-0 bg-white z-10 border-r text-xs">
                            <div className="truncate max-w-[120px]" title={dateTime}>
                              {dateTime}
                            </div>
                          </td>
                          {getSortedResponses().map((response) => (
                            <td
                              key={`${dateTime}-${response.id}`}
                              className={`py-1 px-1 text-center ${getResponseCellClass(response, dateTime)}`}
                            >
                              {getResponseIcon(response, dateTime) || <Circle className="h-3 w-3 text-gray-200" />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">まだ回答がありません。</div>
              )}

              {/* 凡例 */}
              {existingResponses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <div className="font-medium mr-1">凡例:</div>
                  {scheduleTypes.map((type) => (
                    <div key={type.id} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${type.color.split(" ")[0]}`}></div>
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 集計結果タブ */}
        <TabsContent value="summary" className="space-y-4">
          {existingResponses.length > 0 ? (
            <div className="space-y-4">
              {/* 表示切り替えタブ */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">集計結果</h2>
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1 text-sm flex items-center ${
                      summaryView === "dates" ? "bg-gray-100 font-medium" : "bg-white"
                    }`}
                    onClick={() => setSummaryView("dates")}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    日時別
                  </button>
                  <button
                    className={`px-3 py-1 text-sm flex items-center ${
                      summaryView === "grades" ? "bg-gray-100 font-medium" : "bg-white"
                    }`}
                    onClick={() => setSummaryView("grades")}
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    学年別
                  </button>
                </div>
              </div>

              {/* 最適な日時 */}
              {bestDateTime && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-green-800 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      最も参加可能な日時
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-green-700 mr-2">{bestDateTime.dateTime}</div>
                      <Badge className="bg-green-600">{bestDateTime.count}人参加可能</Badge>
                    </div>
                    <div className="mt-2 text-sm text-green-600">
                      参加可能な人:{" "}
                      {getRespondentsByType(
                        bestDateTime.dateTime,
                        scheduleTypes.find((t) => t.isAvailable)?.id || "",
                      ).join(", ")}
                    </div>
                  </CardContent>
                </Card>
              )}

              {summaryView === "dates" ? (
                /* 日時別の集計表 */
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      日時別の回答状況
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left py-2 px-3 font-medium">日時</th>
                            {scheduleTypes.map((type) => (
                              <th key={`header-${type.id}`} className={`py-2 px-2 text-center ${type.color}`}>
                                {type.label}
                              </th>
                            ))}
                            <th className="py-2 px-3 text-center font-medium">参加可能</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {dateTimeOptions.map((dateTime, index) => {
                            const availableCount = getAvailableCount(dateTime)
                            const isOptimal = bestDateTime && bestDateTime.dateTime === dateTime

                            return (
                              <tr
                                key={`summary-${index}`}
                                className={`hover:bg-gray-50 ${isOptimal ? "bg-green-50" : ""}`}
                              >
                                <td className="py-2 px-3 font-medium">
                                  <div className="flex items-center">
                                    {dateTime}
                                    {isOptimal && <Badge className="ml-2 bg-green-600 text-[10px]">最適</Badge>}
                                  </div>
                                </td>
                                {scheduleTypes.map((type) => {
                                  const count = getResponseCountByType(dateTime, type.id)
                                  const respondents = getRespondentsByType(dateTime, type.id)

                                  return (
                                    <td
                                      key={`cell-${dateTime}-${type.id}`}
                                      className="py-2 px-2 text-center"
                                      title={respondents.length > 0 ? respondents.join(", ") : "該当者なし"}
                                    >
                                      <div className="flex justify-center">
                                        <div
                                          className={`
                                            ${count > 0 ? type.color : "bg-gray-100 text-gray-500"} 
                                            px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                          `}
                                        >
                                          {count}
                                        </div>
                                      </div>
                                    </td>
                                  )
                                })}
                                <td className="py-2 px-2 text-center">
                                  <div className="flex justify-center">
                                    <div
                                      className={`
                                        ${availableCount > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"} 
                                        px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                      `}
                                    >
                                      {availableCount}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* 学年別の集計表 */
                <div className="space-y-4">
                  {/* 学年別の参加状況サマリー */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        学年別の参加状況
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left py-2 px-3 font-medium">学年</th>
                              <th className="py-2 px-2 text-center font-medium">回答者数</th>
                              {dateTimeOptions.map((dateTime, index) => (
                                <th key={`header-date-${index}`} className="py-2 px-2 text-center font-medium">
                                  <div className="truncate max-w-[80px]" title={dateTime}>
                                    {dateTime}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {Object.entries(
                              existingResponses.reduce(
                                (acc, response) => {
                                  const grade = response.grade || "未設定"
                                  if (!acc[grade]) acc[grade] = []
                                  acc[grade].push(response.name)
                                  return acc
                                },
                                {} as Record<string, string[]>,
                              ),
                            )
                              .sort(([gradeA], [gradeB]) => {
                                const orderA = gradeOrder[gradeA as keyof typeof gradeOrder] || 999
                                const orderB = gradeOrder[gradeB as keyof typeof gradeOrder] || 999
                                return orderA - orderB
                              })
                              .map(([grade, names]) => (
                                <tr key={`grade-${grade}`} className="hover:bg-gray-50">
                                  <td className="py-2 px-3 font-medium">{grade}</td>
                                  <td className="py-2 px-2 text-center">{names.length}人</td>
                                  {dateTimeOptions.map((dateTime, index) => {
                                    const availableCount = getAvailableCountByGradeAndDateTime(grade, dateTime)
                                    return (
                                      <td key={`grade-date-${grade}-${index}`} className="py-2 px-2 text-center">
                                        <div className="flex justify-center">
                                          <div
                                            className={`
                                              ${availableCount > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"} 
                                              px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                            `}
                                          >
                                            {availableCount}
                                          </div>
                                        </div>
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 学年別の詳細 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center">
                        <PieChart className="h-4 w-4 mr-2" />
                        学年別の詳細情報
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          existingResponses.reduce(
                            (acc, response) => {
                              const grade = response.grade || "未設定"
                              if (!acc[grade]) acc[grade] = []
                              acc[grade].push(response.name)
                              return acc
                            },
                            {} as Record<string, string[]>,
                          ),
                        )
                          .sort(([gradeA], [gradeB]) => {
                            const orderA = gradeOrder[gradeA as keyof typeof gradeOrder] || 999
                            const orderB = gradeOrder[gradeB as keyof typeof gradeOrder] || 999
                            return orderA - orderB
                          })
                          .map(([grade, names]) => (
                            <div key={`grade-detail-${grade}`} className="border rounded-md overflow-hidden">
                              <div className="bg-gray-50 py-2 px-3 font-medium flex justify-between items-center">
                                <div>{grade}</div>
                                <Badge variant="secondary">{names.length}人</Badge>
                              </div>
                              <div className="p-3">
                                <div className="text-sm mb-2">参加者: {names.join(", ")}</div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {scheduleTypes.map((type) => {
                                    const distribution = getResponseTypeDistributionByGrade(grade)
                                    const count = distribution[type.id] || 0
                                    return (
                                      <div key={`grade-type-${grade}-${type.id}`} className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${type.color.split(" ")[0]} mr-2`}></div>
                                        <span className="text-sm">{type.label}: </span>
                                        <span className="text-sm font-medium ml-1">{count}回</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              まだ回答がありません。集計結果を表示するには少なくとも1件の回答が必要です。
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 送信ボタン（モバイル用固定フッター） */}
      {isMobile && activeTab === "input" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-between items-center z-10">
          <div className="text-sm">
            {Object.keys(selections).length} / {dateTimeOptions.length} 回答済み
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-1" />
            回答を保存
          </Button>
        </div>
      )}

      {/* 回答編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              回答の編集
            </DialogTitle>
          </DialogHeader>

          {editingResponse && (
            <div className="space-y-4 py-2">
              {/* 名前と学年入力セクション */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium mb-1 block">
                    <User className="h-4 w-4 inline-block mr-1" />
                    名前
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="名前を入力してください"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-grade" className="text-sm font-medium mb-1 block">
                    <GraduationCap className="h-4 w-4 inline-block mr-1" />
                    学年
                  </Label>
                  <Select value={editGrade} onValueChange={(value) => setEditGrade(value)}>
                    <SelectTrigger id="edit-grade">
                      <SelectValue placeholder="学年を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 日時選択セクション */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2 pl-3 font-medium text-sm w-1/3">日時</th>
                      <th className="text-left p-2 font-medium text-sm">選択肢</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dateTimeOptions.map((dateTime, index) => {
                      const selectedTypeId = editSelections[dateTime]

                      return (
                        <tr key={`edit-datetime-${index}`} className="hover:bg-gray-50">
                          <td className="p-2 pl-3 align-middle">
                            <div className="font-medium">{dateTime}</div>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {scheduleTypes.map((type) => (
                                <button
                                  key={`edit-${type.id}-${index}`}
                                  className={`px-2 py-1 rounded-md ${type.color} hover:opacity-90 transition-opacity text-sm ${
                                    selectedTypeId === type.id ? "ring-2 ring-offset-1 ring-gray-900" : ""
                                  }`}
                                  onClick={() => handleEditSelection(dateTime, type.id)}
                                  type="button"
                                >
                                  {type.label}
                                  {selectedTypeId === type.id && <Check className="inline-block ml-1 h-3 w-3" />}
                                </button>
                              ))}
                              <button
                                onClick={() => toggleEditComment(dateTime)}
                                className="text-xs text-gray-500 flex items-center hover:text-gray-700 ml-1"
                                type="button"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {showEditComments[dateTime] ? "閉じる" : "コメント"}
                              </button>
                            </div>
                            {showEditComments[dateTime] && (
                              <div className="mt-2">
                                <Textarea
                                  placeholder="コメントを入力"
                                  value={editComments[dateTime] || ""}
                                  onChange={(e) => handleEditCommentChange(dateTime, e.target.value)}
                                  className="w-full h-16 text-sm"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearEditResponses} type="button">
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
              <Button variant="destructive" onClick={openDeleteConfirmation} type="button">
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                キャンセル
              </Button>
              <Button onClick={handleUpdateResponse} disabled={isEditing} type="button">
                {isEditing ? "更新中..." : "更新する"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              回答の削除
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingResponse && (
                <>
                  <span className="font-medium">{editingResponse.name}</span>
                  さんの回答を削除します。この操作は元に戻せません。
                  <br />
                  本当に削除してもよろしいですか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteResponse()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
