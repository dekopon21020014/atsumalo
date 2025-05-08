// app/events/[eventId]/components/ParticipantList.tsx
'use client'

import { useState } from 'react'
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
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { eventId } = useParams()

  // 学年フィルタ／ソート／ビュー切り替え
  const gradeOrder = ['Teacher', 'M2', 'M1', 'B4', 'B3', 'B2', 'B1', 'Other']
  const [filterGrade, setFilterGrade] = useState<string>('All')
  const [sortAscending, setSortAscending] = useState<boolean>(true)
  const [isGrid, setIsGrid] = useState<boolean>(false)

  // フィルタ・ソート適用
  let displayed =
    filterGrade === 'All'
      ? [...participants]
      : participants.filter((p) => p.grade === filterGrade)

  displayed.sort((a, b) => {
    const ai = gradeOrder.indexOf(a.grade)
    const bi = gradeOrder.indexOf(b.grade)
    return sortAscending ? ai - bi : bi - ai
  })

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
          <Label htmlFor="filter-grade">学年フィルタ</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger id="filter-grade" className="w-36">
              <SelectValue placeholder="全学年" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">全学年</SelectItem>
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
            {sortAscending ? '学年↑' : '学年↓'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGrid((p) => !p)}
          >
            {isGrid ? 'リスト表示' : 'グリッド表示'}
          </Button>
        </div>
      </div>

      {/* ── グリッドビュー ── */}
      {isGrid ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-1">名前</th>
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
            </thead>
            <tbody>
              {displayed.map((part) => (
                <tr key={part.id}>
                  <td className="border p-1 font-medium">
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
                          <th className="border p-1"></th>
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
                            <td className="border p-1 text-center font-medium">
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
