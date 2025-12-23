'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Settings2, Timer } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface DaysTillConfig {
  /** Target date to count down to */
  targetDate: Date;
  /** Label for the event */
  eventLabel?: string;
  /** Show hours/minutes (default: false, only shows days) */
  showTime?: boolean;
}

interface DaysTillCounterTileProps {
  tile: Tile;
  config?: DaysTillConfig;
  className?: string;
}

// ============================================================
// Local Storage Key (tile-specific)
// ============================================================

function getStorageKey(tileId: string): string {
  return `daysTillCounter_${tileId}`;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: DaysTillConfig = {
  targetDate: new Date('2026-04-14'), // SpaceAd MUST SHOOT deadline
  eventLabel: 'MUST SHOOT',
  showTime: false,
};

// ============================================================
// Parse date from tile description (e.g., "Count of days till 04/14/2026")
// ============================================================

function parseDateFromDesc(desc: string | undefined): Date | null {
  if (!desc) return null;

  // Match MM/DD/YYYY format
  const match = desc.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Match YYYY-MM-DD format
  const isoMatch = desc.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(isoMatch[0]);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

// ============================================================
// Utility Functions
// ============================================================

function calculateTimeRemaining(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

function saveConfig(tileId: string, config: DaysTillConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      getStorageKey(tileId),
      JSON.stringify({
        ...config,
        targetDate: config.targetDate.toISOString(),
      })
    );
  }
}

function loadConfig(tileId: string, tile: Tile): DaysTillConfig {
  // First, check if tile description contains a date - this takes priority
  const descDate = parseDateFromDesc(tile.desc);

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(getStorageKey(tileId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // If description has a date, use it (source of truth)
        if (descDate) {
          return {
            ...parsed,
            targetDate: descDate,
          };
        }
        return {
          ...parsed,
          targetDate: new Date(parsed.targetDate),
        };
      } catch {
        // Fall through to default
      }
    }
  }

  // Use date from description if available, otherwise default
  if (descDate) {
    return {
      ...DEFAULT_CONFIG,
      targetDate: descDate,
    };
  }

  return DEFAULT_CONFIG;
}

// ============================================================
// Main Component
// ============================================================

/**
 * DaysTillCounterTile - Countdown to a configurable target date
 *
 * Features:
 * - Pure frontend calculation (no API calls)
 * - Configurable target date via settings button
 * - Real-time countdown update
 * - Persistent config in localStorage
 * - Works completely offline
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <DaysTillCounterTile
 *   tile={tile}
 *   config={{
 *     targetDate: new Date('2025-06-01'),
 *     eventLabel: 'Product Launch',
 *     showTime: true,
 *   }}
 * />
 * ```
 */
export function DaysTillCounterTile({
  tile,
  config: initialConfig,
  className,
}: DaysTillCounterTileProps) {
  const [config, setConfig] = useState<DaysTillConfig>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig(tile.id, tile);
  });

  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(config.targetDate)
  );

  const [showSettings, setShowSettings] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(config.targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [config.targetDate]);

  // Save config changes
  useEffect(() => {
    if (!initialConfig) {
      saveConfig(tile.id, config);
    }
  }, [config, initialConfig, tile.id]);

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      setConfig((prev) => ({ ...prev, targetDate: newDate }));
    }
  };

  const handleLabelChange = (label: string) => {
    setConfig((prev) => ({ ...prev, eventLabel: label }));
  };

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
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {/* Clean up tile name - extract key part after "..." or use as-is */}
              {tile.name.includes('SpaceAd') ? 'SpaceAd' :
               tile.name.includes('…') ? tile.name.split('…').pop()?.trim() :
               tile.name.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 bg-accent rounded-md space-y-2"
          >
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Event Label
              </label>
              <input
                type="text"
                value={config.eventLabel || ''}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                placeholder="Event name"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={config.targetDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              />
            </div>
          </motion.div>
        )}

        {/* Countdown Display */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {timeRemaining.isExpired ? (
            <div className="text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Event passed</p>
            </div>
          ) : (
            <>
              {/* Days Counter */}
              <motion.div
                className="text-4xl font-bold text-foreground tabular-nums"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={timeRemaining.days}
              >
                {timeRemaining.days}
              </motion.div>

              {/* Label */}
              <div className="text-xs text-muted-foreground mt-1">
                {timeRemaining.days === 1 ? 'day' : 'days'}
              </div>

              {/* Event Label */}
              {config.eventLabel && (
                <div className="text-xs text-muted-foreground/70 mt-2 text-center">
                  until {config.eventLabel}
                </div>
              )}

              {/* Optional Time Display */}
              {config.showTime && timeRemaining.days < 7 && (
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground tabular-nums">
                  <span>{timeRemaining.hours}h</span>
                  <span>{timeRemaining.minutes}m</span>
                  <span>{timeRemaining.seconds}s</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-8 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default DaysTillCounterTile;
