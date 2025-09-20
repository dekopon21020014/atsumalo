"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const [eventName, setEventName] = useState("読み込み中...")
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>([])
  const [responses, setResponses] = useState<AnalyticsResponse[]>([])
  const [gradeOptions, setGradeOptions] = useState<string[]>([])

  useEffect(() => {
    if (!eventId) return
    let cancelled = false

    const load = async () => {
      try {
        const headers: Record<string, string> = {}
        if (typeof window !== "undefined") {
          const storedPassword = window.localStorage.getItem(`event_${eventId}_password`)
          if (storedPassword) headers["X-Event-Password"] = storedPassword
          const storedToken = window.localStorage.getItem("atsumalo_admin_token")
          if (storedToken) headers.Authorization = `Bearer ${storedToken}`
        }

        const res = await fetch(`/api/events/${eventId}`, { headers })
        if (res.status === 401) {
          if (!cancelled) {
            const message = isEnglish ? "Authentication required" : "認証が必要です"
            setEventName(message)
            setScheduleTypes([])
            setGradeOptions([])
            setResponses([])
          }
          return
        }

        const data = await res.json()
        if (!res.ok || data.error) {
          if (!cancelled) {
            const message = isEnglish ? "Failed to load event" : "イベントを読み込めませんでした"
            setEventName(message)
            setScheduleTypes([])
            setGradeOptions([])
            setResponses([])
          }
          return
        }

        if (cancelled) return

        setEventName(data.name || "")
        setScheduleTypes(Array.isArray(data.scheduleTypes) ? data.scheduleTypes : [])
        if (Array.isArray(data.gradeOptions)) {
          const order = data.gradeOrder || {}
          const sorted = [...data.gradeOptions].sort(
            (a: string, b: string) => (order[a] ?? 999) - (order[b] ?? 999)
          )
          setGradeOptions(sorted)
        } else {
          setGradeOptions([])
        }
        setResponses(
          Array.isArray(data.participants)
            ? data.participants.map((p: any) => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
                schedule: Array.isArray(p.schedule)
                  ? p.schedule.map((s: any) => ({ typeId: s.typeId }))
                  : Object.values(p.schedule || {}).map((typeId: string) => ({ typeId })),
              }))
            : [],
        )
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load analytics data", error)
          const message = isEnglish ? "Failed to load event" : "イベントを読み込めませんでした"
          setEventName(message)
          setScheduleTypes([])
          setGradeOptions([])
          setResponses([])
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [eventId, isEnglish])

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

