'use client'

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import type { CalendarTask } from '@/lib/notion/calendar'
import { CalendarDayCell } from './CalendarDayCell'

interface CalendarGridProps {
  currentDate: Date
  tasks: CalendarTask[]
  loading: boolean
  onTaskClick: (task: CalendarTask) => void
  onDayClick: (date: string) => void
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Group tasks by their date (YYYY-MM-DD)
 */
function groupTasksByDate(tasks: CalendarTask[]): Map<string, CalendarTask[]> {
  const grouped = new Map<string, CalendarTask[]>()

  for (const task of tasks) {
    if (!task.start) continue

    // Extract just the date part (YYYY-MM-DD)
    const dateKey = task.start.split('T')[0]

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(task)
  }

  // Sort tasks within each day by start time
  grouped.forEach((dayTasks) => {
    dayTasks.sort((a: CalendarTask, b: CalendarTask) => {
      if (!a.start || !b.start) return 0
      return a.start.localeCompare(b.start)
    })
  })

  return grouped
}

export function CalendarGrid({
  currentDate,
  tasks,
  loading,
  onTaskClick,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const tasksByDate = groupTasksByDate(tasks)

  return (
    <div
      role="grid"
      aria-label={`Calendar for ${format(currentDate, 'MMMM yyyy')}`}
      className="select-none"
    >
      {/* Weekday Headers */}
      <div role="row" className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((day, index) => (
          <div
            key={day}
            role="columnheader"
            aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}
            className="text-center text-sm font-medium text-white/60 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[100px] p-1.5 border border-white/5 bg-white/5 animate-pulse"
            >
              <div className="w-7 h-7 rounded-full bg-white/10 mb-2" />
              <div className="space-y-1">
                <div className="h-5 bg-white/10 rounded w-3/4" />
                <div className="h-5 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDate.get(dateKey) || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, today)

            return (
              <CalendarDayCell
                key={dateKey}
                date={day}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                tasks={dayTasks}
                onTaskClick={onTaskClick}
                onDayClick={() => onDayClick(dateKey)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
