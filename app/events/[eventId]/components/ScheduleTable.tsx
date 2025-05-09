"use client"

import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ScheduleType } from "@/app/events/[eventId]/components/constants"
import type { Schedule } from "./types"

export type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  schedule: Schedule
  updateSchedule: (labelX: string, labelY: string, value: string) => void
  selectedCells: Record<string, boolean>
  setSelectedCells: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  selectionMode: "tap" | "drag"
  bulkScheduleType: string
  onSelectColumn: (labelX: string) => void
  onSelectRow: (labelY: string) => void
}

export default function ScheduleTable({
  xAxis,
  yAxis,
  scheduleTypes,
  schedule,
  updateSchedule,
  selectedCells,
  setSelectedCells,
  selectionMode,
  bulkScheduleType,
  onSelectColumn,
  onSelectRow,
}: Props) {
  const handleMouseDown = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || e.button !== 0) return

    // セレクトボックスをクリックした場合は選択処理をスキップ
    if ((e.target as HTMLElement).closest(".select-trigger")) return

    const key = `${labelX}-${labelY}`
    setSelectedCells({ [key]: true })

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  const handleMouseEnter = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || !(e.buttons & 1)) return
    const key = `${labelX}-${labelY}`

    // 既に選択済みのセルは処理しない
    if (selectedCells[key]) return

    setSelectedCells((prev) => ({ ...prev, [key]: true }))

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  const handleClick = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "tap") return

    // セレクトボックスをクリックした場合は選択処理をスキップ
    if ((e.target as HTMLElement).closest(".select-trigger")) return

    const key = `${labelX}-${labelY}`
    setSelectedCells((prev) => {
      const newCells = { ...prev }
      if (newCells[key]) delete newCells[key]
      else newCells[key] = true
      return newCells
    })

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse select-none">
        <thead>
          <tr>
            <th className="border p-2"></th>
            {xAxis.map((labelX) => (
              <th
                key={labelX}
                className="border p-2 text-center cursor-pointer hover:bg-blue-50"
                onClick={() => onSelectColumn(labelX)}
              >
                {labelX}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yAxis.map((labelY) => (
            <tr key={labelY}>
              <td
                className="border p-2 text-center font-medium cursor-pointer hover:bg-blue-50"
                onClick={() => onSelectRow(labelY)}
              >
                {labelY}
              </td>
              {xAxis.map((labelX) => {
                const key = `${labelX}-${labelY}`
                const isSelected = !!selectedCells[key]
                const value = schedule[key]

                return (
                  <td
                    key={key}
                    className={`border p-4 ${isSelected ? "bg-blue-200" : ""} cursor-pointer`}
                    onMouseDown={(e) => handleMouseDown(labelX, labelY, e)}
                    onMouseEnter={(e) => handleMouseEnter(labelX, labelY, e)}
                    onClick={(e) => handleClick(labelX, labelY, e)}
                  >
                    <Select value={value} onValueChange={(v) => updateSchedule(labelX, labelY, v)}>
                      <SelectTrigger
                        className={`w-full select-trigger h-8 min-h-0 px-2 py-1 ${
                          scheduleTypes.find((t) => t.id === value)?.color || ""
                        }`}
                      >
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
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
  )
}
