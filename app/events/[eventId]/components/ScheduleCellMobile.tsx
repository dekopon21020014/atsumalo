"use client"

type Props = {
  day: string
  period: string
  value: string
  selected: boolean
  onTap: () => void
}

export default function ScheduleCellMobile({ day, period, value, selected, onTap }: Props) {
  return (
    <div className={`p-2 border rounded text-center ${selected ? "bg-blue-200" : "bg-white"}`} onClick={onTap}>
      <div className="text-xs">{day}</div>
      {value ? <div className="font-medium truncate">{value}</div> : <div className="text-gray-400">-</div>}
    </div>
  )
}

// 'use client'

// import { scheduleTypes } from "./constants"

// type Props = {
//   day: string
//   period: string  // 数字からラベル文字列に変更
//   value: string
//   selected: boolean
//   onTap: () => void
// }

// export default function ScheduleCellMobile({ day, period, value, selected, onTap }: Props) {
//   const scheduleType = scheduleTypes.find((t) => t.id === value)

//   return (
//     <div
//       className={
//         `
//         w-full h-12 flex items-center justify-center rounded border
//         ${selected ? "bg-blue-200 border-blue-400" : "border-gray-200"}
//         ${scheduleType?.color || ""}
//         transition-colors text-xs font-medium text-center
//       `
//       }
//       onClick={onTap}
//       data-day={day}
//       data-period={period}
//     >
//       {scheduleType ? (
//         scheduleType.label
//       ) : (
//         <span className="text-gray-400">タップ</span>
//       )}
//     </div>
//   )
// }
