import { days, periods } from "./constants"
import { Schedule } from "./types"

// 空のスケジュールデータを作成
export function createEmptySchedule(): Schedule {
  const schedule: Schedule = {}
  days.forEach((day) => {
    periods.forEach((period) => {
      schedule[`${day}-${period}`] = ""
    })
  })
  return schedule
}
