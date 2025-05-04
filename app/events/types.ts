// 1人分のスケジュール（曜日-時限のキーに対して予定の値を持つ）
export type Schedule = {
    [key: string]: string
  }
  
  // 参加者のデータ構造
  export type Participant = {
    id: string
    name: string
    schedule: Schedule
  }
  