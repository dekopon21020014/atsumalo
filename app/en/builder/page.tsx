"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Copy,
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
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Textarea } from "@/components/ui/textarea"
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
    defaultGradeOptions.map((g) => ({ name: g, priority: defaultGradeOrder[g] || 0 }))
  )

  const [activeTab, setActiveTab] = useState("builder")
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

  // Remove item from X-axis
  const removeXItem = (index: number) => {
    if (xAxis.length <= 1) return
    const newXAxis = [...xAxis]
    newXAxis.splice(index, 1)
    setXAxis(newXAxis)
  }

  // Remove item from Y-axis
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

  // Add group/role option
  const addGradeOption = () => {
    setGradeOptions((prev) => {
      const newOptions = [
        ...prev,
        { name: `Option${prev.length + 1}`, priority: prev.length + 1 },
      ]
      requestAnimationFrame(() => {
        const newIndex = newOptions.length - 1
        gradeOptionRefs.current[newIndex]?.focus()
      })
      return newOptions
    })
  }

  // Remove group/role option
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

  // Add schedule type and focus new field
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
    // Reset all to false
    const newTypes = scheduleTypes.map((type) => ({
      ...type,
      isAvailable: false,
    }))

    // Set only the selected item to true
    if (isAvailable) {
      newTypes[index].isAvailable = true
    }

    setScheduleTypes(newTypes)
  }

  // Apply template for recurring events
  const applyRecurringTemplate = (templateIndex: number) => {
    const template = recurringTemplates[templateIndex]
    setXAxis([...template.x])
    setYAxis([...template.y])
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}"`,
    })
  }

  // Apply template for one-time events
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
      toast({ title: "Error", description: "Please select the event type", variant: "destructive" })
      return
    }

    // Validation based on event type
    if (eventType === "recurring") {
      if (xAxis.length === 0 || yAxis.length === 0) {
        toast({ title: "Error", description: "Please set items for both axes", variant: "destructive" })
        return
      }
    } else {
      if (dateTimeOptions.length === 0) {
        toast({ title: "Error", description: "Please set date-time options", variant: "destructive" })
        return
      }
    }

    // Check that at least one schedule type is marked as Available
    const hasAvailableType = scheduleTypes.some((type) => type.isAvailable)
    if (!hasAvailableType) {
      toast({
        title: "Error",
        description: "At least one schedule type must be marked as Available",
        variant: "destructive",
      })
      return
    }


    // Helper to remove empty option strings
    function removeEmptyScheduleTypes(arr: ScheduleType[]): ScheduleType[] {
      return arr.filter((t) => t.id.trim() !== "")
    }

    try {
      const cleanedScheduleTypes = removeEmptyScheduleTypes(scheduleTypes)
      const cleanedXAxis = xAxis.filter((v) => v.trim() !== "")
      const cleanedYAxis = yAxis.filter((v) => v.trim() !== "")
      const cleanedDateTimes = dateTimeOptions.filter((v) => v.trim() !== "")
      const cleanedGrades = gradeOptions
        .filter((g) => g.name.trim() !== "")
        .map((g) => g.name.trim())
      const gradeOrder = gradeOptions.reduce((acc, g) => {
        const name = g.name.trim()
        if (name) acc[name] = g.priority
        return acc
      }, {} as Record<string, number>)

      // Prepare data according to event type
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

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-black p-8 text-white">
        <h1 className="text-4xl font-extrabold tracking-tight">Event Management App</h1>
        <p className="mt-2 text-lg">
          A tool to smartly coordinate schedules for lab seminars, study groups, and more.
        </p>
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Create Event</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5" />
            <span>Share Link</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>Participants Respond</span>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Check Results</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Event pages are automatically deleted 3 months after creation.
      </p>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Seminar Schedule"
                required
              />
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Event Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="eventDesc"
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="Enter a summary for this event"
                className="h-24"
              />
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="usePassword"
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                />
                <Label htmlFor="usePassword" className="text-sm">
                  Set a password
                </Label>
              </div>
              {usePassword && (
                <Input
                  id="eventPassword"
                  type="text"
                  value={eventPassword}
                  onChange={(e) => setEventPassword(e.target.value)}
                  placeholder="Enter password"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Event TypeSelect */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Event Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Please select the event type.
              </p>
              <ToggleGroup
                type="single"
                value={eventType}
                onValueChange={(value) => {
                  if (!value) return
                  setEventType(value as "recurring" | "onetime")
                }}
                className="grid w-full grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="recurring"
                  aria-label="Recurring Event"
                  className="w-full cursor-pointer rounded-md border py-2 data-[state=on]:bg-black data-[state=on]:text-white"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Recurring Event
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="onetime"
                  aria-label="One-time Event"
                  className="w-full cursor-pointer rounded-md border py-2 data-[state=on]:bg-black data-[state=on]:text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  One-time Event
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {eventType === "recurring"
                  ? "For recurring meetings or classes, schedule using a day × time grid."
                  : eventType === "onetime"
                    ? "For one-off events or meetings, choose from a list of specific date-times."
                    : null}
              </div>
            </CardContent>
          </Card>
          {/* Group/Role settings */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Group/Role Options
            </CardTitle>
            <CardDescription>Smaller numbers indicate higher priority.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <div className="flex items-center gap-2 font-semibold sticky top-0 bg-white dark:bg-gray-800">
                <span className="flex-1">Group/Role</span>
                <span className="w-20">Priority</span>
                <span className="w-10" />
              </div>
              {gradeOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    ref={(el) => (gradeOptionRefs.current[i] = el)}
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
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGradeOption}
                className="mt-2 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>

        {eventType && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                {eventType === "recurring" ? (
                  <CalendarDays className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                {eventType === "recurring" ? "Grid Settings" : "Date-Time Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 flex w-full overflow-x-auto justify-start md:justify-center bg-white/60 dark:bg-gray-700/50 p-1 rounded-lg">
            <TabsTrigger value="builder">{eventType === "recurring" ? "Grid Builder" : "Date-Time List"}</TabsTrigger>
            <TabsTrigger value="scheduleTypes">Schedule Types</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              {eventType === "recurring" ? (
                // Grid builder for recurring events
                  <div className="flex flex-col lg:flex-row gap-6">
                  {/* X-axis settings */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium flex items-center">
                        <ArrowRight className="h-4 w-4 mr-1" />
                        X-axis items (days, etc.)
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addXItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                      {xAxis.map((item, i) => (
                        <div key={`x-${i}`} className="flex items-center gap-2">
                          <Input
                            ref={(el) => (xAxisRefs.current[i] = el)}
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
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Y-axis settings */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium flex items-center">
                        <ArrowDown className="h-4 w-4 mr-1" />
                        Y-axis items (periods, etc.)
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addYItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                      {yAxis.map((item, i) => (
                        <div key={`y-${i}`} className="flex items-center gap-2">
                          <Input
                            ref={(el) => (yAxisRefs.current[i] = el)}
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
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Date-time list for one-time events
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Date-Time Options
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDateTimeOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
                    {dateTimeOptions.map((item, index) => (
                      <div key={`datetime-${index}`} className="flex items-center gap-2">
                        <Input
                          ref={(el) => (dateTimeRefs.current[index] = el)}
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
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      Enter date-times like "5/1 19:00". Participants will select from this list.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduleTypes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Schedule Type Settings
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addScheduleType}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm text-gray-600">
                  Set schedule types participants can choose. Types marked as "Available" will be counted as available in the summary.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {scheduleTypes.map((type, index) => (
                  <div key={`type-${index}`} className="border rounded-md p-4 bg-white">
                    <div className="flex flex-col gap-3">
                      {/* Label input */}
                      <div className="flex-1">
                        <Label htmlFor={`type-label-${index}`} className="text-xs mb-1 block">
                          Label
                        </Label>
                        <Input
                          ref={(el) => (typeLabelRefs.current[index] = el)}
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
                          placeholder="Schedule type name"
                        />
                      </div>

                      <div className="flex items-end gap-3">
                        {/* ColorSelect */}
                        <div className="flex-1">
                          <Label htmlFor={`type-color-${index}`} className="text-xs mb-1 block">
                            Color
                          </Label>
                          <Select value={type.color} onValueChange={(value) => updateScheduleTypeColor(index, value)}>
                            <SelectTrigger id={`type-color-${index}`} className={`w-full ${type.color}`}>
                              <SelectValue placeholder="Select color" />
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

                        {/* Available flag */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`type-available-${index}`}
                            checked={type.isAvailable}
                            onCheckedChange={(checked) => updateScheduleTypeAvailability(index, checked)}
                          />
                          <Label htmlFor={`type-available-${index}`} className="text-sm">
                            Available
                          </Label>
                        </div>

                        {/* Delete button */}
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

                    {/* Preview */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-500 mb-1">Preview:</div>
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
              {eventType === "recurring" ? (
                // Preview for recurring events (grid)
                <div className="border rounded overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2"></th>
                        {xAxis.map((item, index) => (
                          <th key={`header-${index}`} className="border p-2 text-center min-w-[80px]">
                            {item || `Item${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {yAxis.map((item, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          <td className="border p-2 font-medium text-center">{item || `Item${rowIndex + 1}`}</td>
                          {xAxis.map((_, colIndex) => (
                            <td key={`cell-${rowIndex}-${colIndex}`} className="border p-2 text-center">
                              <Select>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {scheduleTypes.map((type, typeIndex) => (
                                    <SelectItem
                                      key={`preview-type-${typeIndex}`}
                                      value={type.id}
                                      className={type.color}
                                    >
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
              ) : (
                // Preview for one-time events (list)
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md mb-2">
                    <p className="text-sm text-gray-600">
                      Participants will choose one option for each date-time from below.
                    </p>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b font-medium">Example availability input</div>
                    <div className="divide-y">
                      {dateTimeOptions.map((dateTime, index) => (
                        <div key={`preview-datetime-${index}`} className="p-3">
                          <div className="font-medium mb-2">{dateTime}</div>
                          <div className="flex flex-wrap gap-2">
                            {scheduleTypes.map((type, typeIndex) => (
                              <button
                                key={`option-${index}-${typeIndex}`}
                                className={`px-3 py-1 rounded-md ${type.color} hover:opacity-80 transition-opacity`}
                              >
                                {type.label}
                                {type.isAvailable && <Check className="inline-block ml-1 h-3 w-3" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                This is a preview of the input form. The actual form will look like this.
              </p>
            </TabsContent>

            <TabsContent value="templates">
              {eventType === "recurring" ? (
                // Templates for recurring events
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recurringTemplates.map((template, index) => (
                    <Card key={`template-${index}`} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>
                            X-axis: <span className="font-mono">{template.x.join(", ")}</span>
                          </div>
                          <div>
                            Y-axis: <span className="font-mono">{template.y.join(", ")}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => applyRecurringTemplate(index)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use this template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Templates for one-time events
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onetimeTemplates.map((template, index) => (
                    <Card key={`template-${index}`} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>
                            Date-Time Options: <span className="font-mono">{template.options.join(", ")}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => applyOnetimeTemplate(index)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use this template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {eventType && (
          <div className="flex justify-center pt-4">
            <Button type="submit" size="lg" className="px-8">
              <Save className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
