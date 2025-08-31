"use client"

import {
  X,
  Search,
  CheckCircle2,
  Circle,
  XCircle,
  Filter,
  Pencil,
} from "lucide-react"
import type { ScheduleType, Response } from "./constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent  } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useParticipantForm } from "./useParticipantForm"
type ParticipantFormHook = ReturnType<typeof useParticipantForm>

type Props = {
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  responses?: Response[]
  form: ParticipantFormHook
  gradeOptions: string[]
}

export default function OneTimeResponsesTab({
  dateTimeOptions,
  scheduleTypes,
  responses = [],
  form,
  gradeOptions,
}: Props) {
  // 
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

  const sorted = form.getSortedResponses() // ここがうまく動いてない

  const availableTypeIds = scheduleTypes
    .filter((t) => t.isAvailable)
    .map((t) => t.id)

  const availableCounts = sorted.reduce((acc, r) => {
    acc[r.id] = r.schedule.filter((s) =>
      availableTypeIds.includes(s.typeId)
    ).length
    return acc
  }, {} as Record<string, number>)

  return (
    <TabsContent value="responses" className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-2">
          {/* ヘッダー */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold">参加者の回答状況</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* 検索 */}
              <div className="relative w-full md:w-40">
                <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="名前 or 所属/役職で検索..."
                  value={form.searchQuery}
                  onChange={(e) => form.setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
              {/* ソート */}
              <div className="flex gap-1">
                <Button
                  variant={form.sortColumn === "name" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => form.handleSort("name")}
                >
                  名前{form.sortColumn === "name" && (form.sortDirection === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant={form.sortColumn === "grade" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => form.handleSort("grade")}
                >
                  所属/役職{form.sortColumn === "grade" && (form.sortDirection === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant={form.sortColumn === "availability" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => form.handleSort("availability")}
                >
                  参加可能数
                  {form.sortColumn === "availability" && (form.sortDirection === "asc" ? "↑" : "↓")}
                </Button>
              </div>
              {/* フィルター */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    フィルター
                    {(form.filterTypeId || form.filterDateTime || form.filterGrades.length > 0) && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1">
                        {[
                          form.filterTypeId ? 1 : 0,
                          form.filterDateTime ? 1 : 0,
                          form.filterGrades.length > 0 ? 1 : 0,
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    {/* 回答タイプ */}
                    <div className="space-y-2">
                      <Select
                        value={form.filterTypeId || ""}
                        onValueChange={(v) => form.setFilterTypeId(v || null)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="回答タイプで絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          {scheduleTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id} className={t.color}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* 日時 */}
                    <div className="space-y-2">
                      <Select
                        value={form.filterDateTime || ""}
                        onValueChange={(v) => form.setFilterDateTime(v || null)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="日時で絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          {dateTimeOptions.map((dt) => (
                            <SelectItem key={dt} value={dt}>
                              {dt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* 所属/役職 */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {gradeOptions.map((g) => (
                          <label key={g} className="flex items-center space-x-2 text-xs">
                            <Checkbox
                              checked={form.filterGrades.includes(g)}
                              onCheckedChange={() => form.toggleGradeFilter(g)}
                            />
                            <span>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={form.resetFilters} className="w-full text-xs">
                      リセット
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* フィルター表示 */}
          {(form.filterTypeId || form.filterDateTime || form.filterGrades.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {form.filterTypeId && (
                <Badge variant="outline" className="text-xs">
                  {scheduleTypes.find((t) => t.id === form.filterTypeId)?.label}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => form.setFilterTypeId(null)} />
                </Badge>
              )}
              {form.filterDateTime && (
                <Badge variant="outline" className="text-xs">
                  {form.filterDateTime}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => form.setFilterDateTime(null)} />
                </Badge>
              )}
              {form.filterGrades.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">
                  {g}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => form.toggleGradeFilter(g)} />
                </Badge>
              ))}
            </div>
          )}

          {/* テーブル, sortedに回答されたデータがある */}
          {sorted.length > 0 ? (
            <div className="border rounded-md overflow-auto max-h-96">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="bg-gray-50 border-b">
                    <th className="sticky left-0 bg-gray-50 z-10 border-r text-left py-1 px-2 font-medium">
                      日時
                    </th>
                    {sorted.map((r) => (
                      <th
                        key={r.id}
                        className="py-1 px-1 text-center font-medium whitespace-nowrap cursor-pointer hover:bg-gray-100"
                        onClick={() => form.openEditDialog(r)}
                      >
                        <div className="flex items-center justify-center">
                          <div className="truncate max-w-[60px]" title={`${r.name} - クリックして編集`}>
                            {r.name}
                          </div>
                          <Pencil className="h-3 w-3 ml-1 text-gray-400" />
                        </div>
                        {r.grade && <div className="text-[10px] text-gray-500">{r.grade}</div>}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <th className="sticky left-0 bg-gray-50 z-10 border-r text-left py-1 px-2 font-medium">
                      参加可能数
                    </th>
                    {sorted.map((r) => (
                      <th key={`count-${r.id}`} className="py-1 px-1 text-center font-medium">
                        {availableCounts[r.id] ?? 0}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dateTimeOptions.map((dt, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white z-10 border-r text-xs py-1 px-2 font-medium">
                        {dt}
                      </td>
                      {sorted.map((r) => (
                        <td
                          key={`${dt}-${r.id}`}
                          className={`py-1 px-1 text-center ${getResponseCellClass(r, dt)}`}
                        >
                          {getResponseIcon(r, dt) || <Circle className="h-3 w-3 text-gray-200" />}
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
          {responses.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="font-medium mr-1">凡例:</div>
              {scheduleTypes.map((t) => (
                <div key={t.id} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${t.color.split(" ")[0]}`}></div>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
