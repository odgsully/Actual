'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { WarningBorderTrail } from './WarningBorderTrail';
import type { TileComponentProps } from './TileRegistry';

/**
 * Simple inline calendar display for tile preview
 */
function MiniCalendar({ selectedDate }: { selectedDate: Date }) {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Generate day cells
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-4 h-4" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    const isSelected =
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear();

    days.push(
      <div
        key={day}
        className={`
          w-4 h-4 text-[8px] flex items-center justify-center rounded-sm
          ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
          ${isSelected && !isToday ? 'bg-accent' : ''}
          ${!isToday && !isSelected ? 'text-muted-foreground' : ''}
        `}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Month header */}
      <div className="text-[10px] text-muted-foreground text-center mb-1">
        {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="w-4 h-3 text-[7px] text-muted-foreground text-center">
            {d}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}

/**
 * Event item in expanded view
 */
interface CalendarEvent {
  id: string;
  title: string;
  time?: string;
  type?: 'meeting' | 'task' | 'reminder' | 'deadline';
}

/**
 * CalendarTile - Date picker with hover popup for events
 *
 * Shows a compact calendar view that expands on hover/focus to show
 * full event details. Used for scheduling tiles like:
 * - GS socials Scheduler
 * - Accountability Report
 * - Multi-wk Phase Form
 *
 * Features:
 * - Mini calendar preview
 * - Hover popup with full details
 * - Mobile: tap to expand
 * - Keyboard accessible
 */
export function CalendarTile({ tile, className }: TileComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock events - in production these would come from Notion/API
  const events: CalendarEvent[] = [
    { id: '1', title: 'Morning standup', time: '9:00 AM', type: 'meeting' },
    { id: '2', title: 'Review PR #123', type: 'task' },
    { id: '3', title: 'Submit report', time: '5:00 PM', type: 'deadline' },
  ];

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[7rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div
        className={baseClasses}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
        role="button"
        tabIndex={0}
        aria-label={`${tile.name} calendar`}
        aria-expanded={isExpanded}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-medium text-foreground truncate flex-1">
            {tile.name}
          </h3>
        </div>

        {/* Mini Calendar Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <MiniCalendar selectedDate={selectedDate} />
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}

        {/* Expanded popup */}
        {isExpanded && (
          <div
            className="
              absolute left-0 top-full mt-2 z-50
              w-72 p-4
              bg-popover border border-border rounded-lg shadow-lg
              animate-in fade-in-0 zoom-in-95
            "
            role="dialog"
            aria-label="Calendar details"
          >
            {/* Full calendar header */}
            <div className="flex items-center justify-between mb-3">
              <button
                className="p-1 hover:bg-accent rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)));
                }}
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                className="p-1 hover:bg-accent rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)));
                }}
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today's events */}
            <div className="border-t border-border pt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Today&apos;s Events
              </h4>
              {events.length > 0 ? (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div
                        className={`
                          w-2 h-2 rounded-full mt-1.5
                          ${event.type === 'deadline' ? 'bg-red-500' : ''}
                          ${event.type === 'meeting' ? 'bg-blue-500' : ''}
                          ${event.type === 'task' ? 'bg-green-500' : ''}
                          ${event.type === 'reminder' ? 'bg-yellow-500' : ''}
                          ${!event.type ? 'bg-muted-foreground' : ''}
                        `}
                      />
                      <div className="flex-1">
                        <span className="text-foreground">{event.title}</span>
                        {event.time && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No events today</p>
              )}
            </div>

            {/* Description */}
            {tile.desc && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {tile.desc}
              </p>
            )}
          </div>
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default CalendarTile;
