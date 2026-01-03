'use client';

import { useState } from 'react';
import { Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Tile } from '@/lib/types/tiles';
import { useScreenTime } from '@/hooks/useScreenTimeStats';
import { ScreenTimeModal } from './ScreenTimeModal';
import { cn } from '@/lib/utils';

interface ScreenTimeTileProps {
  tile: Tile;
  className?: string;
}

/**
 * ScreenTimeTile - Compact tile showing screen time overview
 *
 * Shows:
 * - Daily average for current week
 * - Week-over-week change indicator
 * - Warning if no data for current week
 *
 * Click opens ScreenTimeModal with full details
 */
export function ScreenTimeTile({ tile, className }: ScreenTimeTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentWeek, hasData, isLoading } = useScreenTime();

  // Determine change direction
  const change = currentWeek?.weekOverWeekChange;
  const changeDirection =
    change != null ? (change > 0 ? 'up' : change < 0 ? 'down' : 'same') : null;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'group relative h-28 p-3 bg-card border border-border rounded-lg',
          'hover:border-muted-foreground/30 transition-all duration-150 cursor-pointer',
          'flex flex-col justify-between',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium truncate">Screen Time</span>
          </div>

          {/* Warning indicator if no data */}
          {!hasData && !isLoading && (
            <div className="w-2 h-2 rounded-full bg-amber-500" title="No data this week" />
          )}
        </div>

        {/* Content */}
        <div className="flex items-end justify-between">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          ) : hasData && currentWeek ? (
            <>
              {/* Daily average */}
              <div>
                <span className="text-2xl font-bold">
                  {currentWeek.dailyAverage || 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/day</span>
              </div>

              {/* Change indicator */}
              {changeDirection && changeDirection !== 'same' && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    changeDirection === 'up' ? 'text-red-500' : 'text-green-500'
                  )}
                >
                  {changeDirection === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {change! > 0 ? '+' : ''}
                    {change}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">No data</span>
            </div>
          )}
        </div>

        {/* Mini category indicator (just show top category color bar) */}
        {hasData && currentWeek?.categories && currentWeek.categories.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden flex">
            {currentWeek.categories.slice(0, 4).map((cat, i) => (
              <div
                key={i}
                className="h-full"
                style={{
                  backgroundColor: cat.color,
                  width: `${cat.percentage}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ScreenTimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default ScreenTimeTile;
