// app/events/[eventId]/components/utils.ts
import type { Schedule } from './types'

/**
 * 横軸・縦軸のラベル一覧から、
 * key=`labelX-labelY` の空文字スケジュールを生成する
 */
export function createEmptySchedule(
  xAxis: string[],
  yAxis: string[],
  defaultTypeId = ''
): Schedule {
  const schedule: Schedule = {}
  xAxis.forEach((labelX) => {
    yAxis.forEach((labelY) => {
      schedule[`${labelX}-${labelY}`] = defaultTypeId
    })
  })
  return schedule
}
