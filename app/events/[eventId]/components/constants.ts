// スケジュールの種類と対応する表示色など
export const scheduleTypes = [
    { id: "class", label: "授業", color: "bg-red-100 text-red-800" },
    { id: "parttime", label: "バイト", color: "bg-blue-100 text-blue-800" },
    { id: "ta", label: "TA", color: "bg-purple-100 text-purple-800" },
    { id: "available", label: "可能", color: "bg-green-100 text-green-800" },
    { id: "unavailable", label: "不可", color: "bg-gray-100 text-gray-800" },
]

// 曜日と時限の定義
export const days = ["月", "火", "水", "木", "金"]
export const periods = [1, 2, 3, 4, 5]
export const gradeOptions = [
  'Teacher',
  'M2',
  'M1',
  'B4',
  'B3',
  'B2',
  'B1',
  'Other',
]

export const colorPalettes = [
  { bg: "bg-red-100", text: "text-red-800", name: "赤" },
  { bg: "bg-pink-100", text: "text-pink-800", name: "ピンク" },
  { bg: "bg-orange-100", text: "text-orange-800", name: "オレンジ" },
  { bg: "bg-amber-100", text: "text-amber-800", name: "琥珀" },
  { bg: "bg-yellow-100", text: "text-yellow-800", name: "黄" },
  { bg: "bg-lime-100", text: "text-lime-800", name: "ライム" },
  { bg: "bg-green-100", text: "text-green-800", name: "緑" },
  { bg: "bg-emerald-100", text: "text-emerald-800", name: "エメラルド" },
  { bg: "bg-teal-100", text: "text-teal-800", name: "ティール" },
  { bg: "bg-cyan-100", text: "text-cyan-800", name: "シアン" },
  { bg: "bg-sky-100", text: "text-sky-800", name: "スカイ" },
  { bg: "bg-blue-100", text: "text-blue-800", name: "青" },
  { bg: "bg-indigo-100", text: "text-indigo-800", name: "インディゴ" },
  { bg: "bg-violet-100", text: "text-violet-800", name: "バイオレット" },
  { bg: "bg-purple-100", text: "text-purple-800", name: "紫" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-800", name: "フクシア" },
  { bg: "bg-gray-100", text: "text-gray-800", name: "グレー" },
  { bg: "bg-slate-100", text: "text-slate-800", name: "スレート" },
]

export type ScheduleType = {
  id: string
  label: string
  color: string
  isAvailable: boolean
}