"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { scheduleTypes, days, periods } from "./constants"

type Props = {
  schedule: { [key: string]: string }
  updateSchedule: (day: string, period: number, value: string) => void
  selectedCells: { [key: string]: boolean }
  setSelectedCells: (cells: { [key: string]: boolean }) => void
  selectionMode: "tap" | "drag"
}

export default function ScheduleTable({
  schedule,
  updateSchedule,
  selectedCells,
  setSelectedCells,
  selectionMode,
}: Props) {
  const handleMouseDown = (day: string, period: number, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || e.button !== 0) return
    const key = `${day}-${period}`
    setSelectedCells({ [key]: true })
  }

  const handleMouseEnter = (day: string, period: number, e: React.MouseEvent) => {
    if (selectionMode !== "drag" || !(e.buttons & 1)) return
    const key = `${day}-${period}`
    setSelectedCells((prev) => ({ ...prev, [key]: true }))
  }

  const handleClick = (day: string, period: number) => {
    if (selectionMode !== "tap") return
    const key = `${day}-${period}`
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
            {days.map((day) => (
              <th key={day} className="border p-2 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period}>
              <td className="border p-2 text-center font-medium">{period}限</td>
              {days.map((day) => {
                const key = `${day}-${period}`
                const isSelected = !!selectedCells[key]
                const value = schedule[key]

                return (
                  <td
                    key={key}
                    className={`border p-2 ${isSelected ? "bg-blue-200" : ""}`}
                    onMouseDown={(e) => handleMouseDown(day, period, e)}
                    onMouseEnter={(e) => handleMouseEnter(day, period, e)}
                    onClick={() => handleClick(day, period)}
                  >
                    <Select value={value} onValueChange={(v) => updateSchedule(day, period, v)}>
                      <SelectTrigger
                        className={`w-full ${
                          scheduleTypes.find((t) => t.id === value)?.color || ""
                        }`}
                      >
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">未選択</SelectItem>
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
