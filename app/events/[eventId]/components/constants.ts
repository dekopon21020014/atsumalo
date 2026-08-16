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
  comment?: string
  schedule: {
    dateTime: string
    typeId: string
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
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
}

// スケジュールの種類と対応する表示色など
export const scheduleTypes = [
    { id: "available", label: "可能", color: "bg-green-200 text-green-800" },
    { id: "social", label: "🐈", color: "bg-blue-200 text-blue-800" },
    { id: "not-yet", label: "未定", color: "bg-yellow-200 text-yellow-800" },
    { id: "class", label: "授業", color: "bg-purple-200 text-purple-800" },
    { id: "ta", label: "TA", color: "bg-teal-200 text-teal-800" },
    { id: "unavailable", label: "不可", color: "bg-red-200 text-red-800" },
    { id: "parttime", label: "バイト", color: "bg-orange-200 text-orange-800" },
]

// 曜日と時限の定義
export const days = ["月", "火", "水", "木", "金"]
export const periods = [1, 2, 3, 4, 5]

// 所属/役職のデフォルト値
export const defaultGradeOptions = [
  'Teacher',
  'Dr',
  'M2',
  'M1',
  'B4',
  'B3',
  'B2',
  'B1',
  'Others',
]

export const defaultGradeOrder: { [key: string]: number } = {
  Teacher: 1,
  Dr: 2,
  M2: 3,
  M1: 4,
  B4: 5,
  B3: 6,
  B2: 7,
  B1: 8,
  Others: 9,
}

export const colorPalettes = [
  { bg: "bg-gray-100", text: "text-gray-800", name: "薄灰" },
  { bg: "bg-gray-300", text: "text-gray-900", name: "灰" },
  { bg: "bg-gray-500", text: "text-white", name: "濃灰" },
  { bg: "bg-red-200", text: "text-red-800", name: "赤" },
  { bg: "bg-yellow-200", text: "text-yellow-800", name: "黄" },
  { bg: "bg-green-200", text: "text-green-800", name: "緑" },
  { bg: "bg-blue-200", text: "text-blue-800", name: "青" },
  { bg: "bg-purple-200", text: "text-purple-800", name: "紫" },
  { bg: "bg-pink-200", text: "text-pink-800", name: "桃" },
  { bg: "bg-teal-200", text: "text-teal-800", name: "ティール" },
  { bg: "bg-orange-200", text: "text-orange-800", name: "橙" },
]

export const recurringTemplates = [
  { name: "平日（月〜金）", x: ["月", "火", "水", "木", "金"], y: ["1", "2", "3", "4", "5"] },
  { name: "週末含む（月〜日）", x: ["月", "火", "水", "木", "金", "土", "日"], y: ["1", "2", "3", "4", "5"] },
  { name: "時間帯（午前/午後）", x: ["月", "火", "水", "木", "金"], y: ["午前", "午後", "夕方", "夜"] },
]

export const getOnetimeTemplates = () => {
  const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"]
  const getFormattedDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEK_DAYS[date.getDay()]}）`
  }

  const today = new Date()

  // 1. 直近の平日 (明日以降の平日5日間)
  const next5Weekdays = []
  let curr = new Date(today)
  curr.setDate(curr.getDate() + 1)
  while (next5Weekdays.length < 5) {
    const dow = curr.getDay()
    if (dow !== 0 && dow !== 6) {
      next5Weekdays.push(getFormattedDate(curr))
    }
    curr.setDate(curr.getDate() + 1)
  }

  // 2. 直近の週末 (次の土日)
  const daysUntilSat = (6 - today.getDay() + 7) % 7
  const nextSat = new Date(today)
  nextSat.setDate(today.getDate() + daysUntilSat)
  const nextSun = new Date(nextSat)
  nextSun.setDate(nextSat.getDate() + 1)

  // 3. 来週の平日 (次の月曜日から金曜日)
  const daysUntilNextMon = (1 - today.getDay() + 7) % 7 || 7
  const nextMon = new Date(today)
  nextMon.setDate(today.getDate() + daysUntilNextMon)
  const nextWeekWeekdays = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(nextMon)
    d.setDate(nextMon.getDate() + i)
    nextWeekWeekdays.push(getFormattedDate(d))
  }

  return [
    {
      name: "平日",
      options: next5Weekdays,
    },
    {
      name: "週末",
      options: [
        getFormattedDate(nextSat),
        getFormattedDate(nextSun),
      ],
    },
    {
      name: "来週平日",
      options: nextWeekWeekdays,
    },
  ]
}

export const scheduleTypeTemplate = [
    { id: "available", label: "可能", color: "bg-green-200 text-green-800", isAvailable: true },
    { id: "social", label: "🐈", color: "bg-blue-200 text-blue-800", isAvailable: false },
    { id: "not-yet", label: "未定(△)", color: "bg-yellow-200 text-yellow-800", isAvailable: false },
    { id: "class", label: "授業", color: "bg-purple-200 text-purple-800", isAvailable: false },
    { id: "ta", label: "TA", color: "bg-teal-200 text-teal-800", isAvailable: false },
    { id: "unavailable", label: "不可", color: "bg-red-200 text-red-800", isAvailable: false },
    { id: "parttime", label: "バイト", color: "bg-orange-200 text-orange-800", isAvailable: false },
]

export const xAxisTemplate = ["月", "火", "水", "木", "金"]
export const yAxisTemplate = ["1", "2", "3", "4", "5"]
