// app/events/[eventId]/components/ParticipantList.tsx
'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useMediaQuery } from '@/hooks/use-mobile'
import { toast } from '@/components/ui/use-toast'
import { useParams, usePathname } from 'next/navigation'
import type { Participant } from './types'
import type { ScheduleType } from './constants'

type Props = {
  participants: Participant[]
  setParticipants: (ps: Participant[]) => void
  setCurrentName: (s: string) => void
  setCurrentGrade: (s: string) => void
  setCurrentComment: (s: string) => void
  setCurrentSchedule: (s: Participant['schedule']) => void
  setEditingIndex: (i: number | null) => void
  setActiveTab: (t: string) => void
  xAxis: string[]
  yAxis: string[]
  availableOptions: string[]
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
  scheduleTypes: ScheduleType[]
}

export default function ParticipantList({
  participants,
  setParticipants,
  setCurrentName,
  setCurrentGrade,
  setCurrentComment,
  setCurrentSchedule,
  setEditingIndex,
  setActiveTab,
  xAxis,
  yAxis,
  availableOptions,
  gradeOptions,
  gradeOrder,
  scheduleTypes,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { eventId } = useParams()
  const pathname = usePathname()
  const isEnglish = pathname.startsWith('/en')

  // 所属/役職フィルタ／ソート／ビュー切り替え
  const [filterGrade, setFilterGrade] = useState<string>('All')
  const [sortAscending, setSortAscending] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  // フィルタ・ソート適用
  let displayed =
    filterGrade === 'All'
      ? [...participants]
      : participants.filter((p) => p.grade === filterGrade)

  displayed.sort((a, b) => {
    const ai = gradeOrder[a.grade] ?? 999
    const bi = gradeOrder[b.grade] ?? 999
    return sortAscending ? ai - bi : bi - ai
  })

  const slotDescriptors = useMemo(
    () =>
      xAxis.flatMap((day) =>
        yAxis.map((period) => ({
          key: `${day}-${period}`,
          day,
          period: String(period),
        }))
      ),
    [xAxis, yAxis]
  )

  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const slot of slotDescriptors) {
      counts[slot.key] = displayed.filter((p) =>
        availableOptions.includes(p.schedule[slot.key])
      ).length
    }
    return counts
  }, [displayed, slotDescriptors, availableOptions])

  const handleEdit = (idx: number) => {
    const part = displayed[idx]
    const origIdx = participants.findIndex((p) => p.id === part.id)
    setCurrentName(part.name)
    setCurrentGrade(part.grade)
    setCurrentComment(part.comment ?? '')
    setCurrentSchedule(part.schedule)
    setEditingIndex(origIdx)
    setActiveTab('input')
  }

  const handleDelete = async (idx: number) => {
    const part = displayed[idx]
    if (
      !confirm(
        isEnglish
          ? `Delete schedule for ${part.name}?`
          : `${part.name}さんのスケジュールを削除しますか？`,
      )
    )
      return

    try {
      const res = await fetch(
        `/api/events/${eventId}/participants/${part.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error(isEnglish ? 'Failed to delete' : '削除に失敗しました')
      setParticipants(participants.filter((p) => p.id !== part.id))
      toast({
        title: isEnglish ? 'Deleted' : '削除完了',
        description: isEnglish ? 'Schedule deleted' : 'スケジュールが削除されました',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: isEnglish ? 'Delete error' : '削除エラー',
        description: String(err),
        variant: 'destructive',
      })
    }
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEnglish ? 'Participant List' : '参加者一覧'}</CardTitle>
          <CardDescription>
            {isEnglish ? 'No participants registered yet' : 'まだ参加者が登録されていません'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      {/* ── フィルタ／ソート／ビュー切替 ── */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-grade">
            {isEnglish ? 'Affiliation/Role Filter' : '所属/役職フィルタ'}
          </Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger id="filter-grade" className="w-36">
              <SelectValue placeholder={isEnglish ? 'All' : '全て'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{isEnglish ? 'All' : '全て'}</SelectItem>
              {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAscending((p) => !p)}
          >
            {sortAscending
              ? isEnglish
                ? 'Role↑'
                : '所属/役職↑'
              : isEnglish
              ? 'Role↓'
              : '所属/役職↓'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid'
              ? isEnglish
                ? 'List View'
                : 'リスト表示'
              : isEnglish
              ? 'Grid View'
              : 'グリッド表示'}
          </Button>
        </div>
      </div>

      {/* ── グリッドビュー ── */}
      {viewMode === 'grid' ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-gray-50">
                <th className="border px-1 py-0.5 text-left sticky left-0 top-0 bg-gray-50 z-30">
                  {isEnglish ? 'Time Slot' : '日時'}
                </th>
                <th className="border px-1 py-0.5 text-center font-medium top-0 bg-gray-50">
                  {isEnglish ? 'Available' : '参加可能数'}
                </th>
                {displayed.map((part, idx) => (
                  <th
                    key={part.id}
                    className="border px-1 py-0.5 text-center align-top w-[8rem] min-w-[8rem] max-w-[8rem] bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEdit(idx)}
                    title={isEnglish ? 'Click to edit' : 'クリックして編集'}
                  >
                    <div className="font-semibold truncate w-full" title={part.name}>
                      {part.name}
                    </div>
                    {part.grade && (
                      <div className="text-[10px] text-gray-500 truncate w-full" title={part.grade}>
                        {part.grade}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slotDescriptors.map(({ key, day, period }) => {
                const periodLabel = isEnglish
                  ? period
                  : /^\d+$/.test(period)
                  ? `${period}限`
                  : period
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="border px-1 py-0.5 sticky left-0 bg-white z-20 align-top">
                      <div className="font-medium">{day}</div>
                      <div className="text-[11px] text-gray-500">{periodLabel}</div>
                    </td>
                    <td className="border px-1 py-0.5 text-center font-medium bg-gray-50">
                      {availableCounts[key] ?? 0}
                    </td>
                    {displayed.map((part) => {
                      const value = part.schedule[key]
                      const type = scheduleTypes.find((t) => t.id === value)
                      return (
                        <td
                          key={`${part.id}-${key}`}
                          className="border px-1 py-0.5 text-center w-[8rem] min-w-[8rem] max-w-[8rem]"
                        >
                          {value ? (
                            <span
                              className={`inline-flex items-center justify-center px-1 py-px rounded text-xs leading-tight ${
                                type?.color || ''
                              }`}
                            >
                              {type?.label}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              <tr className="bg-gray-50">
                <td className="border px-1 py-0.5 text-left font-medium sticky left-0 bg-gray-50 z-20">
                  {isEnglish ? 'Comment' : 'コメント'}
                </td>
                <td className="border px-1 py-0.5 text-center bg-gray-50">-</td>
                {displayed.map((part) => (
                  <td
                    key={`comment-${part.id}`}
                    className="border px-1 py-0.5 align-top text-xs whitespace-pre-wrap break-words text-left text-muted-foreground w-[8rem] min-w-[8rem] max-w-[8rem]"
                  >
                    {part.comment && part.comment.trim() !== '' ? (
                      part.comment
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        /* ── リストビュー（既存カード） ── */
        <div className="space-y-4">
          {displayed.map((part, idx) => (
            <Card key={part.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {part.grade}: {part.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(idx)}>
                      {isEnglish ? 'Edit' : '編集'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(idx)}>
                      {isEnglish ? 'Delete' : '削除'}
                    </Button>
                  </div>
                </div>
                {part.comment && part.comment.trim() !== '' && (
                  <CardDescription className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {part.comment}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {isMobile ? (
                  <div>
                    <div className="grid grid-cols-5 gap-1 mb-1">
                      {xAxis.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    {yAxis.map((period) => (
                      <div key={period} className="mb-2">
                        <div className="font-medium text-xs mb-1">
                          {isEnglish ? `P${period}` : `${period}限`}
                        </div>
                        <div className={`grid grid-cols-${xAxis.length} gap-1`}>
                          {xAxis.map((day) => {
                            const key = `${day}-${period}`
                            const value = part.schedule[key]
                            const type = scheduleTypes.find((t) => t.id === value)

                            return (
                              <div
                                key={key}
                                className={`h-8 flex items-center justify-center rounded border border-gray-200 text-xs ${
                                  type?.color || 'bg-gray-50'
                                }`}
                              >
                                {value ? type?.label.charAt(0) : '-'}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border p-1 sticky left-0 bg-white z-20"></th>
                          {xAxis.map((day) => (
                            <th key={day} className="border p-1 text-center">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {yAxis.map((period) => (
                          <tr key={period}>
                            <td className="border p-1 text-center font-medium sticky left-0 bg-white z-10">
                              {isEnglish ? `P${period}` : `${period}限`}
                            </td>
                            {xAxis.map((day) => {
                              const key = `${day}-${period}`
                              const value = part.schedule[key]
                              const type = scheduleTypes.find((t) => t.id === value)

                              return (
                                <td
                                  key={key}
                                  className="border p-1 text-center"
                                >
                                  {value ? (
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        type?.color || ''
                                      }`}
                                    >
                                      {type?.label}
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
    </>
  )
}
