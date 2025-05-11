"use client"

import type React from "react"
import type { ScheduleType } from "@/app/events/[eventId]/components/constants"
import type { Schedule } from "./types"
import { Plus } from "lucide-react"

export type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  schedule: Schedule
  updateSchedule: (labelX: string, labelY: string, value: string) => void
  selectionMode: "tap" | "drag"
  bulkScheduleType: string
}

export default function ScheduleTable({
  xAxis,
  yAxis,
  scheduleTypes,
  schedule,
  updateSchedule,
  selectionMode,
  bulkScheduleType,
}: Props) {
  const handleMouseDown = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || e.button !== 0) return

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  const handleMouseEnter = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || !(e.buttons & 1)) return

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  const handleClick = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "tap") return

    // バルク選択タイプが設定されている場合は即時適用
    if (bulkScheduleType) {
      updateSchedule(labelX, labelY, bulkScheduleType)
    }
  }

  // セルの内容を表示するヘルパー関数
  const getCellContent = (value: string) => {
    if (!value) return null // 空の場合はnullを返す

    const scheduleType = scheduleTypes.find((type) => type.id === value)
    return scheduleType ? scheduleType.label : null
  }

  // セルの背景色クラスを取得するヘルパー関数
  const getCellColorClass = (value: string) => {
    if (!value) return ""

    const scheduleType = scheduleTypes.find((type) => type.id === value)
    return scheduleType ? scheduleType.color : ""
  }

  // 列（曜日）を全選択
  const onSelectColumn = (labelX: string) => {
    yAxis.forEach((labelY) => {
      updateSchedule(labelX, labelY, bulkScheduleType)
    })
  }

  // 行（時限）を全選択
  const onSelectRow = (labelY: string) => {
    xAxis.forEach((labelX) => {
      updateSchedule(labelX, labelY, bulkScheduleType)
    })
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
                className="border p-2 text-center cursor-pointer hover:bg-blue-50 transition-colors duration-150"
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
                className="border p-2 text-center font-medium cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                onClick={() => onSelectRow(labelY)}
              >
                {labelY}
              </td>
              {xAxis.map((labelX) => {
                const key = `${labelX}-${labelY}`
                const value = schedule[key]
                const cellContent = getCellContent(value)
                const cellColorClass = getCellColorClass(value)

                return (
                  <td
                    key={key}
                    className={`
                      border p-3 text-center relative
                      
                      ${cellColorClass || "hover:bg-gray-50"}
                      cursor-pointer
                      transition-all duration-150
                      ${!cellContent ? "hover:bg-blue-50" : "hover:opacity-90"}
                      ${bulkScheduleType && !cellContent ? "hover:bg-blue-100" : ""}
                    `}
                    onMouseDown={(e) => handleMouseDown(labelX, labelY, e)}
                    onMouseEnter={(e) => handleMouseEnter(labelX, labelY, e)}
                    onClick={(e) => handleClick(labelX, labelY, e)}
                  >
                    {cellContent ? (
                      <span className="font-medium">{cellContent}</span>
                    ) : (
                      <div className="flex items-center justify-center text-gray-400 group">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
                          <Plus className="h-3 w-3 mr-1" />
                          <span className="text-xs">クリックして入力</span>
                        </span>
                      </div>
                    )}
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
