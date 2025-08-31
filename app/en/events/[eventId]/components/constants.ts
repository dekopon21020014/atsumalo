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

// Default group/role options
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

export const recurringTemplates = [
  { name: "Weekdays (Mon–Fri)", x: ["Mon", "Tue", "Wed", "Thu", "Fri"], y: ["1", "2", "3", "4", "5"] },
  { name: "Including Weekend (Mon–Sun)", x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], y: ["1", "2", "3", "4", "5"] },
  { name: "Time Slots (Morning/Afternoon)", x: ["Mon", "Tue", "Wed", "Thu", "Fri"], y: ["Morning", "Afternoon", "Evening", "Night"] },
]

export const onetimeTemplates = [
  {
    name: "Weekday Evenings",
    options: ["5/1(Mon) 19:00", "5/2(Tue) 19:00", "5/3(Wed) 19:00", "5/4(Thu) 19:00", "5/5(Fri) 19:00"],
  },
  {
    name: "Weekend",
    options: ["5/6(Sat) 10:00", "5/6(Sat) 14:00", "5/7(Sun) 10:00", "5/7(Sun) 14:00"],
  },
  {
    name: "Next Weekdays",
    options: ["5/8(Mon) 19:00", "5/9(Tue) 19:00", "5/10(Wed) 19:00", "5/11(Thu) 19:00", "5/12(Fri) 19:00"],
  },
]

export const scheduleTypeTemplate = [
  { id: "available", label: "Available", color: "bg-green-200 text-green-800", isAvailable: true },
  { id: "social", label: "🐈", color: "bg-blue-200 text-blue-800", isAvailable: false },
  { id: "not-yet", label: "Undecided (△)", color: "bg-yellow-200 text-yellow-800", isAvailable: false },
  { id: "class", label: "Class", color: "bg-purple-200 text-purple-800", isAvailable: false },
  { id: "ta", label: "TA", color: "bg-teal-200 text-teal-800", isAvailable: false },
  { id: "unavailable", label: "Unavailable", color: "bg-red-200 text-red-800", isAvailable: false },
  { id: "parttime", label: "Part-time", color: "bg-orange-200 text-orange-800", isAvailable: false },
]

export const xAxisTemplate = ["Mon", "Tue", "Wed", "Thu", "Fri"]
export const yAxisTemplate = ["1", "2", "3", "4", "5"]
