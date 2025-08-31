"use client"

import React, { useState, useMemo } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, GraduationCap, Clock, PieChart } from "lucide-react"
import type { ScheduleType, Response } from "./constants"

type Props = {
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  existingResponses: Response[]
  gradeOptions: string[]
  gradeOrder: { [key: string]: number }
}

export default function OneTimeSummaryTab({
  dateTimeOptions,
  scheduleTypes,
  existingResponses,
  gradeOptions,
  gradeOrder,
}: Props) {
  const [summaryView, setSummaryView] = useState<"dates" | "grades">("dates")
  const responses = Array.isArray(existingResponses) ? existingResponses : []

  // 指定日時の「参加可能」人数
  const getAvailableCount = (dateTime: string) =>
    responses.filter((response) => {
      const sel = response.schedule.find((s) => s.dateTime === dateTime)
      if (!sel) return false
      const type = scheduleTypes.find((t) => t.id === sel.typeId)
      return type?.isAvailable
    }).length

  // 指定日時・指定タイプに回答した人の名前リスト
  const getRespondentsByType = (dateTime: string, typeId: string) =>
    responses
      .filter((response) =>
        response.schedule.some((s) => s.dateTime === dateTime && s.typeId === typeId)
      )
      .map((r) => r.name)

  // 指定日時・指定タイプに回答した人数
  const getResponseCountByType = (dateTime: string, typeId: string) =>
    getRespondentsByType(dateTime, typeId).length

  // 指定所属/役職・指定日時の「参加可能」人数
  const getAvailableCountByGradeAndDateTime = (grade: string, dateTime: string) =>
    responses.filter((response) => {
      if (response.grade !== grade) return false
      const sel = response.schedule.find((s) => s.dateTime === dateTime)
      if (!sel) return false
      const type = scheduleTypes.find((t) => t.id === sel.typeId)
      return type?.isAvailable
    }).length

  // 指定所属/役職の回答タイプ分布
  const getResponseTypeDistributionByGrade = (grade: string) => {
    const dist: Record<string, number> = {}
    scheduleTypes.forEach((t) => (dist[t.id] = 0))
    responses
      .filter((r) => r.grade === grade)
      .forEach((r) =>
        r.schedule.forEach((s) => {
          if (dist[s.typeId] !== undefined) dist[s.typeId]++
        })
      )
    return dist
  }

  // 最適日時を取得
  const getBestDateTime = () => {
    if (!dateTimeOptions.length || !responses.length) return null
    let best = dateTimeOptions[0]
    let maxCount = getAvailableCount(best)
    dateTimeOptions.forEach((dt) => {
      const c = getAvailableCount(dt)
      if (c > maxCount) {
        best = dt
        maxCount = c
      }
    })
    return { dateTime: best, count: maxCount }
  }

  const bestDateTime = getBestDateTime()

  return (
    <TabsContent value="summary" className="space-y-4">
      {responses.length > 0 ? (
        <div className="space-y-4">
          {/* 表示切り替えタブ */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">集計結果</h2>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm flex items-center ${
                  summaryView === "dates" ? "bg-gray-100 font-medium" : "bg-white"
                }`}
                onClick={() => setSummaryView("dates")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                日時別
              </button>
              <button
                className={`px-3 py-1 text-sm flex items-center ${
                  summaryView === "grades" ? "bg-gray-100 font-medium" : "bg-white"
                }`}
                onClick={() => setSummaryView("grades")}
              >
                <GraduationCap className="h-4 w-4 mr-1" />
                所属/役職別
              </button>
            </div>
          </div>

          {/* 最適な日時 */}
          {bestDateTime && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-green-800 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  最も参加可能な日時
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-green-700 mr-2">
                    {bestDateTime.dateTime}
                  </div>
                  <Badge className="bg-green-600">{bestDateTime.count}人参加可能</Badge>
                </div>
                <div className="mt-2 text-sm text-green-600">
                  参加可能な人:{" "}
                  {getRespondentsByType(
                    bestDateTime.dateTime,
                    scheduleTypes.find((t) => t.isAvailable)?.id || ""
                  ).join(", ")}
                </div>
              </CardContent>
            </Card>
          )}

          {summaryView === "dates" ? (
            /* 日時別の集計表 */
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  日時別の回答状況
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3 font-medium">日時</th>
                        {scheduleTypes.map((type) => (
                          <th
                            key={type.id}
                            className={`py-2 px-2 text-center ${type.color}`}
                          >
                            {type.label}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-center font-medium">
                          参加可能
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dateTimeOptions.map((dt, idx) => {
                        const availableCount = getAvailableCount(dt)
                        const isOptimal =
                          bestDateTime?.dateTime === dt

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-50 ${
                              isOptimal ? "bg-green-50" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-medium">
                              <div className="flex items-center">
                                {dt}
                                {isOptimal && (
                                  <Badge className="ml-2 bg-green-600 text-[10px]">
                                    最適
                                  </Badge>
                                )}
                              </div>
                            </td>
                            {scheduleTypes.map((type) => {
                              const count = getResponseCountByType(dt, type.id)
                              const respondents = getRespondentsByType(dt, type.id)
                              return (
                                <td
                                  key={`${dt}-${type.id}`}
                                  className="py-2 px-2 text-center"
                                  title={
                                    respondents.length > 0
                                      ? respondents.join(", ")
                                      : "該当者なし"
                                  }
                                >
                                  <div className="flex justify-center">
                                    <div
                                      className={`
                                        ${
                                          count > 0
                                            ? type.color
                                            : "bg-gray-100 text-gray-500"
                                        }
                                        px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                      `}
                                    >
                                      {count}
                                    </div>
                                  </div>
                                </td>
                              )
                            })}
                            <td className="py-2 px-2 text-center">
                              <div className="flex justify-center">
                                <div
                                  className={`
                                    ${
                                      availableCount > 0
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-500"
                                    }
                                    px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                  `}
                                >
                                  {availableCount}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* 所属/役職別の集計表 */
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    所属/役職別の参加状況
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left py-2 px-3 font-medium">
                            所属/役職
                          </th>
                          <th className="py-2 px-2 text-center font-medium">
                            回答者数
                          </th>
                          {dateTimeOptions.map((dt, i) => (
                            <th
                              key={i}
                              className="py-2 px-2 text-center font-medium"
                            >
                              <div
                                className="truncate max-w-[80px]"
                                title={dt}
                              >
                                {dt}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {Object.entries(
                          responses.reduce(
                            (acc, r) => {
                              const g = r.grade || "未設定"
                              if (!acc[g]) acc[g] = []
                              acc[g].push(r.name)
                              return acc
                            },
                            {} as Record<string, string[]>
                          )
                        )
                          .sort(
                            ([a], [b]) =>
                              (gradeOrder[a] ?? 999) -
                              (gradeOrder[b] ?? 999)
                          )
                          .map(([g, names]) => (
                            <tr key={g} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">{g}</td>
                              <td className="py-2 px-2 text-center">
                                {names.length}人
                              </td>
                              {dateTimeOptions.map((dt, i) => {
                                const cnt = getAvailableCountByGradeAndDateTime(
                                  g,
                                  dt
                                )
                                return (
                                  <td
                                    key={`${g}-${i}`}
                                    className="py-2 px-2 text-center"
                                  >
                                    <div className="flex justify-center">
                                      <div
                                        className={`
                                          ${
                                            cnt > 0
                                              ? "bg-green-100 text-green-800"
                                              : "bg-gray-100 text-gray-500"
                                          }
                                          px-2 py-0.5 rounded-md min-w-[1.5rem] font-medium text-sm
                                        `}
                                      >
                                        {cnt}
                                      </div>
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    所属/役職別の詳細情報
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      responses.reduce(
                        (acc, r) => {
                          const g = r.grade || "未設定"
                          if (!acc[g]) acc[g] = []
                          acc[g].push(r.name)
                          return acc
                        },
                        {} as Record<string, string[]>
                      )
                    )
                      .sort(
                        ([a], [b]) =>
                          (gradeOrder[a] ?? 999) -
                          (gradeOrder[b] ?? 999)
                      )
                      .map(([g, names]) => {
                        const dist = getResponseTypeDistributionByGrade(g)
                        return (
                          <div
                            key={g}
                            className="border rounded-md overflow-hidden"
                          >
                            <div className="bg-gray-50 py-2 px-3 font-medium flex justify-between items-center">
                              <div>{g}</div>
                              <Badge variant="secondary">
                                {names.length}人
                              </Badge>
                            </div>
                            <div className="p-3">
                              <div className="text-sm mb-2">
                                参加者: {names.join(", ")}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {scheduleTypes.map((t) => (
                                  <div
                                    key={`${g}-${t.id}`}
                                    className="flex items-center"
                                  >
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        t.color.split(" ")[0]
                                      } mr-2`}
                                    ></div>
                                    <span className="text-sm">{t.label}:</span>
                                    <span className="text-sm font-medium ml-1">
                                      {dist[t.id] || 0}回
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          まだ回答がありません。集計結果を表示するには少なくとも1件の回答が必要です。
        </div>
      )}
    </TabsContent>
  )
}
