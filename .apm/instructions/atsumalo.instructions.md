---
description: Guide for using Atsumalo scheduling MCP tools
---

# Atsumalo MCP Guide

Atsumalo (あつま郎) is an event and schedule coordination tool.
You can create events and submit availability using the Atsumalo MCP tools.

## Tools

### 1. `create_event`
Creates a new scheduling event.
- `name` (required): Event title.
- `eventType` (required):
  - `"recurring"`: For weekly schedules (e.g. regular meetings, seminar times).
  - `"onetime"`: For specific date/time options.
- `scheduleTypes` (required): Array of available answer choices.
  Example:
  ```json
  [
    { "id": "available", "label": "○", "color": "bg-green-100 text-green-800", "isAvailable": true },
    { "id": "maybe", "label": "△", "color": "bg-yellow-100 text-yellow-800", "isAvailable": true },
    { "id": "unavailable", "label": "×", "color": "bg-red-100 text-red-800", "isAvailable": false }
  ]
  ```
- If `eventType: "recurring"`:
  - `xAxis`: Array of column labels, e.g. `["月", "火", "水", "木", "金"]`.
  - `yAxis`: Array of row labels, e.g. `["1限", "2限", "3限", "4限", "5限"]`.
- If `eventType: "onetime"`:
  - `dateTimeOptions`: Array of candidate dates/times, e.g. `["10/15(火) 19:00", "10/16(水) 19:00"]`.
- `password` (optional): Set if the event needs password protection.
- `gradeOptions` (optional): Roles/grades (e.g. `["B4", "M1", "M2", "Dr", "Teacher"]`).

**Response:**
Returns the event ID. Inform the user of the URL:
`https://atsumalo.vercel.app/events/<eventId>`

---

### 2. `submit_answer`
Submits availability for a participant.
- `eventId` (required): Target event ID.
- `name` (required): Participant name.
- `grade` (required): Participant role or grade.
- `schedule` (required):
  - For `recurring`: Record/map of `"<xAxis>-<yAxis>": "<scheduleTypeId>"`, e.g. `{"月-1限": "available", "火-2限": "maybe"}`.
  - For `onetime`: Array of `{ "dateTime": string, "typeId": string }`.
- `comment` (optional): Participant comment.
- `eventPassword` (optional): Required if the event is password-protected.
- `eventToken` (optional): Required if the event requires an access token.

**Response:**
Returns the Participant ID and an `editToken` (if required).
Share the `editToken` with the user so they can update or delete their response later if needed.
