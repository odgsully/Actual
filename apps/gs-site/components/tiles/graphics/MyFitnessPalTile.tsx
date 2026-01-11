'use client';

import { useState } from 'react';
import {
  Apple,
  AlertCircle,
  RefreshCw,
  Flame,
  Link as LinkIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react';
import { useMyFitnessPalStats } from '@/hooks/useMyFitnessPalStats';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { MyFitnessPalModal } from './MyFitnessPalModal';
import type { Tile } from '@/lib/types/tiles';

interface MyFitnessPalTileProps {
  tile: Tile;
  className?: string;
}

/**
 * MyFitnessPalTile - Displays food diary summary from MyFitnessPal
 *
 * Compact tile (h-28) showing:
 * - Today's/Yesterday's calories with progress bar
 * - Streak (consecutive days logged)
 * - Connection status
 *
 * Click opens modal for detailed view and settings.
 */
export function MyFitnessPalTile({ tile, className }: MyFitnessPalTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    isLoading,
    error,
    refetch,
    isConnected,
    todayCalories,
    todayGoal,
    caloriePercent,
    streak,
    needsReconnect,
    isYesterdayData,
    // New rolling average fields
    last7DaysAvg,
    last7DaysProtein,
    last7DaysCount,
    weekOverWeekChange,
    lastLoggedDate,
    daysSinceLastLog,
    hasHistoricalData,
  } = useMyFitnessPalStats();

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
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
    setIsModalOpen(true);
  };

  // Determine warning state
  const showWarning = tile.actionWarning || needsReconnect || !isConnected;

  // Progress bar color based on percentage
  const getProgressColor = (percent: number | null): string => {
    if (percent === null) return 'bg-muted';
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 80) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <WarningBorderTrail
        active={showWarning}
        hoverMessage={
          needsReconnect
            ? 'Session expired. Click to reconnect.'
            : !isConnected
            ? 'Click to connect MyFitnessPal'
            : tile.actionDesc || undefined
        }
      >
        <div
          className={baseClasses}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Apple
                className={`w-4 h-4 ${
                  isConnected ? 'text-green-500' : 'text-muted-foreground'
                }`}
              />
              <span className="text-xs font-medium text-foreground truncate">
                MyFitnessPal
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isLoading && (
                <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
              )}
              {needsReconnect && (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            {isLoading && (
              <div className="space-y-2 animate-pulse">
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
              </div>
            )}

            {error && (
              <div className="text-center">
                <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Error loading</p>
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

            {!isLoading && !error && !isConnected && (
              <div className="text-center">
                <LinkIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Not connected</p>
                <p className="text-[10px] text-primary mt-0.5">Click to connect</p>
              </div>
            )}

            {!isLoading && !error && isConnected && needsReconnect && (
              <div className="text-center">
                <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Session expired
                </p>
                <p className="text-[10px] text-primary mt-0.5">Click to reconnect</p>
              </div>
            )}

            {!isLoading && !error && isConnected && !needsReconnect && (
              <>
                {/* Priority 1: Show today/yesterday data if available */}
                {todayCalories !== null ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xl font-bold text-foreground">
                        {todayCalories.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {(todayGoal || 2000).toLocaleString()} cal
                      </span>
                      {isYesterdayData && (
                        <span className="text-[9px] px-1 py-0.5 bg-muted text-muted-foreground rounded ml-1">
                          yesterday
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full transition-all duration-300 ${getProgressColor(
                          caloriePercent
                        )}`}
                        style={{ width: `${Math.min(caloriePercent || 0, 100)}%` }}
                      />
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>
                        {streak} day{streak !== 1 ? 's' : ''} streak
                      </span>
                    </div>
                  </>
                ) : hasHistoricalData ? (
                  /* Priority 2: Show rolling averages if we have ANY historical data */
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-lg font-bold text-foreground">
                        {last7DaysAvg.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        cal/day avg
                      </span>
                    </div>

                    {/* Week-over-week change */}
                    <div className="flex items-center gap-1 mb-1.5">
                      {weekOverWeekChange > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : weekOverWeekChange < 0 ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span
                        className={`text-xs ${
                          weekOverWeekChange > 0
                            ? 'text-green-500'
                            : weekOverWeekChange < 0
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {weekOverWeekChange > 0 ? '+' : ''}
                        {weekOverWeekChange}% vs prev week
                      </span>
                    </div>

                    {/* Last logged + streak */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {daysSinceLastLog === 0
                            ? 'Today'
                            : daysSinceLastLog === 1
                            ? 'Yesterday'
                            : `${daysSinceLastLog}d ago`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{streak}d</span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Priority 3: No data at all - show upload prompt */
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No data yet</p>
                    <p className="text-xs text-primary">Click to upload MFP export</p>
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

      {/* Modal */}
      <MyFitnessPalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default MyFitnessPalTile;
