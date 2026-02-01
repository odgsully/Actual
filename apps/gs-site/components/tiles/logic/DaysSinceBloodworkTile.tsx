'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, AlertTriangle, CheckCircle2, Settings2 } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';
import { useTileSettings } from '@/lib/admin/tile-settings';

// ============================================================
// Types
// ============================================================

export interface DaysSinceConfig {
  /** Date of last bloodwork */
  startDate: Date;
  /** Warning threshold in days (default: 365) */
  warningThreshold?: number;
  /** Critical threshold in days (default: 730 = 2 years) */
  criticalThreshold?: number;
}

interface DaysSinceBloodworkTileProps {
  tile: Tile;
  config?: DaysSinceConfig;
  className?: string;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: DaysSinceConfig = {
  startDate: new Date(),
  warningThreshold: 330,
  criticalThreshold: 730,
};

// ============================================================
// Utility Functions
// ============================================================

function calculateDaysSince(startDate: Date): number {
  const now = new Date();
  const start = new Date(startDate);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getStatusColor(days: number, warning: number, critical: number) {
  if (days >= warning) return 'text-red-500';
  return 'text-foreground';
}

function getStatusIcon(days: number, warning: number, critical: number) {
  if (days >= critical) return AlertTriangle;
  if (days >= warning) return AlertTriangle;
  return CheckCircle2;
}

function getStatusMessage(days: number, warning: number, critical: number): string {
  if (days >= warning) return 'Time to schedule bloodwork';
  if (days < 90) return 'Recently completed';
  return 'On track';
}

// ============================================================
// Main Component
// ============================================================

/**
 * DaysSinceBloodworkTile - Tracks days since last bloodwork
 *
 * Features:
 * - Uses admin tile settings for persistence
 * - Color-coded status (neutral by default, red > 330 days)
 * - Settings accessible via admin panel or inline
 * - Pure frontend calculation
 *
 * @example
 * ```tsx
 * <DaysSinceBloodworkTile tile={tile} />
 * ```
 */
export function DaysSinceBloodworkTile({
  tile,
  config: initialConfig,
  className,
}: DaysSinceBloodworkTileProps) {
  // Use tile settings from admin panel
  const { settings, updateSettings, isLoading } = useTileSettings('days-since-bloodwork');

  const [showSettings, setShowSettings] = useState(false);
  const [daysSince, setDaysSince] = useState(0);

  // Merge config sources: prop > tile settings > defaults
  const config: DaysSinceConfig = {
    ...DEFAULT_CONFIG,
    ...(settings?.startDate && { startDate: new Date(settings.startDate) }),
    ...initialConfig,
  };

  const warningThreshold = config.warningThreshold ?? 365;
  const criticalThreshold = config.criticalThreshold ?? 730;

  // Calculate days since on mount and when config changes
  useEffect(() => {
    setDaysSince(calculateDaysSince(config.startDate));

    // Update every hour (not critical to be real-time)
    const interval = setInterval(() => {
      setDaysSince(calculateDaysSince(config.startDate));
    }, 3600000);

    return () => clearInterval(interval);
  }, [config.startDate]);

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      updateSettings({ startDate: dateString });
    }
  };

  const StatusIcon = getStatusIcon(daysSince, warningThreshold, criticalThreshold);
  const statusColor = getStatusColor(daysSince, warningThreshold, criticalThreshold);
  const statusMessage = getStatusMessage(daysSince, warningThreshold, criticalThreshold);

  // Show warning border if overdue
  const shouldShowWarning = daysSince >= warningThreshold || tile.actionWarning;

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

  if (isLoading) {
    return (
      <div className={baseClasses}>
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-8 bg-muted rounded w-1/2 mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <WarningBorderTrail
      active={false}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name || 'Bloodwork'}
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
                Last Bloodwork Date
              </label>
              <input
                type="date"
                value={
                  config.startDate instanceof Date
                    ? config.startDate.toISOString().split('T')[0]
                    : config.startDate
                }
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Red warning at {warningThreshold} days
            </p>
          </motion.div>
        )}

        {/* Counter Display */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Days Counter */}
          <motion.div
            className={`text-4xl font-bold tabular-nums ${statusColor}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={daysSince}
          >
            {daysSince}
          </motion.div>

          {/* Label */}
          <div className="text-xs text-muted-foreground mt-1">
            {daysSince === 1 ? 'day' : 'days'} ago
          </div>

          {/* Status Message */}
          <div className={`flex items-center gap-1 mt-2 text-xs ${statusColor}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* Progress Ring (visual indicator) */}
        <div className="absolute bottom-2 right-2">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20"
            />
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${Math.min(100, (daysSince / warningThreshold) * 100) * 0.75} 100`}
              className={statusColor}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </WarningBorderTrail>
  );
}

export default DaysSinceBloodworkTile;
