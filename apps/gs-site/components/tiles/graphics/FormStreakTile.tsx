'use client';

import { Flame, AlertCircle, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { useFormStats, useFormStreakRisk } from '@/hooks/useFormStats';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface FormStreakTileProps {
  tile: Tile;
  className?: string;
}

/**
 * FormStreakTile - Displays productivity form submission streak
 *
 * Shows:
 * - Current consecutive day streak
 * - Longest streak achieved
 * - Risk indicator if streak might break today
 * - Link to submit today's form
 *
 * Data comes from the custom Productivity Accountability Form via useFormStats hook.
 */
export function FormStreakTile({ tile, className }: FormStreakTileProps) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useFormStats();

  const {
    isAtRisk,
    hoursUntilStreakBreaks,
    currentStreak,
  } = useFormStreakRisk();

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

  return (
    <WarningBorderTrail
      active={tile.actionWarning && currentStreak === 0}
      hoverMessage={currentStreak === 0
        ? tile.actionDesc || 'Start a new streak!'
        : undefined
      }
    >
      <div className={baseClasses} onClick={handleClick} role="button" tabIndex={0}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-foreground truncate">
              Form Streak
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
          {isAtRisk && currentStreak > 0 && !isLoading && (
            <div className="flex items-center gap-1 text-amber-500">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-medium">{hoursUntilStreakBreaks}h</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-12 bg-muted rounded" />
              <div className="h-2 w-20 bg-muted rounded" />
            </div>
          )}

          {error && (
            <div className="text-center">
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
              {/* Streak display */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-3xl font-bold ${
                  currentStreak > 0 ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {currentStreak}
                </span>
                <span className="text-xs text-muted-foreground">
                  day{currentStreak !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Best streak */}
              {stats.streak.longest > currentStreak && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Best: {stats.streak.longest} days</span>
                </div>
              )}

              {/* Status message */}
              <div className="text-[10px] text-muted-foreground mt-auto">
                {currentStreak === 0 ? (
                  <span className="text-amber-500">Start a new streak!</span>
                ) : isAtRisk ? (
                  <span className="text-amber-500">Submit today to continue</span>
                ) : (
                  <span className="text-green-500">Streak active</span>
                )}
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

export default FormStreakTile;
