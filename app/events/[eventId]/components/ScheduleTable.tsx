"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScheduleType } from "@/app/events/[eventId]/components/constants"
import type { Schedule } from './types'

export type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  schedule: Schedule
  updateSchedule: (labelX: string, labelY: string, value: string) => void
  selectedCells: Record<string, boolean>
  setSelectedCells: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  selectionMode: 'tap' | 'drag'
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
}: Props) {
  const handleMouseDown = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || e.button !== 0) return
    const key = `${labelX}-${labelY}`
    setSelectedCells({ [key]: true })
  }

  const handleMouseEnter = (labelX: string, labelY: string, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || !(e.buttons & 1)) return
    const key = `${labelX}-${labelY}`
    setSelectedCells((prev) => ({ ...prev, [key]: true }))
  }

  const handleClick = (labelX: string, labelY: string) => {
    if (selectionMode !== "tap") return
    const key = `${labelX}-${labelY}`
    setSelectedCells((prev) => {
      const newCells = { ...prev }
      if (newCells[key]) delete newCells[key]
      else newCells[key] = true
      return newCells
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse select-none">
        <thead>
          <tr>
            <th className="border p-2"></th>
            {xAxis.map((labelX) => (
              <th key={labelX} className="border p-2 text-center">
                {labelX}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yAxis.map((labelY) => (
            <tr key={labelY}>
              <td className="border p-2 text-center font-medium">
                {labelY}
              </td>
              {xAxis.map((labelX) => {
                const key = `${labelX}-${labelY}`
                const isSelected = !!selectedCells[key]
                const value = schedule[key]

                return (
                  <td
                    key={key}
                    className={`border p-2 ${isSelected ? "bg-blue-200" : ""}`}
                    onMouseDown={(e) => handleMouseDown(labelX, labelY, e)}
                    onMouseEnter={(e) => handleMouseEnter(labelX, labelY, e)}
                    onClick={() => handleClick(labelX, labelY)}
                  >
                    <Select
                      value={value}
                      onValueChange={(v) => updateSchedule(labelX, labelY, v)}
                    >
                      <SelectTrigger
                        className={`w-full ${
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
