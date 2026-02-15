'use client'

import { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CalendarHeader,
  CalendarGrid,
  CreateTaskModal,
  TaskSlideOut,
} from '@/components/admin/calendar'
import {
  useCalendarTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  usePrefetchAdjacentMonths,
} from '@/lib/query/calendar'
import type { CalendarTask, CreateTaskInput, UpdateTaskInput } from '@/lib/notion/calendar'

export default function CalendarPage() {
  // Current month being viewed
  const [currentDate, setCurrentDate] = useState(new Date())

  // Selected task for slide-out
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null)
  const [slideOutOpen, setSlideOutOpen] = useState(false)

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createDate, setCreateDate] = useState<string | null>(null)

  // Calculate date range for current month
  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useCalendarTasks(startDate, endDate)

  // Mutations
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Prefetch adjacent months on hover
  const { prefetchPrevMonth, prefetchNextMonth } = usePrefetchAdjacentMonths(currentDate)

  // Announcement for screen readers
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (!isLoading && tasks) {
      setAnnouncement(
        `${format(currentDate, 'MMMM yyyy')}. ${tasks.length} task${tasks.length !== 1 ? 's' : ''} scheduled.`
      )
    }
  }, [currentDate, tasks, isLoading])

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Task handlers
  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task)
    setSlideOutOpen(true)
  }

  const handleDayClick = (date: string) => {
    setCreateDate(date)
    setCreateModalOpen(true)
  }

  const handleTaskCreate = async (input: CreateTaskInput) => {
    await createTask.mutateAsync(input)
    setCreateModalOpen(false)
    setCreateDate(null)
  }

  const handleTaskUpdate = async (input: UpdateTaskInput) => {
    const result = await updateTask.mutateAsync(input)
    // Update the selected task with the new data
    if (result) {
      setSelectedTask(result)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId)
    setSlideOutOpen(false)
    setSelectedTask(null)
  }

  return (
    <div className="space-y-6">
      {/* Screen reader announcement */}
      <div
        id="calendar-announcement"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Header Card */}
      <Card className="glass-card p-6">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onAddTask={() => setCreateModalOpen(true)}
        />
      </Card>

      {/* Error State */}
      {error && (
        <Card className="glass-card p-6 border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium">Failed to load tasks</p>
              <p className="text-white/60 text-sm">{(error as Error).message}</p>
            </div>
            <Button
              onClick={() => refetch()}
              className="glass-button"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card
        className="glass-card p-6"
        onMouseEnter={() => {
          // Prefetch adjacent months when user hovers over calendar
          prefetchPrevMonth()
          prefetchNextMonth()
        }}
      >
        <CalendarGrid
          currentDate={currentDate}
          tasks={tasks}
          loading={isLoading}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
        />
      </Card>

      {/* Task Slide-Out */}
      <TaskSlideOut
        isOpen={slideOutOpen}
        task={selectedTask}
        onClose={() => {
          setSlideOutOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        isUpdating={updateTask.isPending}
        isDeleting={deleteTask.isPending}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        defaultDate={createDate}
        onClose={() => {
          setCreateModalOpen(false)
          setCreateDate(null)
        }}
        onCreate={handleTaskCreate}
        isCreating={createTask.isPending}
      />
    </div>
  )
}
