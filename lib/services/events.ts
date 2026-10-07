import { db, FieldValue } from "@/lib/firebase"
import { hashPassword } from "@/lib/password-utils"
import { authorizeEventAccess } from "@/lib/auth/authorize-event"
import { defaultGradeOptions, defaultGradeOrder } from "@/lib/constants"
import { randomUUID } from "crypto"
import { NextRequest } from "next/server"

type EventCreatePayload = {
  name: string
  description?: string
  eventType: "recurring" | "onetime"
  scheduleTypes: { id: string; label: string; color: string; isAvailable: boolean }[]
  gradeOptions?: string[] | null
  gradeOrder?: Record<string, number> | null
  createdAt?: Date
  password?: string | null
  xAxis?: string[]
  yAxis?: string[]
  dateTimeOptions?: string[]
}

export async function createEventService(data: EventCreatePayload) {
  const {
    name,
    description,
    eventType,
    xAxis,
    yAxis,
    dateTimeOptions,
    scheduleTypes,
    gradeOptions,
    gradeOrder,
    password,
  } = data

  const grades = gradeOptions && gradeOptions.length > 0 ? gradeOptions : defaultGradeOptions
  const order = gradeOrder && Object.keys(gradeOrder).length > 0 ? gradeOrder : defaultGradeOrder

  const pass = typeof password === "string" ? password.trim() : ""
  const passwordHash = pass ? await hashPassword(pass) : ""

  const payload: any = {
    name,
    description: description || "",
    eventType,
    scheduleTypes,
    gradeOptions: grades,
    gradeOrder: order,
    createdAt: new Date(),
    ...(passwordHash ? { password: passwordHash } : {}),
  }

  if (eventType === "recurring") {
    payload.xAxis = xAxis || []
    payload.yAxis = yAxis || []
  } else {
    payload.dateTimeOptions = dateTimeOptions || []
  }

  const docRef = await db.collection("events").add(payload)
  return docRef.id
}

type ParticipantPayload = {
  eventId: string
  name: string
  grade: string
  gradePriority?: number
  schedule: Record<string, string> | { dateTime: string; typeId: string }[]
  comment?: string | null
}

export async function submitAnswerService(req: NextRequest | { headers: Headers }, data: ParticipantPayload) {
  const { eventId, name, grade, gradePriority, schedule, comment: rawComment } = data

  const reqObj = 'nextUrl' in req ? req : {
    headers: req.headers,
    nextUrl: new URL(`http://localhost/api/events/${eventId}`)
  } as any as NextRequest;

  const authResult = await authorizeEventAccess(reqObj, eventId)
  if ('response' in authResult) {
    throw new Error('Unauthorized or Event Not Found') // Caller can handle this
  }

  let comment = ''
  if (rawComment != null) {
    const trimmed = rawComment.trim()
    if (trimmed !== '') {
      comment = trimmed
    }
  }

  const participantsRef = authResult.eventSnap.ref.collection('participants')

  const participantData: Record<string, unknown> = {
    name,
    grade,
    schedule,
    comment,
    createdAt: FieldValue.serverTimestamp(),
  }

  const editToken = authResult.requireParticipantToken ? randomUUID() : ''
  if (editToken) {
    participantData.editToken = editToken
  }

  const docRef = await participantsRef.add(participantData)

  const eventRef = db.collection('events').doc(eventId)
  const eventUpdatePayload: any = {
    gradeOptions: FieldValue.arrayUnion(grade)
  }
  if (gradePriority != null) {
    eventUpdatePayload[`gradeOrder.${grade}`] = gradePriority
  }
  await eventRef.update(eventUpdatePayload)

  return { id: docRef.id, editToken }
}
