'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { X, Calendar, Clock, Tag, FileText, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { CreateTaskInput, CalendarTask } from '@/lib/notion/calendar'

interface CreateTaskModalProps {
  isOpen: boolean
  defaultDate: string | null // YYYY-MM-DD from day click
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<void>
  isCreating?: boolean
}

const PRIORITY_OPTIONS: Array<{ value: CalendarTask['priority']; label: string; color: string }> = [
  { value: 'S Tier', label: 'S Tier', color: 'bg-blue-500/30 text-blue-400 border-blue-400' },
  { value: 'A Tier', label: 'A Tier', color: 'bg-white/20 text-white border-white/40' },
  { value: 'B Tier', label: 'B Tier', color: 'bg-orange-500/30 text-orange-400 border-orange-400' },
  { value: 'C tier', label: 'C Tier', color: 'bg-amber-700/30 text-amber-400 border-amber-400' },
]

const TAG_OPTIONS = [
  { value: 'HABIT', color: 'bg-purple-500/30 text-purple-400' },
  { value: 'NETWORK', color: 'bg-red-500/30 text-red-400' },
  { value: 'PROMPT', color: 'bg-pink-500/30 text-pink-400' },
  { value: 'DEEP RESEARCH', color: 'bg-blue-500/30 text-blue-400' },
  { value: 'PERSONAL', color: 'bg-green-500/30 text-green-400' },
  { value: 'ORGANIZED', color: 'bg-orange-500/30 text-orange-400' },
]

export function CreateTaskModal({
  isOpen,
  defaultDate,
  onClose,
  onCreate,
  isCreating = false,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<CalendarTask['priority']>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [minsExpected, setMinsExpected] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDate(defaultDate || format(new Date(), 'yyyy-MM-dd'))
      setStartTime('')
      setEndTime('')
      setPriority(null)
      setSelectedTags([])
      setNotes('')
      setMinsExpected('')
    }
  }, [isOpen, defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !date) return

    // Build the start datetime
    let start = date
    if (startTime) {
      start = `${date}T${startTime}:00`
    }

    // Build the end datetime (optional)
    let end: string | undefined
    if (endTime) {
      end = `${date}T${endTime}:00`
    }

    const input: CreateTaskInput = {
      title: title.trim(),
      start,
      ...(end && { end }),
      ...(priority && { priority }),
      ...(selectedTags.length > 0 && { tags: selectedTags }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(minsExpected && { minsExpected: parseInt(minsExpected) }),
    }

    await onCreate(input)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">New Task</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Task Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="glass-input"
                autoFocus
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Date *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Time (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1.5" />
                  Start Time
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  End Time
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(priority === opt.value ? null : opt.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-300
                      ${priority === opt.value ? opt.color + ' border-current' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
                      ${selectedTags.includes(tag.value) ? tag.color : 'bg-white/5 text-white/60 hover:bg-white/10'}
                    `}
                  >
                    {tag.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                <Timer className="w-4 h-4 inline mr-1.5" />
                Expected Duration (minutes)
              </label>
              <Input
                type="number"
                value={minsExpected}
                onChange={(e) => setMinsExpected(e.target.value)}
                placeholder="e.g., 30"
                min="1"
                className="glass-input w-32"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1.5" />
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full glass-input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="glass-button"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-red hover:bg-brand-red-hover text-white"
                disabled={!title.trim() || !date || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
