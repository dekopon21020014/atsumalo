"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  ArrowDown,
  ArrowRight,
  Save,
  Check,
  Settings,
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  UserPlus,
  Lock,
  Sparkles,
  Eye,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  colorPalettes,
  recurringTemplates,
  onetimeTemplates,
  scheduleTypeTemplate,
  xAxisTemplate,
  yAxisTemplate,
  defaultGradeOptions,
  defaultGradeOrder,
} from "../events/[eventId]/components/constants"
import type { ScheduleType } from "../events/[eventId]/components/constants"

// Section header (with numbered badge)
function SectionHeader({
  step,
  title,
  description,
  icon,
}: {
  step: number
  title: string
  description?: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-tight">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [eventName, setEventName] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [eventPassword, setEventPassword] = useState("")
  const [eventType, setEventType] = useState<"recurring" | "onetime" | undefined>(undefined)

  // Axes for recurring events
  const [xAxis, setXAxis] = useState(xAxisTemplate)
  const [yAxis, setYAxis] = useState(yAxisTemplate)

  // Axes for one-time events (date-time combinations)
  const [dateTimeOptions, setDateTimeOptions] = useState(["5/1 19:00", "5/2 19:00", "5/3 20:00"])

  // Group/Role Options
  const [gradeOptions, setGradeOptions] = useState(
    defaultGradeOptions.map((g) => ({ name: g, priority: defaultGradeOrder[g] || 0 })),
  )

  const router = useRouter()
  const pathname = usePathname()
  const prefix = pathname.startsWith("/en") ? "/en" : ""

  // Initial schedule types
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(scheduleTypeTemplate)

  const xAxisRefs = useRef<HTMLInputElement[]>([])
  const yAxisRefs = useRef<HTMLInputElement[]>([])
  const dateTimeRefs = useRef<HTMLInputElement[]>([])
  const typeLabelRefs = useRef<HTMLInputElement[]>([])
  const gradeOptionRefs = useRef<HTMLInputElement[]>([])

  // Add item to X-axis
  const addXItem = () => {
    setXAxis((prev) => {
      const newItems = [...prev, `Item${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        xAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // Add item to Y-axis
  const addYItem = () => {
    setYAxis((prev) => {
      const newItems = [...prev, `Item${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newItems.length - 1
        yAxisRefs.current[newIndex]?.focus()
      })
      return newItems
    })
  }

  // Add date-time option
  const addDateTimeOption = () => {
    setDateTimeOptions((prev) => {
      const newOptions = [...prev, `Date-Time${prev.length + 1}`]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        dateTimeRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // Remove X-axis item
  const removeXItem = (index: number) => {
    if (xAxis.length <= 1) return
    const newXAxis = [...xAxis]
    newXAxis.splice(index, 1)
    setXAxis(newXAxis)
  }

  // Remove Y-axis item
  const removeYItem = (index: number) => {
    if (yAxis.length <= 1) return
    const newYAxis = [...yAxis]
    newYAxis.splice(index, 1)
    setYAxis(newYAxis)
  }

  // Remove date-time option
  const removeDateTimeOption = (index: number) => {
    if (dateTimeOptions.length <= 1) return
    const newOptions = [...dateTimeOptions]
    newOptions.splice(index, 1)
    setDateTimeOptions(newOptions)
  }

  // Add group/role item
  const addGradeOption = () => {
    setGradeOptions((prev) => {
      const newOptions = [...prev, { name: `Option${prev.length + 1}`, priority: prev.length + 1 }]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        gradeOptionRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // Remove group/role item
  const removeGradeOption = (index: number) => {
    if (gradeOptions.length <= 1) return
    const newOpts = [...gradeOptions]
    newOpts.splice(index, 1)
    setGradeOptions(newOpts)
  }

  // Update group/role name
  const updateGradeOptionName = (index: number, value: string) => {
    const newOpts = [...gradeOptions]
    newOpts[index].name = value
    setGradeOptions(newOpts)
  }

  // Update group/role priority
  const updateGradeOptionPriority = (index: number, value: number) => {
    const newOpts = [...gradeOptions]
    newOpts[index].priority = value
    setGradeOptions(newOpts)
  }

  // Update X-axis item
  const updateXItem = (index: number, value: string) => {
    const newXAxis = [...xAxis]
    newXAxis[index] = value
    setXAxis(newXAxis)
  }

  // Update Y-axis item
  const updateYItem = (index: number, value: string) => {
    const newYAxis = [...yAxis]
    newYAxis[index] = value
    setYAxis(newYAxis)
  }

  // Update date-time option
  const updateDateTimeOption = (index: number, value: string) => {
    const newOptions = [...dateTimeOptions]
    newOptions[index] = value
    setDateTimeOptions(newOptions)
  }

  // Add schedule type
  const addScheduleType = () => {
    const newId = `type_${Date.now()}`
    const randomColorIndex = Math.floor(Math.random() * colorPalettes.length)
    const randomColor = `${colorPalettes[randomColorIndex].bg} ${colorPalettes[randomColorIndex].text}`

    setScheduleTypes((prev) => {
      const newTypes = [
        ...prev,
        {
          id: newId,
          label: `Schedule${prev.length + 1}`,
          color: randomColor,
          isAvailable: false,
        },
      ]
      requestAnimationFrame(() => {
        const newIndex = newTypes.length - 1
        typeLabelRefs.current[newIndex]?.focus()
      })
      return newTypes
    })
  }

  // Remove schedule type
  const removeScheduleType = (index: number) => {
    if (scheduleTypes.length <= 1) return
    const newTypes = [...scheduleTypes]
    newTypes.splice(index, 1)
    setScheduleTypes(newTypes)
  }

  // Update schedule type label
  const updateScheduleTypeLabel = (index: number, label: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].label = label
    setScheduleTypes(newTypes)
  }

  // Update schedule type color
  const updateScheduleTypeColor = (index: number, colorClass: string) => {
    const newTypes = [...scheduleTypes]
    newTypes[index].color = colorClass
    setScheduleTypes(newTypes)
  }

  // Update schedule type "Available" state
  const updateScheduleTypeAvailability = (index: number, isAvailable: boolean) => {
    const newTypes = scheduleTypes.map((type) => ({
      ...type,
      isAvailable: false,
    }))

    if (isAvailable) {
      newTypes[index].isAvailable = true
    }

    setScheduleTypes(newTypes)
  }

  // Apply recurring event template
  const applyRecurringTemplate = (templateIndex: number) => {
    const template = recurringTemplates[templateIndex]
    setXAxis([...template.x])
    setYAxis([...template.y])
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}"`,
    })
  }

  // Apply one-time event template
  const applyOnetimeTemplate = (templateIndex: number) => {
    const template = onetimeTemplates[templateIndex]
    setDateTimeOptions([...template.options])
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}"`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast({ title: "Error", description: "Please enter an event name", variant: "destructive" })
      return
    }

    if (!eventType) {
      toast({ title: "Error", description: "Please select an event type", variant: "destructive" })
      return
    }

    if (eventType === "recurring") {
      if (xAxis.length === 0 || yAxis.length === 0) {
        toast({ title: "Error", description: "Please set items for both X and Y axes", variant: "destructive" })
        return
      }
    } else {
      if (dateTimeOptions.length === 0) {
        toast({ title: "Error", description: "Please set date-time options", variant: "destructive" })
        return
      }
    }

    const hasAvailableType = scheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "Error",
        description: "At least one schedule type must be marked as 'Available'",
        variant: "destructive",
      })
      return
    }

    function removeEmptyScheduleTypes(arr: ScheduleType[]): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(scheduleTypes)
      const cleanedXAxis = xAxis.filter((v) => v.trim() !== "")
      const cleanedYAxis = yAxis.filter((v) => v.trim() !== "")
      const cleanedDateTimes = dateTimeOptions.filter((v) => v.trim() !== "")
      const cleanedGrades = gradeOptions.filter((g) => g.name.trim() !== "").map((g) => g.name.trim())
      const gradeOrder = gradeOptions.reduce(
        (acc, g) => {
          const name = g.name.trim()
          if (name) acc[name] = g.priority
          return acc
        },
        {} as Record<string, number>,
      )

      const eventData = {
        name: eventName,
        description: eventDesc,
        eventType,
        scheduleTypes: cleanedScheduleTypes,
        gradeOptions: cleanedGrades,
        gradeOrder,
        xAxis: eventType === "recurring" ? cleanedXAxis : undefined,
        yAxis: eventType === "recurring" ? cleanedYAxis : undefined,
        dateTimeOptions: eventType === "onetime" ? cleanedDateTimes : undefined,
        password: usePassword ? eventPassword : undefined,
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      if (!res.ok) throw new Error("Network response was not ok")
      const { id } = await res.json()
      router.push(`${prefix}/events/${id}`)
    } catch (err) {
      console.error(err)
      toast({ title: "Creation Error", description: "Failed to create the event", variant: "destructive" })
    }
  }

  const availableType = scheduleTypes.find((t) => t.isAvailable)

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Create Event
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">Create a Scheduling Event</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Just fill in the steps below to create a scheduling page you can share with participants. The page will be automatically deleted 3 months after creation.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
            {/* Left: Input section */}
            <div className="space-y-6">
              {/* Step 1: Basic Information */}
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={1}
                    icon={<Calendar className="h-5 w-5" />}
                    title="Basic Information"
                    description="The event name will be displayed exactly as entered to participants."
                  />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="eventName" className="flex items-center gap-1 text-sm font-medium">
                        Event Name
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g., Seminar Schedule"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eventDesc" className="flex items-center gap-1 text-sm font-medium">
                        <FileText className="h-3.5 w-3.5" />
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="eventDesc"
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="Enter a summary for this event"
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Format */}
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={2}
                    icon={<Settings className="h-5 w-5" />}
                    title="Select Event Type"
                    description="Choose a format that matches what you want to schedule."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEventType("recurring")}
                      aria-pressed={eventType === "recurring"}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                        eventType === "recurring"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CalendarDays className="h-5 w-5" />
                        Recurring Event
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty">
                        Grid format with days × periods. Ideal for lab seminars or classes.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType("onetime")}
                      aria-pressed={eventType === "onetime"}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                        eventType === "onetime"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Calendar className="h-5 w-5" />
                        One-time Event
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty">
                        Select from a list of specific dates and times. Ideal for meetings or parties.
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Candidates (Grid or Date-Time) */}
              {eventType && (
                <Card>
                  <CardContent className="space-y-5 p-6">
                    <SectionHeader
                      step={3}
                      icon={eventType === "recurring" ? <CalendarDays className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      title={eventType === "recurring" ? "Grid Settings" : "Date-Time Options"}
                      description={
                        eventType === "recurring"
                          ? "Set the X-axis (days, etc.) and Y-axis (periods, etc.). Press Enter to add, Backspace on an empty field to remove."
                          : "Add candidate date-times. Press Enter to add, Backspace on an empty field to remove."
                      }
                    />

                    {/* Templates */}
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Start from Template
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {eventType === "recurring"
                          ? recurringTemplates.map((template, index) => (
                              <Button
                                key={`rt-${index}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 bg-background"
                                onClick={() => applyRecurringTemplate(index)}
                              >
                                {template.name}
                              </Button>
                            ))
                          : onetimeTemplates.map((template, index) => (
                              <Button
                                key={`ot-${index}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 bg-background"
                                onClick={() => applyOnetimeTemplate(index)}
                              >
                                {template.name}
                              </Button>
                            ))}
                      </div>
                    </div>

                    {eventType === "recurring" ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* X-axis */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              <ArrowRight className="h-4 w-4" />
                              X-axis (days, etc.)
                            </Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addXItem}>
                              <Plus className="mr-1 h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {xAxis.map((item, i) => (
                              <div key={`x-${i}`} className="flex items-center gap-2">
                                <Input
                                  ref={(el) => {
                                    if (el) xAxisRefs.current[i] = el
                                  }}
                                  id={`x-axis-${i}`}
                                  value={item}
                                  onChange={(e) => updateXItem(i, e.target.value)}
                                  onKeyDown={(e) => {
                                    const isComposing = (e.nativeEvent as any).isComposing as boolean
                                    if (e.key === "Enter" && !isComposing) {
                                      e.preventDefault()
                                      addXItem()
                                    }
                                    if (
                                      (e.key === "Backspace" || e.key === "Delete") &&
                                      !isComposing &&
                                      e.currentTarget.value === ""
                                    ) {
                                      e.preventDefault()
                                      removeXItem(i)
                                      requestAnimationFrame(() => {
                                        const prevIndex = Math.max(i - 1, 0)
                                        xAxisRefs.current[prevIndex]?.focus()
                                      })
                                      return
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeXItem(i)}
                                  disabled={xAxis.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Y-axis */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              <ArrowDown className="h-4 w-4" />
                              Y-axis (periods, etc.)
                            </Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addYItem}>
                              <Plus className="mr-1 h-4 w-4" />
                              Add
                            </Button>
                          </div>
                          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {yAxis.map((item, i) => (
                              <div key={`y-${i}`} className="flex items-center gap-2">
                                <Input
                                  ref={(el) => {
                                    if (el) yAxisRefs.current[i] = el
                                  }}
                                  id={`y-axis-${i}`}
                                  value={item}
                                  onChange={(e) => updateYItem(i, e.target.value)}
                                  onKeyDown={(e) => {
                                    const isComposing = (e.nativeEvent as any).isComposing as boolean
                                    if (e.key === "Enter" && !isComposing) {
                                      e.preventDefault()
                                      addYItem()
                                    }
                                    if (
                                      (e.key === "Backspace" || e.key === "Delete") &&
                                      !isComposing &&
                                      e.currentTarget.value === ""
                                    ) {
                                      e.preventDefault()
                                      removeYItem(i)
                                      requestAnimationFrame(() => {
                                        const prevIndex = Math.max(i - 1, 0)
                                        yAxisRefs.current[prevIndex]?.focus()
                                      })
                                      return
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeYItem(i)}
                                  disabled={yAxis.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            Date-Time Options
                          </Label>
                          <Button type="button" variant="ghost" size="sm" onClick={addDateTimeOption}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                          {dateTimeOptions.map((item, index) => (
                            <div key={`datetime-${index}`} className="flex items-center gap-2">
                              <Input
                                ref={(el) => {
                                  if (el) dateTimeRefs.current[index] = el
                                }}
                                id={`datetime-option-${index}`}
                                value={item}
                                onChange={(e) => updateDateTimeOption(index, e.target.value)}
                                onKeyDown={(e) => {
                                  const isComposing = (e.nativeEvent as any).isComposing as boolean
                                  if (e.key === "Enter" && !isComposing) {
                                    e.preventDefault()
                                    addDateTimeOption()
                                  }
                                  if (
                                    (e.key === "Backspace" || e.key === "Delete") &&
                                    !isComposing &&
                                    e.currentTarget.value === ""
                                  ) {
                                    e.preventDefault()
                                    removeDateTimeOption(index)
                                    requestAnimationFrame(() => {
                                      const prevIndex = Math.max(index - 1, 0)
                                      dateTimeRefs.current[prevIndex]?.focus()
                                    })
                                    return
                                  }
                                }}
                                placeholder={`Date-Time ${index + 1} (e.g., 5/1 19:00)`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDateTimeOption(index)}
                                disabled={dateTimeOptions.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter date-times like '5/1 19:00'. Participants will select from this list.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Schedule types */}
              {eventType && (
                <Card>
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <SectionHeader
                        step={4}
                        icon={<Check className="h-5 w-5" />}
                        title="Schedule Types (Answer Options)"
                        description="Options participants choose for each slot. Setting one as 'Available' will use it as the basis for tallying."
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addScheduleType} className="shrink-0 bg-background">
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {scheduleTypes.map((type, index) => (
                        <div key={`type-${index}`} className="rounded-lg border bg-card p-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-sm", type.color)}>
                              {type.label || "(Untitled)"}
                              {type.isAvailable && <Check className="ml-1 h-3 w-3" />}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              <Label htmlFor={`type-available-${index}`} className="text-xs text-muted-foreground">
                                Available
                              </Label>
                              <Switch
                                id={`type-available-${index}`}
                                checked={type.isAvailable}
                                onCheckedChange={(checked) => updateScheduleTypeAvailability(index, checked)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeScheduleType(index)}
                                disabled={scheduleTypes.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              ref={(el) => {
                                if (el) typeLabelRefs.current[index] = el
                              }}
                              id={`type-label-${index}`}
                              value={type.label}
                              onChange={(e) => updateScheduleTypeLabel(index, e.target.value)}
                              onKeyDown={(e) => {
                                const isComposing = (e.nativeEvent as any).isComposing as boolean
                                if (e.key === "Enter" && !isComposing) {
                                  e.preventDefault()
                                  addScheduleType()
                                }
                                if (e.key === "Backspace" && !isComposing && e.currentTarget.value === "") {
                                  e.preventDefault()
                                  removeScheduleType(index)
                                  return
                                }
                              }}
                              placeholder="Label"
                              className="flex-1"
                            />
                            <Select value={type.color} onValueChange={(value) => updateScheduleTypeColor(index, value)}>
                              <SelectTrigger id={`type-color-${index}`} className={cn("w-28", type.color)}>
                                <SelectValue placeholder="Color" />
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Advanced settings */}
              {eventType && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader
                    step={5}
                    icon={<UserPlus className="h-5 w-5" />}
                    title="Advanced Settings (Optional)"
                    description="Set group/role options and an event password."
                  />

                  {/* Group/Role */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Group/Role Options</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addGradeOption}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Smaller numbers indicate higher priority.</p>
                    <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="flex-1">Group/Role</span>
                        <span className="w-20 text-center">Priority</span>
                        <span className="w-9" />
                      </div>
                      {gradeOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            ref={(el) => {
                              if (el) gradeOptionRefs.current[i] = el
                            }}
                            value={opt.name}
                            onChange={(e) => updateGradeOptionName(i, e.target.value)}
                            onKeyDown={(e) => {
                              const isComposing = (e.nativeEvent as any).isComposing as boolean
                              if (e.key === "Enter" && !isComposing) {
                                e.preventDefault()
                                addGradeOption()
                              }
                              if (
                                (e.key === "Backspace" || e.key === "Delete") &&
                                !isComposing &&
                                e.currentTarget.value === ""
                              ) {
                                e.preventDefault()
                                removeGradeOption(i)
                                requestAnimationFrame(() => {
                                  const prevIndex = Math.max(i - 1, 0)
                                  gradeOptionRefs.current[prevIndex]?.focus()
                                })
                                return
                              }
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={opt.priority}
                            onChange={(e) => updateGradeOptionPriority(i, Number(e.target.value))}
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGradeOption(i)}
                            disabled={gradeOptions.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="usePassword" className="flex-1 text-sm font-medium">
                        Protect with Password
                      </Label>
                      <Switch id="usePassword" checked={usePassword} onCheckedChange={setUsePassword} />
                    </div>
                    {usePassword && (
                      <Input
                        id="eventPassword"
                        type="text"
                        value={eventPassword}
                        onChange={(e) => setEventPassword(e.target.value)}
                        placeholder="Enter Password"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

            {/* Right: Live Preview + Create Button */}
            <aside className="xl:sticky xl:top-6 xl:self-start">
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview</span>
                  <span className="ml-auto text-xs text-muted-foreground">What participants will see</span>
                </div>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <h3 className="font-semibold leading-tight text-balance">{eventName || "(Event Name not entered)"}</h3>
                    {eventDesc && <p className="mt-1 text-xs text-muted-foreground text-pretty">{eventDesc}</p>}
                  </div>

                  {!eventType ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Select a format to see a preview of the input form here.
                    </div>
                  ) : eventType === "recurring" ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-1.5" />
                            {xAxis.map((item, index) => (
                              <th key={`ph-${index}`} className="border p-1.5 text-center font-medium">
                                {item || `Item${index + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {yAxis.map((item, rowIndex) => (
                            <tr key={`pr-${rowIndex}`}>
                              <td className="border bg-muted/50 p-1.5 text-center font-medium">{item || `Item${rowIndex + 1}`}</td>
                              {xAxis.map((_, colIndex) => (
                                <td key={`pc-${rowIndex}-${colIndex}`} className="border p-1 text-center">
                                  <span
                                    className={cn(
                                      "inline-block w-full rounded px-1 py-0.5 text-[10px]",
                                      availableType?.color ?? "bg-muted",
                                    )}
                                  >
                                    {availableType?.label ?? "Select"}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border">
                      {dateTimeOptions.map((dateTime, index) => (
                        <div key={`pl-${index}`} className="p-2.5">
                          <div className="mb-1.5 text-xs font-medium">{dateTime}</div>
                          <div className="flex flex-wrap gap-1">
                            {scheduleTypes.map((type, typeIndex) => (
                              <span
                                key={`po-${index}-${typeIndex}`}
                                className={cn("rounded px-2 py-0.5 text-[11px]", type.color)}
                              >
                                {type.label}
                                {type.isAvailable && <Check className="ml-0.5 inline-block h-2.5 w-2.5" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={!eventName.trim() || !eventType}>
                    <Save className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                  {!eventType && (
                    <p className="text-center text-xs text-muted-foreground">
                      Set the event name and format to create the event.
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}
