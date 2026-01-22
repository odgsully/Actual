'use client'

import { format, parseISO } from 'date-fns'
import type { CalendarTask } from '@/lib/notion/calendar'

interface CalendarEventCardProps {
  task: CalendarTask
  onClick: () => void
  compact?: boolean
}

/**
 * Get priority-based CSS classes
 */
function getPriorityClasses(priority: CalendarTask['priority']): string {
  switch (priority) {
    case 'S Tier':
      return 'bg-blue-500/30 border-l-2 border-blue-400 text-blue-100'
    case 'A Tier':
      return 'bg-white/20 border-l-2 border-white/40 text-white'
    case 'B Tier':
      return 'bg-orange-500/30 border-l-2 border-orange-400 text-orange-100'
    case 'C tier':
      return 'bg-amber-700/30 border-l-2 border-amber-400 text-amber-100'
    default:
      return 'bg-white/10 border-l-2 border-white/20 text-white'
  }
}

/**
 * Format time for display (e.g., "2:30p")
 */
function formatTaskTime(isoString: string): string {
  const date = parseISO(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'p' : 'a'
  const displayHours = hours % 12 || 12

  if (minutes === 0) {
    return `${displayHours}${ampm}`
  }
  return `${displayHours}:${String(minutes).padStart(2, '0')}${ampm}`
}

export function CalendarEventCard({ task, onClick, compact = false }: CalendarEventCardProps) {
  const priorityClasses = getPriorityClasses(task.priority)
  const showTime = task.start && !task.allDay

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full text-left px-1.5 py-0.5 rounded text-xs cursor-pointer
          transition-all duration-300 hover:scale-[1.02] hover:brightness-110
          truncate ${priorityClasses}
        `}
        title={task.title}
      >
        {task.title}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-2 py-1 rounded-lg text-xs cursor-pointer
        transition-all duration-300 hover:scale-[1.02] hover:brightness-110
        ${priorityClasses}
      `}
    >
      <div className="flex items-center gap-1.5">
        {showTime && (
          <span className="text-white/60 font-mono text-[10px] shrink-0">
            {formatTaskTime(task.start!)}
          </span>
        )}
        <span className="truncate font-medium">{task.title}</span>
      </div>
      {!compact && task.tags.length > 0 && (
        <div className="flex gap-1 mt-0.5">
          {task.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
