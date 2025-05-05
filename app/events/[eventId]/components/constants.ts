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
  