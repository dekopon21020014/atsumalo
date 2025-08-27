"use client"

import { useState } from "react"
import { useParticipantForm } from "./useParticipantForm"
import {
  Check, Save, User, MessageSquare, X, GraduationCap, BarChart3,
  Users, PenSquare, Edit, Trash2, AlertTriangle,
} from "lucide-react"
import type { ScheduleType, Response } from "./constants"
import { gradeOptions } from "./constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import OneTimeInputTab from "@/app/events/[eventId]/components/OneTimeInput"
import OneTimeResponsesTab from "./OneTimeResponseStatus"
import OneTimeSummaryTab from "./OneTimeSummary"

type Props = {
  eventId: string
  dateTimeOptions: string[]
  scheduleTypes: ScheduleType[]
  responses?: Response[]
}

export default function OneTimePage({ eventId, dateTimeOptions, scheduleTypes, responses = [] }: Props) {  
  const [activeTab, setActiveTab] = useState("input")
  const form = useParticipantForm(eventId, dateTimeOptions, scheduleTypes, responses, setActiveTab)
  const isMobile = useMediaQuery("(max-width: 768px)")      

  // 最適な日時を取得
  const bestDateTime = form.getBestDateTime()

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="input" className="flex items-center">
            <PenSquare className="h-4 w-4 mr-2" />
            入力
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            回答状況
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            集計結果
          </TabsTrigger>
        </TabsList>

        {/* 入力タブ */}
        <OneTimeInputTab
            eventId={eventId}
            dateTimeOptions={dateTimeOptions}
            scheduleTypes={scheduleTypes}
            existingResponses={form.existingResponses}
            setExistingResponses={form.setExistingResponses}
            setActiveTab={setActiveTab}
        />

        {/* 回答状況タブ */}
        <OneTimeResponsesTab
            dateTimeOptions={dateTimeOptions}
            scheduleTypes={scheduleTypes}
            responses={form.existingResponses}
            form={form}
        />

        {/* 集計結果タブ */}
        <OneTimeSummaryTab
            dateTimeOptions={dateTimeOptions}
            scheduleTypes={scheduleTypes}
            existingResponses={form.existingResponses}
        />
      </Tabs>

      {/* 送信ボタン（モバイル用固定フッター） */}
      {isMobile && activeTab === "input" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-between items-center z-10">
          <div className="text-sm">
            {Object.keys(form.selections).length} / {dateTimeOptions.length} 回答済み
          </div>
          <Button size="sm" onClick={form.handleSubmit} disabled={form.isSubmitting}>
            <Save className="h-4 w-4 mr-1" />
            回答を保存
          </Button>
        </div>
      )}

      {/* 回答編集ダイアログ */}
      <Dialog open={form.isEditDialogOpen} onOpenChange={form.setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              回答の編集
            </DialogTitle>
          </DialogHeader>

          {form.editingResponse && (
            <div className="space-y-4 py-2">
              {/* 名前と学年入力セクション */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium mb-1 block">
                    <User className="h-4 w-4 inline-block mr-1" />
                    名前
                  </Label>
                  <Input
                    id="edit-name"
                    value={form.editName}
                    onChange={(e) => form.setEditName(e.target.value)}
                    placeholder="名前を入力してください"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-grade" className="text-sm font-medium mb-1 block">
                    <GraduationCap className="h-4 w-4 inline-block mr-1" />
                    学年
                  </Label>
                  <Select value={form.editGrade} onValueChange={(value) => form.setEditGrade(value)}>
                    <SelectTrigger id="edit-grade">
                      <SelectValue placeholder="学年を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 日時選択セクション */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2 pl-3 font-medium text-sm w-1/3">日時</th>
                      <th className="text-left p-2 font-medium text-sm">選択肢</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dateTimeOptions.map((dateTime, index) => {
                      const selectedTypeId = form.editSelections[dateTime]

                      return (
                        <tr key={`edit-datetime-${index}`} className="hover:bg-gray-50">
                          <td className="p-2 pl-3 align-middle">
                            <div className="font-medium">{dateTime}</div>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {scheduleTypes.map((type) => (
                                <button
                                  key={`edit-${type.id}-${index}`}
                                  className={`px-2 py-1 rounded-md ${type.color} hover:opacity-90 transition-opacity text-sm ${
                                    selectedTypeId === type.id ? "ring-2 ring-offset-1 ring-gray-900" : ""
                                  }`}
                                  onClick={() => form.handleEditSelection(dateTime, type.id)}
                                  type="button"
                                >
                                  {type.label}
                                  {selectedTypeId === type.id && <Check className="inline-block ml-1 h-3 w-3" />}
                                </button>
                              ))}
                              <button
                                onClick={() => form.toggleEditComment(dateTime)}
                                className="text-xs text-gray-500 flex items-center hover:text-gray-700 ml-1"
                                type="button"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {form.showEditComments[dateTime] ? "閉じる" : "コメント"}
                              </button>
                            </div>
                            {form.showEditComments[dateTime] && (
                              <div className="mt-2">
                                <Textarea
                                  placeholder="コメントを入力"
                                  value={form.editComments[dateTime] || ""}
                                  onChange={(e) => form.handleEditCommentChange(dateTime, e.target.value)}
                                  className="w-full h-16 text-sm"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={form.clearEditResponses} type="button">
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
              <Button variant="destructive" onClick={form.openDeleteConfirmation} type="button">
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => form.setIsEditDialogOpen(false)} type="button">
                キャンセル
              </Button>
              <Button onClick={form.handleUpdateResponse} disabled={form.isEditing} type="button">
                {form.isEditing ? "更新中..." : "更新する"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={form.isDeleteDialogOpen} onOpenChange={form.setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              回答の削除
            </AlertDialogTitle>
            <AlertDialogDescription>
              {form.editingResponse && (
                <>
                  <span className="font-medium">{form.editingResponse.name}</span>
                  さんの回答を削除します。この操作は元に戻せません。
                  <br />
                  本当に削除してもよろしいですか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={form.isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                form.handleDeleteResponse()
              }}
              disabled={form.isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {form.isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
