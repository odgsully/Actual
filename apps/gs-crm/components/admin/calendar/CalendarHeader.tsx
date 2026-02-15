'use client'

import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarHeaderProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onAddTask: () => void
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAddTask,
}: CalendarHeaderProps) {
  const monthYear = format(currentDate, 'MMMM yyyy')
  const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(currentDate, 'yyyy-MM')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title and Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-red" />
          <h1 className="text-2xl font-bold text-white">{monthYear}</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevMonth}
            className="glass-button h-8 w-8"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="glass-button h-8 w-8"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            onClick={onToday}
            className="glass-button"
          >
            Today
          </Button>
        )}
        <Button
          onClick={onAddTask}
          className="bg-brand-red hover:bg-brand-red-hover text-white transition-all duration-700 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  )
}
