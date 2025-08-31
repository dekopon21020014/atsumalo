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
import { useParams } from 'next/navigation'
import type { Participant } from './types'
import { scheduleTypes } from './constants'

type Props = {
  participants: Participant[]
  setParticipants: (ps: Participant[]) => void
  setCurrentName: (s: string) => void
  setCurrentGrade: (s: string) => void
  setCurrentSchedule: (s: Participant['schedule']) => void
  setEditingIndex: (i: number | null) => void
  setActiveTab: (t: string) => void
  xAxis: string[]
  yAxis: string[]
  availableOptions: string[]
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
}

export default function ParticipantList({
  participants,
  setParticipants,
  setCurrentName,
  setCurrentGrade,
  setCurrentSchedule,
  setEditingIndex,
  setActiveTab,
  xAxis,
  yAxis,
  availableOptions,
  gradeOptions,
  gradeOrder,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { eventId } = useParams()

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

  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const day of xAxis) {
      for (const period of yAxis) {
        const key = `${day}-${period}`
        counts[key] = displayed.filter((p) =>
          availableOptions.includes(p.schedule[key])
        ).length
      }
    }
    return counts
  }, [displayed, xAxis, yAxis, availableOptions])

  const handleEdit = (idx: number) => {
    const part = displayed[idx]
    const origIdx = participants.findIndex((p) => p.id === part.id)
    setCurrentName(part.name)
    setCurrentGrade(part.grade)
    setCurrentSchedule(part.schedule)
    setEditingIndex(origIdx)
    setActiveTab('input')
  }

  const handleDelete = async (idx: number) => {
    const part = displayed[idx]
    if (!confirm(`${part.name}さんのスケジュールを削除しますか？`)) return

    try {
      const res = await fetch(
        `/api/events/${eventId}/participants/${part.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('削除に失敗しました')
      setParticipants(participants.filter((p) => p.id !== part.id))
      toast({ title: '削除完了', description: 'スケジュールが削除されました' })
    } catch (err) {
      console.error(err)
      toast({ title: '削除エラー', description: String(err), variant: 'destructive' })
    }
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>参加者一覧</CardTitle>
          <CardDescription>まだ参加者が登録されていません</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      {/* ── フィルタ／ソート／ビュー切替 ── */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-grade">所属/役職フィルタ</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger id="filter-grade" className="w-36">
              <SelectValue placeholder="全て" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">全て</SelectItem>
              {gradeOrder.map((g) => (
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
            {sortAscending ? '所属/役職↑' : '所属/役職↓'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'リスト表示' : 'グリッド表示'}
          </Button>
        </div>
      </div>

      {/* ── グリッドビュー ── */}
      {viewMode === 'grid' ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="border p-1 sticky left-0 bg-white z-20">名前</th>
                {xAxis.map((day) =>
                  yAxis.map((period) => (
                    <th
                      key={`${day}-${period}`}
                      className="border p-1 text-center whitespace-nowrap"
                    >
                      {day}{period}限
                    </th>
                  ))
                )}
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-1 text-center sticky left-0 bg-gray-50 z-20">
                  参加可能者数
                </th>
                {xAxis.map((day) =>
                  yAxis.map((period) => (
                    <th
                      key={`count-${day}-${period}`}
                      className="border p-1 text-center"
                    >
                      {availableCounts[`${day}-${period}`] ?? 0}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {displayed.map((part) => (
                <tr key={part.id}>
                  <td className="border p-1 font-medium sticky left-0 bg-white z-10">
                    {part.grade}：{part.name}
                  </td>
                  {xAxis.map((day) =>
                    yAxis.map((period) => {
                      const key = `${day}-${period}`
                      const value = part.schedule[key]
                      const type = scheduleTypes.find((t) => t.id === value)
                      return (
                        <td key={key} className="border p-1 text-center">
                          {value ? (
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                type?.color
                              }`}
                            >
                              {type?.label}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      )
                    })
                  )}
                </tr>
              ))}
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
                    {part.grade}：{part.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(idx)}>
                      編集
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(idx)}>
                      削除
                    </Button>
                  </div>
                </div>
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
                          {period}限
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
                              {period}限
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
