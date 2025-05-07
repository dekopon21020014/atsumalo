"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Copy, ArrowDown, ArrowRight, Save, Check, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { colorPalettes } from "@/app/events/[eventId]/components/constants"

// 予定タイプの型定義
interface ScheduleType {
  id: string
  label: string
  color: string
  isAvailable: boolean
}

export default function HomePage() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [xAxis, setXAxis] = useState(["月", "火", "水", "木", "金"])
  const [yAxis, setYAxis] = useState(["1", "2", "3", "4", "5"])
  const [activeTab, setActiveTab] = useState("builder")
  const router = useRouter()

  // 予定タイプの初期値
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>([
    { id: "available", label: "⭕️", color: "bg-green-100 text-green-800", isAvailable: true }, 
    { id: "parttime", label: "授業", color: "bg-blue-100 text-blue-800", isAvailable: false },
    { id: "ta", label: "TA", color: "bg-purple-100 text-purple-800", isAvailable: false },
    { id: "unavailable", label: "❌", color: "bg-gray-100 text-gray-800", isAvailable: false },
    { id: "class", label: "演習かも", color: "bg-red-100 text-red-800", isAvailable: false },    
    { id: "class", label: "❌", color: "bg-red-100 text-red-800", isAvailable: false }, 
  ])

  // テンプレートの定義
  const templates = [
    { name: "平日（月〜金）", x: ["月", "火", "水", "木", "金"], y: ["1", "2", "3", "4", "5"] },
    { name: "週末含む（月〜日）", x: ["月", "火", "水", "木", "金", "土", "日"], y: ["1", "2", "3", "4", "5"] },
    { name: "時間帯（午前/午後）", x: ["月", "火", "水", "木", "金"], y: ["午前", "午後", "夕方", "夜"] },
    { name: "日付（1週間）", x: ["5/1", "5/2", "5/3", "5/4", "5/5", "5/6", "5/7"], y: ["午前", "午後", "夜"] },
  ]

  // X軸の項目を追加
  const addXItem = () => {
    setXAxis([...xAxis, `項目${xAxis.length + 1}`])
  }

  // Y軸の項目を追加
  const addYItem = () => {
    setYAxis([...yAxis, `項目${yAxis.length + 1}`])
  }

  // X軸の項目を削除
  const removeXItem = (index: number) => {
    if (xAxis.length <= 1) return
    const newXAxis = [...xAxis]
    newXAxis.splice(index, 1)
    setXAxis(newXAxis)
  }

  // Y軸の項目を削除
  const removeYItem = (index: number) => {
    if (yAxis.length <= 1) return
    const newYAxis = [...yAxis]
    newYAxis.splice(index, 1)
    setYAxis(newYAxis)
  }

  // X軸の項目を更新
  const updateXItem = (index: number, value: string) => {
    const newXAxis = [...xAxis]
    newXAxis[index] = value
    setXAxis(newXAxis)
  }

  // Y軸の項目を更新
  const updateYItem = (index: number, value: string) => {
    const newYAxis = [...yAxis]
    newYAxis[index] = value
    setYAxis(newYAxis)
  }

  // 予定タイプを追加
  const addScheduleType = () => {
    // IDを生成（単純な方法）
    const newId = `type_${Date.now()}`

    // デフォルトの色をランダムに選択
    const randomColorIndex = Math.floor(Math.random() * colorPalettes.length)
    const randomColor = `${colorPalettes[randomColorIndex].bg} ${colorPalettes[randomColorIndex].text}`

    setScheduleTypes([
      ...scheduleTypes,
      {
        id: newId,
        label: `予定${scheduleTypes.length + 1}`,
        color: randomColor,
        isAvailable: false,
      },
    ])
  }

  // 予定タイプを削除
  const removeScheduleType = (index: number) => {
    if (scheduleTypes.length <= 1) return
    const newTypes = [...scheduleTypes]
    newTypes.splice(index, 1)
    setScheduleTypes(newTypes)
  }

  // 予定タイプのラベルを更新
  const updateScheduleTypeLabel = (index: number, label: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].label = label
    setScheduleTypes(newTypes)
  }

  // 予定タイプの色を更新
  const updateScheduleTypeColor = (index: number, colorClass: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].color = colorClass
    setScheduleTypes(newTypes)
  }

  // 予定タイプの「参加可能」状態を更新
  const updateScheduleTypeAvailability = (index: number, isAvailable: boolean) => {
    // 一旦すべてfalseにする
    const newTypes = scheduleTypes.map((type) => ({
      ...type,
      isAvailable: false,
    }))

    // 選択された項目だけtrueにする
    if (isAvailable) {
      newTypes[index].isAvailable = true
    }

    setScheduleTypes(newTypes)
  }

  // テンプレートを適用
  const applyTemplate = (templateIndex: number) => {
    const template = templates[templateIndex]
    setXAxis([...template.x])
    setYAxis([...template.y])
    toast({
      title: "テンプレート適用",
      description: `「${template.name}」を適用しました`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast({ title: "エラー", description: "イベント名を入力してください", variant: "destructive" })
      return
    }

    if (xAxis.length === 0 || yAxis.length === 0) {
      toast({ title: "エラー", description: "横軸と縦軸の項目を設定してください", variant: "destructive" })
      return
    }

    // 参加可能な予定タイプが設定されているか確認
    const hasAvailableType = scheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "エラー",
        description: "「参加可能」として設定された予定タイプが必要です",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          description: eventDesc,
          xAxis,
          yAxis,
          scheduleTypes,
        }),
      })
      if (!res.ok) throw new Error("Network response was not ok")
      const { id } = await res.json()
      router.push(`/events/${id}`)
    } catch (err) {
      console.error(err)
      toast({ title: "作成エラー", description: "イベントの作成に失敗しました", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">イベント管理アプリ</h1>

      <p className="mb-4 text-gray-700">
        このアプリは、研究室ゼミや勉強会などの「日程調整」を簡単に行うためのツールです。
      </p>

      <ol className="list-decimal list-inside mb-8 text-gray-600">
        <li>イベント名と説明を入力し、「イベントを作成」をクリック。</li>
        <li>生成されたリンクを参加者に共有。</li>
        <li>参加者は各自の空きコマを入力。</li>
        <li>管理画面で全員の回答を集計し、最適な日程を確認。</li>
      </ol>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="eventName">イベント名</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例：ゼミ日程調整"
              required
            />
          </div>
          <div>
            <Label htmlFor="eventDesc">イベント説明</Label>
            <textarea
              id="eventDesc"
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="このイベントの概要を入力"
              className="w-full p-2 border rounded resize-none h-10"
            />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">グリッド設定</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="builder">グリッドビルダー</TabsTrigger>
              <TabsTrigger value="scheduleTypes">予定タイプ</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
              <TabsTrigger value="templates">テンプレート</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* X軸設定 */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium flex items-center">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      横軸の項目
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addXItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {xAxis.map((item, index) => (
                      <div key={`x-${index}`} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateXItem(index, e.target.value)}
                          placeholder={`横軸項目 ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeXItem(index)}
                          disabled={xAxis.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Y軸設定 */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium flex items-center">
                      <ArrowDown className="h-4 w-4 mr-1" />
                      縦軸の項目
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addYItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {yAxis.map((item, index) => (
                      <div key={`y-${index}`} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateYItem(index, e.target.value)}
                          placeholder={`縦軸項目 ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeYItem(index)}
                          disabled={yAxis.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scheduleTypes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  予定タイプの設定
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addScheduleType}>
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>

              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm text-gray-600">
                  参加者が選択できる予定タイプを設定します。「参加可能」として設定された予定タイプは、集計時に「参加可能」としてカウントされます。
                </p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
                {scheduleTypes.map((type, index) => (
                  <div key={`type-${index}`} className="border rounded-md p-3 bg-white">
                    <div className="flex flex-col md:flex-row gap-3">
                      {/* ラベル入力 */}
                      <div className="flex-1">
                        <Label htmlFor={`type-label-${index}`} className="text-xs mb-1 block">
                          ラベル
                        </Label>
                        <Input
                          id={`type-label-${index}`}
                          value={type.label}
                          onChange={(e) => updateScheduleTypeLabel(index, e.target.value)}
                          placeholder="予定タイプの名前"
                        />
                      </div>

                      {/* 色選択 */}
                      <div className="w-full md:w-40">
                        <Label htmlFor={`type-color-${index}`} className="text-xs mb-1 block">
                          色
                        </Label>
                        <Select value={type.color} onValueChange={(value) => updateScheduleTypeColor(index, value)}>
                          <SelectTrigger id={`type-color-${index}`} className={`w-full ${type.color}`}>
                            <SelectValue placeholder="色を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {colorPalettes.map((color, colorIndex) => (
                              <SelectItem
                                key={`color-${colorIndex}`}
                                value={`${color.bg} ${color.text}`}
                                className={`${color.bg} ${color.text}`}
                              >
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 参加可能フラグ */}
                      <div className="flex items-center space-x-2 mt-6 md:mt-0">
                        <Switch
                          id={`type-available-${index}`}
                          checked={type.isAvailable}
                          onCheckedChange={(checked) => updateScheduleTypeAvailability(index, checked)}
                        />
                        <Label htmlFor={`type-available-${index}`} className="text-sm">
                          参加可能
                        </Label>
                      </div>

                      {/* 削除ボタン */}
                      <div className="flex items-center mt-6 md:mt-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScheduleType(index)}
                          disabled={scheduleTypes.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* プレビュー */}
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-gray-500 mb-1">プレビュー:</div>
                      <div className={`inline-block px-3 py-1 rounded-md ${type.color}`}>
                        {type.label}
                        {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="border rounded overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2"></th>
                      {xAxis.map((item, index) => (
                        <th key={`header-${index}`} className="border p-2 text-center min-w-[80px]">
                          {item || `項目${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yAxis.map((item, rowIndex) => (
                      <tr key={`row-${rowIndex}`}>
                        <td className="border p-2 font-medium text-center">{item || `項目${rowIndex + 1}`}</td>
                        {xAxis.map((_, colIndex) => (
                          <td key={`cell-${rowIndex}-${colIndex}`} className="border p-2 text-center">
                            <Select>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {scheduleTypes.map((type, typeIndex) => (
                                  <SelectItem key={`preview-type-${typeIndex}`} value={type.id} className={type.color}>
                                    {type.label}
                                    {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                これはグリッドのプレビューです。実際の入力フォームはこのような形式になります。
              </p>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template, index) => (
                  <Card key={`template-${index}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">{template.name}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        <div>
                          横軸: <span className="font-mono">{template.x.join(", ")}</span>
                        </div>
                        <div>
                          縦軸: <span className="font-mono">{template.y.join(", ")}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => applyTemplate(index)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        このテンプレートを使用
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Button type="submit" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          イベントを作成
        </Button>
      </form>
    </div>
  )
}
