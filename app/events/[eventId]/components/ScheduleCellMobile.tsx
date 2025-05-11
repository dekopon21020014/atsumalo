"use client"
import { scheduleTypes } from "./constants"

type Props = {
  day: string
  period: string
  value: string
  selected: boolean
  onTap: () => void
}

export default function ScheduleCellMobile({ day, period, value, selected, onTap }: Props) {
  const scheduleType = scheduleTypes.find((t) => t.id === value)

  return (
    <div
      className={
        `
        w-full h-12 flex items-center justify-center rounded border
        ${selected ? "bg-blue-200 border-blue-400" : "border-gray-200"}
        ${scheduleType?.color || ""}
        transition-colors text-xs font-medium text-center
      `
      }
      onClick={onTap}
      data-day={day}
      data-period={period}
    >
      {scheduleType ? (
        scheduleType.label
      ) : (
        <span className="text-gray-400">タップ</span>
      )}
    </div>
  )
}
