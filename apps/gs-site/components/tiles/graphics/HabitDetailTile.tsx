'use client';

import { useState, useCallback } from 'react';
import { Flame, TrendingUp, X, Loader2 } from 'lucide-react';
import { useHabitDetail, type HabitDetail } from '@/hooks/useHabitDetail';
import type { TileComponentProps } from '../TileRegistry';

/**
 * HabitDetailTile - Compact tile showing top habit streak
 *
 * Displays:
 * - Top habit by current streak
 * - Mini 7-day indicator dots
 * - Opens modal with full habit details on click
 */
export function HabitDetailTile({ tile, className }: TileComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { habits, isLoading, isError } = useHabitDetail();

  const topHabit = habits.length > 0 ? habits[0] : null;

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement === e.currentTarget) {
          e.preventDefault();
          handleOpen();
        }
      }
    },
    [handleClose, handleOpen]
  );

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-orange-500/10 to-red-500/10
    border border-orange-500/30
    rounded-lg
    hover:from-orange-500/20 hover:to-red-500/20
    hover:border-orange-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-orange-500
    focus:ring-offset-2
    ${className ?? ''}
  `.trim();

  return (
    <>
      <div
        className={baseClasses}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Open ${tile.name} details`}
        aria-haspopup="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Flame className="w-5 h-5 text-orange-500" />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-end">
          {isError ? (
            <p className="text-xs text-red-400">Failed to load</p>
          ) : isLoading ? (
            <div className="space-y-1">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ) : topHabit ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{topHabit.emoji}</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {topHabit.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-500">
                  {topHabit.currentStreak}
                </span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
              {/* 7-day dots */}
              <div className="flex gap-1 mt-1.5">
                {topHabit.last7Days.slice(0, 7).map((completed, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      completed
                        ? 'bg-orange-500'
                        : 'bg-muted-foreground/30'
                    }`}
                    title={completed ? 'Completed' : 'Not completed'}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No habits tracked</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <HabitDetailModal
          habits={habits}
          isLoading={isLoading}
          onClose={handleClose}
        />
      )}
    </>
  );
}

/**
 * HabitDetailModal - Full detail view of all habits
 */
function HabitDetailModal({
  habits,
  isLoading,
  onClose,
}: {
  habits: HabitDetail[];
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          relative
          w-full max-w-2xl
          max-h-[90vh]
          m-4
          bg-background
          border border-border
          rounded-xl
          shadow-2xl
          overflow-hidden
          animate-in fade-in-0 zoom-in-95
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-orange-500/10 to-red-500/10">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 id="habit-detail-title" className="text-lg font-semibold">
              Habit Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No habits found
            </p>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <HabitRow key={habit.name} habit={habit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * HabitRow - Individual habit display in the modal
 */
function HabitRow({ habit }: { habit: HabitDetail }) {
  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{habit.emoji}</span>
          <span className="font-medium text-foreground">{habit.name}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="w-4 h-4" />
          <span className="font-bold">{habit.currentStreak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* 7-day dots */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-muted-foreground w-16">Last 7 days</span>
        <div className="flex gap-1.5">
          {habit.last7Days.slice(0, 7).map((completed, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                completed
                  ? 'bg-orange-500'
                  : 'bg-muted-foreground/30'
              }`}
              title={`${7 - i} days ago: ${completed ? 'Completed' : 'Not completed'}`}
            />
          ))}
          {/* Fill remaining dots if less than 7 */}
          {Array.from({ length: Math.max(0, 7 - habit.last7Days.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-3 h-3 rounded-full bg-muted-foreground/20"
            />
          ))}
        </div>
      </div>

      {/* 2026 Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">2026 Completion</span>
          <span className="font-medium">
            {habit.completionRate2026}%
            <span className="text-muted-foreground ml-1">
              ({habit.completedDays2026}/{habit.totalDays2026} days)
            </span>
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${habit.completionRate2026}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>Best: {habit.longestStreak} days</span>
        </div>
        <div>7d: {habit.completionRate7Days}%</div>
        <div>30d: {habit.completionRate30Days}%</div>
      </div>
    </div>
  );
}

export default HabitDetailTile;
