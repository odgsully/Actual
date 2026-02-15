'use client'

import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import {
  X,
  Calendar,
  Clock,
  Tag,
  FileText,
  Timer,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CalendarTask, UpdateTaskInput } from '@/lib/notion/calendar'

interface TaskSlideOutProps {
  isOpen: boolean
  task: CalendarTask | null
  onClose: () => void
  onUpdate: (input: UpdateTaskInput) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  isUpdating?: boolean
  isDeleting?: boolean
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

/**
 * Extract date and time from ISO string
 */
function parseDateTime(isoString: string | null): { date: string; time: string } {
  if (!isoString) return { date: '', time: '' }

  if (!isoString.includes('T')) {
    return { date: isoString, time: '' }
  }

  const parsed = parseISO(isoString)
  return {
    date: format(parsed, 'yyyy-MM-dd'),
    time: format(parsed, 'HH:mm'),
  }
}

export function TaskSlideOut({
  isOpen,
  task,
  onClose,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: TaskSlideOutProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<CalendarTask['priority']>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [minsExpected, setMinsExpected] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      const { date: taskDate, time: taskTime } = parseDateTime(task.start)
      setDate(taskDate)
      setStartTime(taskTime)
      const { time: endTaskTime } = parseDateTime(task.end)
      setEndTime(endTaskTime)
      setPriority(task.priority)
      setSelectedTags(task.tags)
      setNotes(task.notes)
      setMinsExpected(task.minsExpected?.toString() || '')
      setHasChanges(false)
      setShowDeleteConfirm(false)
    }
  }, [task])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement
      const firstInput = panelRef.current?.querySelector<HTMLElement>('input, button')
      firstInput?.focus()
    } else if (previousFocus.current) {
      previousFocus.current.focus()
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const markChanged = () => setHasChanges(true)

  const handleSave = async () => {
    if (!task || !hasChanges) return

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

    const input: UpdateTaskInput = {
      id: task.id,
      title: title.trim(),
      start,
      end,
      priority: priority || undefined,
      tags: selectedTags,
      notes: notes.trim(),
      minsExpected: minsExpected ? parseInt(minsExpected) : undefined,
    }

    await onUpdate(input)
    setHasChanges(false)
  }

  const handleDelete = async () => {
    if (!task) return
    await onDelete(task.id)
    setShowDeleteConfirm(false)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
    markChanged()
  }

  if (!isOpen || !task) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideout-title"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-xl z-10">
          <h2 id="slideout-title" className="text-xl font-bold text-white">
            Task Details
          </h2>
          <div className="flex items-center gap-2">
            {task.notionUrl && (
              <a
                href={task.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Open in Notion"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Task Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              placeholder="Enter task title..."
              className="glass-input"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); markChanged() }}
              className="glass-input"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); markChanged() }}
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
                onChange={(e) => { setEndTime(e.target.value); markChanged() }}
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
                  onClick={() => { setPriority(priority === opt.value ? null : opt.value); markChanged() }}
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
              onChange={(e) => { setMinsExpected(e.target.value); markChanged() }}
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
              onChange={(e) => { setNotes(e.target.value); markChanged() }}
              placeholder="Add notes..."
              rows={4}
              className="w-full glass-input resize-none"
            />
          </div>

          {/* Meta info */}
          <div className="text-xs text-white/40 pt-2">
            Created: {task.createdAt ? format(parseISO(task.createdAt), 'MMM d, yyyy h:mm a') : 'Unknown'}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 sticky bottom-0 bg-gray-900/95 backdrop-blur-xl">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Delete this task? This cannot be undone.</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="glass-button flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                disabled={isUpdating}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={handleSave}
                className="bg-brand-red hover:bg-brand-red-hover text-white"
                disabled={!hasChanges || isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
