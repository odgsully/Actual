'use client'

import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import type { CalendarTask } from '@/lib/notion/calendar'
import { CalendarEventCard } from './CalendarEventCard'

interface CalendarDayCellProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: CalendarTask[]
  onTaskClick: (task: CalendarTask) => void
  onDayClick: () => void
}

const MAX_VISIBLE_TASKS = 3

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  onTaskClick,
  onDayClick,
}: CalendarDayCellProps) {
  const dayNumber = format(date, 'd')
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS)
  const hiddenCount = tasks.length - MAX_VISIBLE_TASKS
  const ariaLabel = `${format(date, 'EEEE, MMMM d')}. ${tasks.length} task${tasks.length !== 1 ? 's' : ''}.`

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={onDayClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDayClick()
        }
      }}
      className={`
        min-h-[100px] p-1.5 border border-white/5 cursor-pointer
        transition-all duration-300 group relative
        ${isCurrentMonth ? 'bg-white/5' : 'bg-black/20'}
        ${isToday ? 'ring-2 ring-brand-red ring-inset' : ''}
        hover:bg-white/10
      `}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
            ${isToday ? 'bg-brand-red text-white' : ''}
            ${isCurrentMonth ? 'text-white' : 'text-white/40'}
          `}
        >
          {dayNumber}
        </span>

        {/* Add button on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
        {visibleTasks.map((task) => (
          <CalendarEventCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            compact={tasks.length > 2}
          />
        ))}

        {/* Overflow indicator */}
        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Could open a popover with all tasks
              if (tasks[MAX_VISIBLE_TASKS]) {
                onTaskClick(tasks[MAX_VISIBLE_TASKS])
              }
            }}
            className="w-full text-left px-2 py-0.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  )
}
