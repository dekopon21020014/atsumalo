// app/events/[eventId]/components/utils.ts
import type { Schedule } from './types'

export type EventAccess = {
  password?: string
  token?: string
}

export function buildEventAuthHeaders(access?: EventAccess) {
  const headers: Record<string, string> = {}
  if (access?.password) headers['x-event-password'] = access.password
  if (access?.token) headers['x-event-token'] = access.token
  return headers
}

const PARTICIPANT_TOKEN_PREFIX = 'event_participant_tokens_'

function getParticipantTokenKey(eventId: string) {
  return `${PARTICIPANT_TOKEN_PREFIX}${eventId}`
}

function readParticipantTokenStore(eventId: string) {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(getParticipantTokenKey(eventId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      )
    }
  } catch (err) {
    console.warn('failed to parse participant token store', err)
  }
  return {}
}

function writeParticipantTokenStore(eventId: string, store: Record<string, string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getParticipantTokenKey(eventId), JSON.stringify(store))
}

export function storeParticipantToken(eventId: string, participantId: string, token: string) {
  if (!eventId || !participantId || !token) return
  const store = readParticipantTokenStore(eventId)
  store[participantId] = token
  writeParticipantTokenStore(eventId, store)
}

export function getParticipantToken(eventId: string, participantId: string) {
  if (!eventId || !participantId) return ''
  const store = readParticipantTokenStore(eventId)
  const token = store[participantId]
  return typeof token === 'string' ? token : ''
}

export function removeParticipantToken(eventId: string, participantId: string) {
  if (!eventId || !participantId) return
  const store = readParticipantTokenStore(eventId)
  if (!(participantId in store)) return
  delete store[participantId]
  writeParticipantTokenStore(eventId, store)
}

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
