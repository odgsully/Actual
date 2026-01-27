'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CalendarRange } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import type { Tile } from '@/lib/types/tiles';

interface FormTimingTileProps {
  tile: Tile;
  className?: string;
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Calculate days until the next 1st of the month (Monthly form deadline)
 */
function getDaysUntilNextMonthly(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // If today is the 1st, next deadline is next month's 1st
  let nextDeadline: Date;
  if (now.getDate() === 1) {
    nextDeadline = new Date(year, month + 1, 1);
  } else {
    nextDeadline = new Date(year, month + 1, 1);
  }

  // Calculate difference in days
  const diffTime = nextDeadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until the next quarter start (Jan 1, Apr 1, Jul 1, Oct 1)
 */
function getDaysUntilNextQuarterly(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Quarter start months: 0 (Jan), 3 (Apr), 6 (Jul), 9 (Oct)
  const quarterStarts = [0, 3, 6, 9];

  // Find the next quarter start
  let nextQuarterMonth = quarterStarts.find(m => m > month);
  let nextQuarterYear = year;

  // If no quarter start left this year, use January next year
  if (nextQuarterMonth === undefined) {
    nextQuarterMonth = 0;
    nextQuarterYear = year + 1;
  }

  // If today is a quarter start day (1st of quarter month), still show days to NEXT quarter
  if (now.getDate() === 1 && quarterStarts.includes(month)) {
    const currentQuarterIndex = quarterStarts.indexOf(month);
    if (currentQuarterIndex < 3) {
      nextQuarterMonth = quarterStarts[currentQuarterIndex + 1];
    } else {
      nextQuarterMonth = 0;
      nextQuarterYear = year + 1;
    }
  }

  const nextDeadline = new Date(nextQuarterYear, nextQuarterMonth, 1);

  // Calculate difference in days
  const diffTime = nextDeadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the name of the next quarter
 */
function getNextQuarterName(): string {
  const now = new Date();
  const month = now.getMonth();

  // Quarter start months: 0 (Jan), 3 (Apr), 6 (Jul), 9 (Oct)
  const quarters = [
    { months: [0, 1, 2], name: 'Q1' },
    { months: [3, 4, 5], name: 'Q2' },
    { months: [6, 7, 8], name: 'Q3' },
    { months: [9, 10, 11], name: 'Q4' },
  ];

  const currentQuarterIndex = quarters.findIndex(q => q.months.includes(month));
  const nextQuarterIndex = (currentQuarterIndex + 1) % 4;

  return quarters[nextQuarterIndex].name;
}

/**
 * Get progressive urgency color based on days remaining
 * - >= 14 days: green (comfortable)
 * - 7-13 days: yellow (warning)
 * - < 7 days: red (urgent)
 */
function getUrgencyColor(days: number): { bg: string; text: string } {
  if (days >= 14) {
    return { bg: 'bg-green-500/10', text: 'text-green-500' };
  } else if (days >= 7) {
    return { bg: 'bg-yellow-500/10', text: 'text-yellow-500' };
  } else {
    return { bg: 'bg-red-500/10', text: 'text-red-500' };
  }
}

// ============================================================
// Main Component
// ============================================================

/**
 * FormTimingTile - Shows days until next Monthly and Quarterly form deadlines
 *
 * Features:
 * - Pure frontend calculation (no API calls)
 * - Real-time countdown update
 * - Urgency color coding (green > yellow > red)
 * - Works completely offline
 */
export function FormTimingTile({ tile, className }: FormTimingTileProps) {
  const { shouldShowWarning } = useConnectionHealth(tile);

  const [daysUntilMonthly, setDaysUntilMonthly] = useState(getDaysUntilNextMonthly);
  const [daysUntilQuarterly, setDaysUntilQuarterly] = useState(getDaysUntilNextQuarterly);
  const [nextQuarter, setNextQuarter] = useState(getNextQuarterName);

  // Update countdown at midnight or every hour
  useEffect(() => {
    const updateCountdowns = () => {
      setDaysUntilMonthly(getDaysUntilNextMonthly());
      setDaysUntilQuarterly(getDaysUntilNextQuarterly());
      setNextQuarter(getNextQuarterName());
    };

    // Update every hour (catches midnight transitions)
    const interval = setInterval(updateCountdowns, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  const monthlyColors = getUrgencyColor(daysUntilMonthly);
  const quarterlyColors = getUrgencyColor(daysUntilQuarterly);

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
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail active={shouldShowWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              Days Left
            </h3>
          </div>
        </div>

        {/* Countdown Display */}
        <div className="flex-1 flex items-center justify-center gap-4">
          {/* Monthly */}
          <div className="flex flex-col items-center">
            <div className={`px-3 py-1.5 rounded-lg ${monthlyColors.bg}`}>
              <span className={`text-2xl font-bold tabular-nums ${monthlyColors.text}`}>
                {daysUntilMonthly}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">
              Monthly
            </span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Quarterly */}
          <div className="flex flex-col items-center">
            <div className={`px-3 py-1.5 rounded-lg ${quarterlyColors.bg}`}>
              <span className={`text-2xl font-bold tabular-nums ${quarterlyColors.text}`}>
                {daysUntilQuarterly}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">
              {nextQuarter}
            </span>
          </div>
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

export default FormTimingTile;
