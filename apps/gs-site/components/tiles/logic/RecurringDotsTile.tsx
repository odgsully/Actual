'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, Settings2, Calendar } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface RecurringDotsConfig {
  /** Recurrence pattern (daily, weekly, monthly) */
  pattern?: RecurrencePattern;
  /** Reference date (start of tracking period) */
  startDate?: Date;
  /** Total number of dots to display */
  totalDots?: number;
  /** Days to highlight (e.g., task completion days) */
  completedDays?: number[];
}

interface RecurringDotsTileProps {
  tile: Tile;
  config?: RecurringDotsConfig;
  className?: string;
}

// ============================================================
// Local Storage Key
// ============================================================

const STORAGE_KEY = 'recurringDots';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: RecurringDotsConfig = {
  pattern: 'monthly',
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First of current month
  totalDots: 30,
  completedDays: [],
};

// ============================================================
// Utility Functions
// ============================================================

function getDaysSinceStart(startDate: Date): number {
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDayOfMonth(): number {
  return new Date().getDate();
}

function getDayOfWeek(): number {
  return new Date().getDay(); // 0 = Sunday, 6 = Saturday
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getCurrentDotIndex(pattern: RecurrencePattern, startDate: Date): number {
  switch (pattern) {
    case 'daily':
      return getDaysSinceStart(startDate);
    case 'weekly':
      return getDayOfWeek();
    case 'monthly':
      return getDayOfMonth() - 1; // 0-indexed
    default:
      return 0;
  }
}

function saveConfig(config: RecurringDotsConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...config,
        startDate: config.startDate?.toISOString(),
      })
    );
  }
}

function loadConfig(): RecurringDotsConfig {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_CONFIG.startDate,
        };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  }
  return DEFAULT_CONFIG;
}

// ============================================================
// Main Component
// ============================================================

/**
 * RecurringDotsTile - Dot matrix grid based on date math
 *
 * Features:
 * - Pure frontend calculation (no API calls)
 * - Configurable recurrence pattern (daily/weekly/monthly)
 * - Visual progress tracking via dot matrix
 * - Click dots to toggle completion state
 * - Persistent state in localStorage
 * - Works completely offline
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <RecurringDotsTile
 *   tile={tile}
 *   config={{
 *     pattern: 'monthly',
 *     totalDots: 30,
 *     completedDays: [1, 5, 10, 15],
 *   }}
 * />
 * ```
 */
export function RecurringDotsTile({
  tile,
  config: initialConfig,
  className,
}: RecurringDotsTileProps) {
  const [config, setConfig] = useState<RecurringDotsConfig>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [currentDot, setCurrentDot] = useState(0);

  // Update current dot index every minute
  useEffect(() => {
    const updateCurrentDot = () => {
      setCurrentDot(getCurrentDotIndex(config.pattern || 'monthly', config.startDate || new Date()));
    };

    updateCurrentDot();
    const interval = setInterval(updateCurrentDot, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [config.pattern, config.startDate]);

  // Save config changes
  useEffect(() => {
    if (!initialConfig) {
      saveConfig(config);
    }
  }, [config, initialConfig]);

  const handleToggleDot = (index: number) => {
    setConfig((prev) => {
      const completedDays = prev.completedDays || [];
      const newCompleted = completedDays.includes(index)
        ? completedDays.filter((d) => d !== index)
        : [...completedDays, index];
      return { ...prev, completedDays: newCompleted };
    });
  };

  const handlePatternChange = (pattern: RecurrencePattern) => {
    let totalDots = 30;
    if (pattern === 'weekly') totalDots = 7;
    if (pattern === 'daily') totalDots = 365;

    setConfig((prev) => ({ ...prev, pattern, totalDots }));
  };

  const totalDots = config.totalDots || 30;
  const completedDays = config.completedDays || [];
  const gridCols = config.pattern === 'weekly' ? 7 : 10;

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
            <CircleDot className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name}
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
                Pattern
              </label>
              <select
                value={config.pattern || 'monthly'}
                onChange={(e) => handlePatternChange(e.target.value as RecurrencePattern)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Dot Matrix Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: Math.min(totalDots, 42) }).map((_, index) => {
              const isCompleted = completedDays.includes(index);
              const isCurrent = index === currentDot;
              const isPast = index < currentDot;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleToggleDot(index)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-150
                    ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                    ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    ${isPast && !isCompleted ? 'opacity-40' : ''}
                    hover:scale-125 focus:scale-125
                    focus:outline-none focus:ring-1 focus:ring-ring
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  aria-label={`Day ${index + 1}${isCompleted ? ' (completed)' : ''}${
                    isCurrent ? ' (today)' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {completedDays.length}/{totalDots} completed
          </span>
          <span className="capitalize">{config.pattern || 'monthly'}</span>
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

export default RecurringDotsTile;
