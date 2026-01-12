'use client';

import { useState } from 'react';
import { Phone, PhoneOutgoing, PhoneIncoming, PhoneMissed, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Tile } from '@/lib/types/tiles';
import { useCallLog } from '@/hooks/useCallLogStats';
import { CallLogModal } from './CallLogModal';
import { cn } from '@/lib/utils';

interface CallLogTileProps {
  tile: Tile;
  className?: string;
}

/**
 * CallLogTile - Compact tile showing call statistics
 *
 * Shows:
 * - Total outbound calls this week
 * - Inbound and missed counts
 * - Week-over-week change indicator
 *
 * Click opens CallLogModal with full details
 */
export function CallLogTile({ tile, className }: CallLogTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentWeek, hasData, isLoading } = useCallLog();

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
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium truncate">Call Log</span>
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
              {/* Main stat - outbound calls */}
              <div>
                <span className="text-2xl font-bold">
                  {currentWeek.outboundCount}
                </span>
                <span className="text-xs text-muted-foreground ml-1">outbound</span>
              </div>

              {/* Change indicator */}
              {changeDirection && changeDirection !== 'same' && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    changeDirection === 'up' ? 'text-green-500' : 'text-red-500'
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
              <span className="text-sm">Upload screenshot</span>
            </div>
          )}
        </div>

        {/* Mini stats bar */}
        {hasData && currentWeek && (
          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden flex">
            {/* Outbound - green */}
            <div
              className="h-full bg-green-500"
              style={{
                width: `${(currentWeek.outboundCount / currentWeek.totalCalls) * 100}%`,
              }}
            />
            {/* Inbound - blue */}
            <div
              className="h-full bg-blue-500"
              style={{
                width: `${(currentWeek.inboundCount / currentWeek.totalCalls) * 100}%`,
              }}
            />
            {/* Missed - red */}
            <div
              className="h-full bg-red-500"
              style={{
                width: `${(currentWeek.missedCount / currentWeek.totalCalls) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Hover overlay with secondary stats */}
        {hasData && currentWeek && (
          <div className="absolute inset-0 bg-card/95 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-lg p-3 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-600">
                <PhoneOutgoing className="w-3.5 h-3.5" />
                Outbound
              </span>
              <span className="font-medium">{currentWeek.outboundCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-blue-600">
                <PhoneIncoming className="w-3.5 h-3.5" />
                Inbound
              </span>
              <span className="font-medium">{currentWeek.inboundCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-red-600">
                <PhoneMissed className="w-3.5 h-3.5" />
                Missed
              </span>
              <span className="font-medium">{currentWeek.missedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CallLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default CallLogTile;
