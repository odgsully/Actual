'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, Tag as TagIcon } from 'lucide-react'

interface EventEntry {
  id: string
  title: string
  tags: string[]
  body: string
  created_at: string
  client_id?: string | null
}

interface EventFeedProps {
  events: EventEntry[]
  isLoading?: boolean
  emptyMessage?: string
}

export function EventFeed({ events, isLoading, emptyMessage = 'No events yet' }: EventFeedProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isExpanded = expandedEvents.has(event.id)

        return (
          <div
            key={event.id}
            className="bg-white border-2 border-gray-200 rounded-lg hover:border-brand-red transition-colors"
          >
            {/* Collapsed View - Title Only */}
            <button
              onClick={() => toggleEvent(event.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                {!isExpanded && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.created_at)}</span>
                    {event.tags.length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <TagIcon className="w-4 h-4" />
                        <span>{event.tags.length} tag{event.tags.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded View - Tags and Body */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {/* Metadata */}
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.created_at)}</span>
                  {event.client_id && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Client-specific
                      </span>
                    </>
                  )}
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-red text-white rounded-full text-sm font-medium"
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Body */}
                {event.body && (
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{event.body}</p>
                    </div>
                  </div>
                )}

                {!event.body && (
                  <p className="text-sm text-gray-400 italic">No additional details provided</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
