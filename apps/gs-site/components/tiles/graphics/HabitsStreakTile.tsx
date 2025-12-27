'use client';

import { Flame, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useHabitsStreak, useHabitsHeatmap } from '@/hooks/useHabitsData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface HabitsStreakTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Mini heatmap grid showing habit completion
 */
function MiniHeatmap({ data }: { data: Array<{ date: string; completedCount: number; totalCount: number }> }) {
  // Show last 28 days in a 7x4 grid
  const last28Days = data.slice(-28);

  // Pad with empty days if less than 28
  while (last28Days.length < 28) {
    last28Days.unshift({ date: '', completedCount: 0, totalCount: 0 });
  }

  return (
    <div className="grid grid-cols-7 gap-0.5">
      {last28Days.map((day, i) => {
        const intensity =
          day.totalCount > 0
            ? Math.min(day.completedCount / day.totalCount, 1)
            : 0;

        return (
          <div
            key={i}
            className={`
              w-2 h-2 rounded-sm
              ${!day.date ? 'bg-muted/30' : ''}
              ${day.date && intensity === 0 ? 'bg-muted' : ''}
              ${day.date && intensity > 0 && intensity < 0.5 ? 'bg-green-300 dark:bg-green-800' : ''}
              ${day.date && intensity >= 0.5 && intensity < 1 ? 'bg-green-500 dark:bg-green-600' : ''}
              ${day.date && intensity === 1 ? 'bg-green-600 dark:bg-green-500' : ''}
            `}
            title={day.date ? `${day.date}: ${day.completedCount}/${day.totalCount}` : ''}
          />
        );
      })}
    </div>
  );
}

/**
 * HabitsStreakTile - Displays habit streaks with mini heatmap
 *
 * Shows:
 * - Current best streak with flame icon
 * - 7-day completion rate
 * - Mini heatmap of last 28 days
 *
 * Data comes from Notion Habits database via useHabitsStreak hook.
 */
export function HabitsStreakTile({ tile, className }: HabitsStreakTileProps) {
  const {
    data: streaks,
    isLoading: streaksLoading,
    error: streaksError,
    refetch: refetchStreaks,
  } = useHabitsStreak();

  const {
    data: heatmap,
    isLoading: heatmapLoading,
    error: heatmapError,
  } = useHabitsHeatmap(28);

  const isLoading = streaksLoading || heatmapLoading;
  const error = streaksError || heatmapError;

  // Get top streak
  const topStreak = streaks?.[0];

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
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-foreground truncate">
              Habits
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-2 w-24 bg-muted rounded" />
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              <button
                onClick={() => refetchStreaks()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Streak display */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-foreground">
                  {topStreak?.currentStreak ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  day streak
                </span>
              </div>

              {/* Completion rate */}
              {topStreak && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>{topStreak.completionRate7Days}% this week</span>
                </div>
              )}

              {/* Mini heatmap */}
              {heatmap && heatmap.length > 0 && (
                <div className="mt-auto">
                  <MiniHeatmap data={heatmap} />
                </div>
              )}
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

export default HabitsStreakTile;
