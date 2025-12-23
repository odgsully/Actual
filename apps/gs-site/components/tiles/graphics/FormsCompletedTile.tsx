'use client';

import { ClipboardCheck, AlertCircle, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { useFormStats } from '@/hooks/useFormStats';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface FormsCompletedTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Progress ring component for weekly completion
 */
function ProgressRing({ completed, total, size = 48 }: { completed: number; total: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((completed / total) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            percentage >= 100
              ? 'text-green-500'
              : percentage >= 70
              ? 'text-blue-500'
              : percentage >= 40
              ? 'text-amber-500'
              : 'text-red-500'
          }`}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{completed}/{total}</span>
      </div>
    </div>
  );
}

/**
 * FormsCompletedTile - Displays weekly form completion progress
 *
 * Shows:
 * - Forms completed this week (out of 7)
 * - Progress ring visualization
 * - Average mood and calendar grade
 * - Deep work hours average
 *
 * Data comes from the custom Productivity Accountability Form via useFormStats hook.
 */
export function FormsCompletedTile({ tile, className }: FormsCompletedTileProps) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useFormStats();

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

  const handleClick = () => {
    // Navigate to the productivity form
    window.location.href = '/new-form';
  };

  // Calculate if behind schedule (should have more submissions by this day of week)
  const getDayOfWeek = () => {
    const day = new Date().getDay();
    // Convert to Monday-based (1=Mon, 7=Sun)
    return day === 0 ? 7 : day;
  };

  const dayOfWeek = getDayOfWeek();
  const expectedByNow = dayOfWeek;
  const isBehind = stats ? stats.thisWeek.completed < expectedByNow : false;

  return (
    <WarningBorderTrail
      active={tile.actionWarning || isBehind}
      hoverMessage={isBehind
        ? `Behind schedule: ${stats?.thisWeek.completed || 0} of ${expectedByNow} expected by today`
        : tile.actionDesc
      }
    >
      <div className={baseClasses} onClick={handleClick} role="button" tabIndex={0}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-foreground truncate">
              This Week
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center gap-3">
          {isLoading && (
            <div className="flex-1 space-y-2 animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-full" />
            </div>
          )}

          {error && (
            <div className="flex-1 text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refetch();
                }}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && stats && (
            <>
              {/* Progress ring */}
              <ProgressRing
                completed={stats.thisWeek.completed}
                total={stats.thisWeek.target}
                size={48}
              />

              {/* Stats column */}
              <div className="flex-1 space-y-1">
                {/* Percentage */}
                <div className="text-lg font-bold text-foreground">
                  {stats.thisWeek.percentage}%
                </div>

                {/* Averages */}
                <div className="space-y-0.5">
                  {stats.averages.mood && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Mood:</span>
                      <span className="font-medium text-foreground">{stats.averages.mood}</span>
                    </div>
                  )}
                  {stats.averages.calendarGrade && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Calendar:</span>
                      <span className="font-medium text-foreground">{stats.averages.calendarGrade}</span>
                    </div>
                  )}
                  {stats.averages.deepWorkHoursPerDay && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="font-medium text-foreground">
                        {stats.averages.deepWorkHoursPerDay}h
                      </span>
                      <span>/day</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default FormsCompletedTile;
