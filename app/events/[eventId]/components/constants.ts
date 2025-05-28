export type ScheduleType = {
  id: string
  label: string
  color: string
  isAvailable: boolean
}

export type Response = {
  id: string
  name: string
  grade?: string
  schedule: {
    dateTime: string
    typeId: string
    comment?: string
  }[]
}

export type EventData = {
  name: string
  description: string
  eventType: 'recurring' | 'onetime'
  xAxis: string[]
  yAxis: string[]
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  existingResponses: Response[]
}

// スケジュールの種類と対応する表示色など
export const scheduleTypes = [
    { id: "available", label: "可能", color: "bg-green-100 text-green-800" },
    { id: "not-yet", label: "未定", color: "bg-yellow-100 text-yellow-800" },
    { id: "class", label: "授業", color: "bg-red-100 text-red-800" },
    { id: "ta", label: "TA", color: "bg-purple-100 text-purple-800" },
    { id: "unavailable", label: "不可", color: "bg-gray-100 text-gray-800" },
    { id: "parttime", label: "バイト", color: "bg-blue-100 text-blue-800" },
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

export const gradeOrder: {[key: string]: number} = {
  'Teacher': 1,
  'Dr': 2,
  'M2': 3,
  'M1': 4,
  'B4': 5,
  'B3': 6,
  'B2': 7,
  'B1': 8,
  'Others': 9,
}

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

export const recurringTemplates = [
  { name: "平日（月〜金）", x: ["月", "火", "水", "木", "金"], y: ["1", "2", "3", "4", "5"] },
  { name: "週末含む（月〜日）", x: ["月", "火", "水", "木", "金", "土", "日"], y: ["1", "2", "3", "4", "5"] },
  { name: "時間帯（午前/午後）", x: ["月", "火", "水", "木", "金"], y: ["午前", "午後", "夕方", "夜"] },
]

export const onetimeTemplates = [
  {
    name: "平日夕方",
    options: ["5/1(月) 19:00", "5/2(火) 19:00", "5/3(水) 19:00", "5/4(木) 19:00", "5/5(金) 19:00"],
  },
  {
    name: "週末",
    options: ["5/6(土) 10:00", "5/6(土) 14:00", "5/7(日) 10:00", "5/7(日) 14:00"],
  },
  {
    name: "来週平日",
    options: ["5/8(月) 19:00", "5/9(火) 19:00", "5/10(水) 19:00", "5/11(木) 19:00", "5/12(金) 19:00"],
  },
]

export const scheduleTypeTamplate = [
    { id: "available", label: "可能", color: "bg-green-100 text-green-800", isAvailable: true },
    { id: "not-yet", label: "未定(△)", color: "bg-yellow-100 text-yellow-800", isAvailable: false },
    { id: "class", label: "授業", color: "bg-red-100 text-red-800", isAvailable: false },
    { id: "ta", label: "TA", color: "bg-purple-100 text-purple-800", isAvailable: false },
    { id: "unavailable", label: "不可", color: "bg-gray-100 text-gray-800", isAvailable: false },
    { id: "parttime", label: "バイト", color: "bg-blue-100 text-blue-800", isAvailable: false },
]

export const xAxisTamplate = ["月", "火", "水", "木", "金"]
export const yAxisTamplate = ["1", "2", "3", "4", "5"]
