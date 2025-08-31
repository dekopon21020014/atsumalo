"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { ScheduleType } from "@/app/events/[eventId]/components/constants"

type AnalyticsResponse = {
  id: string
  name: string
  grade?: string
  schedule: { typeId: string }[]
}

export default function AnalyticsPage() {
  const { eventId } = useParams()
  const [eventName, setEventName] = useState("読み込み中...")
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>([])
  const [responses, setResponses] = useState<AnalyticsResponse[]>([])
  const [gradeOptions, setGradeOptions] = useState<string[]>([])

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEventName(data.name || "")
        setScheduleTypes(Array.isArray(data.scheduleTypes) ? data.scheduleTypes : [])
        setGradeOptions(Array.isArray(data.gradeOptions) ? data.gradeOptions : [])
        setResponses(
          Array.isArray(data.participants)
            ? data.participants.map((p: any) => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
                // Firestore may store schedule as an object keyed by slot id
                // or as an array. Normalize to an array to simplify later
                // aggregation and avoid runtime errors when calling forEach.
                schedule: Array.isArray(p.schedule)
                  ? p.schedule.map((s: any) => ({ typeId: s.typeId }))
                  : Object.values(p.schedule || {}).map((typeId: string) => ({ typeId })),
              }))
            : [],
        )
      })
  }, [eventId])

  const scheduleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    scheduleTypes.forEach((t) => {
      counts[t.id] = 0
    })
    responses.forEach((r) => {
      r.schedule.forEach((s) => {
        const typeId = typeof s === "string" ? s : s.typeId
        if (typeId) {
          counts[typeId] = (counts[typeId] || 0) + 1
        }
      })
    })
    return scheduleTypes.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] || 0 }))
  }, [scheduleTypes, responses])

  const pieColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  const pieConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    scheduleCounts.forEach((sc, idx) => {
      config[sc.id] = { label: sc.label, color: pieColors[idx % pieColors.length] }
    })
    return config
  }, [scheduleCounts])

  const pieData = useMemo(
    () =>
      scheduleCounts.map((sc) => ({
        scheduleType: sc.id,
        count: sc.count,
      })),
    [scheduleCounts],
  )

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    responses.forEach((r) => {
      const g = r.grade || "Others"
      counts[g] = (counts[g] || 0) + 1
    })
    return counts
  }, [responses])

  const gradeData = useMemo(
    () =>
      gradeOptions.map((g) => ({
        grade: g,
        count: gradeCounts[g] || 0,
      })),
    [gradeCounts, gradeOptions],
  )

  const barConfig = { count: { label: "人数", color: "hsl(var(--chart-1))" } }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{eventName}の統計</h1>

      <Card>
        <CardHeader>
          <CardTitle>スケジュールタイプ別の集計</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="scheduleType" />} />
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="scheduleType"
                innerRadius={60}
                stroke="none"
              >
                {pieData.map((item) => (
                  <Cell
                    key={item.scheduleType}
                    fill={`var(--color-${item.scheduleType})`}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="scheduleType" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>所属/役職別参加人数</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="h-[300px] w-full">
            <BarChart data={gradeData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="grade"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

