"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, UserPlus } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import useMediaQuery from "@/hooks/use-mobile"

import ScheduleForm from "./ScheduleForm"
import ParticipantList from "./ParticipantList"
import ScheduleSummary from "./ScheduleSummary"
import BestTimeSlots from "./BestTimeSlots"
import { createEmptySchedule } from "./utils"
import { Participant, Schedule } from "./types"
import { useParams } from 'next/navigation'

export default function SchedulePage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [currentName, setCurrentName] = useState("")
  const [currentSchedule, setCurrentSchedule] = useState<Schedule>(createEmptySchedule())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { eventId } = useParams()

  useEffect(() => {
    fetch(`/api/events/${eventId}/participants`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.participants)) {
          setParticipants(data.participants)
        }
      })
      .catch((e) => {
        console.error("Failed to load participants", e)
      })
  }, [])

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          setParticipants(data)
          toast({ title: "インポート完了", description: `${data.length}人分のスケジュールを読み込みました。` })
        }
      } catch {
        toast({ title: "エラー", description: "ファイル形式が不正です", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(participants))
    const link = document.createElement("a")
    link.href = dataStr
    link.download = "lab-schedule.json"
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6"> 
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            エクスポート
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-1" />
                インポート
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>スケジュールのインポート</DialogTitle>
                <DialogDescription>JSONファイルを読み込みます。</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="file" accept=".json" onChange={handleImport} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="input" className="flex-1">スケジュール入力</TabsTrigger>
          <TabsTrigger value="participants" className="flex-1">参加者一覧</TabsTrigger>
          <TabsTrigger value="summary" className="flex-1">集計結果</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <ScheduleForm
            currentName={currentName}
            setCurrentName={setCurrentName}
            currentSchedule={currentSchedule}
            setCurrentSchedule={setCurrentSchedule}
            participants={participants}
            setParticipants={setParticipants}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantList
            participants={participants}
            setParticipants={setParticipants}
            setCurrentName={setCurrentName}
            setCurrentSchedule={setCurrentSchedule}
            setEditingIndex={setEditingIndex}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-6 md:grid-cols-3">
            <ScheduleSummary participants={participants} />
            <BestTimeSlots participants={participants} />
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}
