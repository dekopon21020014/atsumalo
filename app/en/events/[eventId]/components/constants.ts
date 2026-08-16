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

// Schedule type definitions with colors
export const scheduleTypes = [
  { id: "available", label: "Available", color: "bg-green-200 text-green-800" },
  { id: "social", label: "🐈", color: "bg-blue-200 text-blue-800" },
  { id: "not-yet", label: "Undecided", color: "bg-yellow-200 text-yellow-800" },
  { id: "class", label: "Class", color: "bg-purple-200 text-purple-800" },
  { id: "ta", label: "TA", color: "bg-teal-200 text-teal-800" },
  { id: "unavailable", label: "Unavailable", color: "bg-red-200 text-red-800" },
  { id: "parttime", label: "Part-time", color: "bg-orange-200 text-orange-800" },
]

// Day and period definitions
export const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
export const periods = [1, 2, 3, 4, 5]

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

// Grade/Role Templates
export const gradeTemplates = [
  {
    name: "University",
    options: [
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
  },
  {
    name: "General",
    options: [
      'Professional',
      'Student',
      'Other',
    ]
  }
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
  Professional: 9,
  Student: 10,
  Others: 11,
  Other: 12,
}

export const colorPalettes = [
  { bg: "bg-gray-100", text: "text-gray-800", name: "Light Gray" },
  { bg: "bg-gray-300", text: "text-gray-900", name: "Gray" },
  { bg: "bg-gray-500", text: "text-white", name: "Dark Gray" },
  { bg: "bg-red-200", text: "text-red-800", name: "Red" },
  { bg: "bg-yellow-200", text: "text-yellow-800", name: "Yellow" },
  { bg: "bg-green-200", text: "text-green-800", name: "Green" },
  { bg: "bg-blue-200", text: "text-blue-800", name: "Blue" },
  { bg: "bg-purple-200", text: "text-purple-800", name: "Purple" },
  { bg: "bg-pink-200", text: "text-pink-800", name: "Pink" },
  { bg: "bg-teal-200", text: "text-teal-800", name: "Teal" },
  { bg: "bg-orange-200", text: "text-orange-800", name: "Orange" },
]

export const xAxisTemplates = [
  { name: "Weekdays (Mon-Fri)", options: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { name: "Including Weekends (Mon-Sun)", options: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { name: "Weekends Only", options: ["Sat", "Sun"] },
]

export const yAxisTemplates = [
  { name: "Periods (1-5)", options: ["1", "2", "3", "4", "5"] },
  { name: "Time of Day (Morning/Afternoon)", options: ["Morning", "Afternoon", "Evening", "Night"] },
]

export const getOnetimeTemplates = () => {
  const MONTH_NAMES_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return "th"
    switch (n % 10) {
      case 1:  return "st"
      case 2:  return "nd"
      case 3:  return "rd"
      default: return "th"
    }
  }
  const getFormattedDateEn = (date: Date) => {
    return `${MONTH_NAMES_SHORT_EN[date.getMonth()]} ${date.getDate()}${getOrdinal(date.getDate())}`
  }

  const today = new Date()

  // 1. Next Weekdays (Next 5 Weekdays starting from tomorrow)
  const next5Weekdays = []
  let curr = new Date(today)
  curr.setDate(curr.getDate() + 1)
  while (next5Weekdays.length < 5) {
    const dow = curr.getDay()
    if (dow !== 0 && dow !== 6) {
      next5Weekdays.push(getFormattedDateEn(curr))
    }
    curr.setDate(curr.getDate() + 1)
  }

  // 2. Next Weekend (Next Sat and Sun)
  const daysUntilSat = (6 - today.getDay() + 7) % 7
  const nextSat = new Date(today)
  nextSat.setDate(today.getDate() + daysUntilSat)
  const nextSun = new Date(nextSat)
  nextSun.setDate(nextSat.getDate() + 1)

  // 3. Next Week's Weekdays (Next week's Monday to Friday)
  const daysUntilNextMon = (1 - today.getDay() + 7) % 7 || 7
  const nextMon = new Date(today)
  nextMon.setDate(today.getDate() + daysUntilNextMon)
  const nextWeekWeekdays = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(nextMon)
    d.setDate(nextMon.getDate() + i)
    nextWeekWeekdays.push(getFormattedDateEn(d))
  }

  return [
    {
      name: "Weekdays",
      options: next5Weekdays,
    },
    {
      name: "Weekend",
      options: [
        getFormattedDateEn(nextSat),
        getFormattedDateEn(nextSun),
      ],
    },
    {
      name: "Next Weekdays",
      options: nextWeekWeekdays,
    },
  ]
}

export const scheduleTypeTemplates = [
  {
    name: "University",
    options: [
      { id: "available", label: "Available", color: "bg-green-200 text-green-800", isAvailable: true },
      { id: "social", label: "🐈", color: "bg-blue-200 text-blue-800", isAvailable: false },
      { id: "not-yet", label: "Undecided (△)", color: "bg-yellow-200 text-yellow-800", isAvailable: false },
      { id: "class", label: "Class", color: "bg-purple-200 text-purple-800", isAvailable: false },
      { id: "ta", label: "TA", color: "bg-teal-200 text-teal-800", isAvailable: false },
      { id: "unavailable", label: "Unavailable", color: "bg-red-200 text-red-800", isAvailable: false },
      { id: "parttime", label: "Part-time", color: "bg-orange-200 text-orange-800", isAvailable: false },
    ]
  },
  {
    name: "Simple (◯/△/✕)",
    options: [
      { id: "available", label: "◯ (Available)", color: "bg-green-200 text-green-800", isAvailable: true },
      { id: "maybe", label: "△ (Maybe)", color: "bg-yellow-200 text-yellow-800", isAvailable: false },
      { id: "unavailable", label: "✕ (Unavailable)", color: "bg-red-200 text-red-800", isAvailable: false },
    ]
  }
]

export const xAxisTemplate = ["Mon", "Tue", "Wed", "Thu", "Fri"]
export const yAxisTemplate = ["1", "2", "3", "4", "5"]
