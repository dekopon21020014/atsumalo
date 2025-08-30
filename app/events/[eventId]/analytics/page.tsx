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
import type {
  ScheduleType,
  Response,
} from "@/app/events/[eventId]/components/constants"
import { gradeOptions } from "@/app/events/[eventId]/components/constants"

export default function AnalyticsPage() {
  const { eventId } = useParams()
  const [eventName, setEventName] = useState("読み込み中...")
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>([])
  const [responses, setResponses] = useState<Response[]>([])

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEventName(data.name || "")
        setScheduleTypes(Array.isArray(data.scheduleTypes) ? data.scheduleTypes : [])
        setResponses(
          Array.isArray(data.participants)
            ? data.participants.map((p: any) => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
                schedule: p.schedule || [],
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
        counts[s.typeId] = (counts[s.typeId] || 0) + 1
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
    [gradeCounts],
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
          <CardTitle>学年別参加人数</CardTitle>
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

