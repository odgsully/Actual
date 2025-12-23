'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Plus,
  Minus,
  Settings2,
  Calendar,
  Target,
  ExternalLink,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface YCInviteConfig {
  /** Current invite count */
  inviteCount: number;
  /** Goal for invites */
  goal: number;
  /** Batch/cycle (e.g., "W25", "S25") */
  batch: string;
  /** Application deadline */
  deadline?: string;
  /** Notes */
  notes?: string;
  /** ISO timestamp of last weekly reset (Saturday night) */
  lastResetAt?: string;
}

interface YCombinatorInvitesTileProps {
  tile: Tile;
  config?: YCInviteConfig;
  className?: string;
}

// ============================================================
// Local Storage
// ============================================================

const STORAGE_KEY = 'ycInvites';

const DEFAULT_CONFIG: YCInviteConfig = {
  inviteCount: 0,
  goal: 1,
  batch: 'W25',
  deadline: undefined,
  notes: undefined,
  lastResetAt: undefined,
};

/**
 * Get the most recent Saturday at 11:59 PM before or equal to the given date.
 * Week resets Saturday night (end of Saturday).
 */
function getLastSaturdayNight(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate days to subtract to get to Saturday
  // If today is Sunday (0), go back 1 day
  // If today is Saturday (6), use today
  // Otherwise, go back (dayOfWeek + 1) days
  const daysToSubtract = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 0 : dayOfWeek + 1;

  result.setDate(result.getDate() - daysToSubtract);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if we need to reset based on Saturday night boundary.
 * Returns true if we've crossed a Saturday night since lastResetAt.
 */
function shouldResetForNewWeek(lastResetAt?: string): boolean {
  if (!lastResetAt) return true; // First time, set the reset timestamp

  const now = new Date();
  const lastReset = new Date(lastResetAt);
  const currentWeekSaturday = getLastSaturdayNight(now);

  // If the last reset was before the most recent Saturday night, we need to reset
  return lastReset < currentWeekSaturday;
}

function saveConfig(config: YCInviteConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

function loadConfig(): YCInviteConfig {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };

        // Check if we need to reset for a new week
        if (shouldResetForNewWeek(parsed.lastResetAt)) {
          const resetConfig = {
            ...parsed,
            inviteCount: 0,
            lastResetAt: new Date().toISOString(),
          };
          // Save the reset config immediately
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resetConfig));
          return resetConfig;
        }

        return parsed;
      } catch {
        return { ...DEFAULT_CONFIG, lastResetAt: new Date().toISOString() };
      }
    }
  }
  return { ...DEFAULT_CONFIG, lastResetAt: new Date().toISOString() };
}

// ============================================================
// YC Batch Info
// ============================================================

const YC_BATCHES = [
  { id: 'W25', label: 'Winter 2025' },
  { id: 'S25', label: 'Summer 2025' },
  { id: 'W26', label: 'Winter 2026' },
  { id: 'S26', label: 'Summer 2026' },
];

// ============================================================
// Main Component
// ============================================================

/**
 * YCombinatorInvitesTile - Track Y Combinator interview invites
 *
 * Features:
 * - Simple counter with increment/decrement
 * - Goal progress indicator
 * - Batch selector
 * - Optional deadline tracking
 * - Link to YC website
 *
 * @example
 * ```tsx
 * <YCombinatorInvitesTile tile={tile} />
 * ```
 */
export function YCombinatorInvitesTile({
  tile,
  config: initialConfig,
  className,
}: YCombinatorInvitesTileProps) {
  const [config, setConfig] = useState<YCInviteConfig>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    if (!initialConfig) {
      setConfig(loadConfig());
    }
    setIsLoaded(true);
  }, [initialConfig]);

  // Save config when it changes
  useEffect(() => {
    if (isLoaded && !initialConfig) {
      saveConfig(config);
    }
  }, [config, isLoaded, initialConfig]);

  const handleIncrement = () => {
    setConfig((prev) => ({ ...prev, inviteCount: prev.inviteCount + 1 }));
  };

  const handleDecrement = () => {
    setConfig((prev) => ({
      ...prev,
      inviteCount: Math.max(0, prev.inviteCount - 1),
    }));
  };

  const handleBatchChange = (batch: string) => {
    setConfig((prev) => ({ ...prev, batch }));
  };

  const handleGoalChange = (goal: number) => {
    setConfig((prev) => ({ ...prev, goal: Math.max(1, goal) }));
  };

  const progress = Math.min(100, (config.inviteCount / config.goal) * 100);
  const hasMetGoal = config.inviteCount >= config.goal;

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
            <Rocket className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name || 'YC Invites'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://www.ycombinator.com/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label="YC Application"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label="Settings"
            >
              <Settings2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 bg-accent rounded-md space-y-2"
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Batch</label>
                <select
                  value={config.batch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                >
                  {YC_BATCHES.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Goal</label>
                <input
                  type="number"
                  min={1}
                  value={config.goal}
                  onChange={(e) => handleGoalChange(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                />
              </div>
            </div>
            {config.deadline && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Deadline: {config.deadline}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Counter Display */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Batch Badge */}
          <div className="mb-1">
            <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-600 rounded-full">
              {config.batch}
            </span>
          </div>

          {/* Counter with Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              disabled={config.inviteCount === 0}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrement"
            >
              <Minus className="w-4 h-4" />
            </button>

            <motion.div
              className={`text-4xl font-bold tabular-nums ${
                hasMetGoal ? 'text-green-500' : 'text-foreground'
              }`}
              key={config.inviteCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {config.inviteCount}
            </motion.div>

            <button
              onClick={handleIncrement}
              className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              aria-label="Increment"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Goal Progress */}
          <div className="w-full mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                Goal: {config.goal}
              </span>
              <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  hasMetGoal ? 'bg-green-500' : 'bg-orange-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Status Message */}
          {hasMetGoal && (
            <motion.p
              className="text-xs text-green-500 mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Goal reached!
            </motion.p>
          )}
        </div>
      </div>
    </WarningBorderTrail>
  );
}

export default YCombinatorInvitesTile;
