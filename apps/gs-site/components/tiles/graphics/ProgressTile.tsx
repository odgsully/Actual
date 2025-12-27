'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export type ProgressVariant = 'linear' | 'circular';

export interface ProgressConfig {
  /** Progress variant (linear or circular) */
  variant?: ProgressVariant;
  /** Current value */
  value: number;
  /** Maximum value */
  max?: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show value as fraction (e.g., "75/100") */
  showFraction?: boolean;
  /** Custom label */
  label?: string;
  /** Color based on value: green >75%, yellow 50-75%, red <50% */
  colorCoded?: boolean;
  /** Custom color (overrides colorCoded) */
  color?: string;
  /** Size for circular variant */
  size?: 'sm' | 'md' | 'lg';
  /** Stroke width for circular variant */
  strokeWidth?: number;
  /** Icon to display inside circular progress */
  icon?: React.ReactNode;
}

interface ProgressTileProps {
  tile: Tile;
  config: ProgressConfig;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

// ============================================================
// Helper Functions
// ============================================================

function getProgressColor(percentage: number, colorCoded: boolean, customColor?: string): string {
  if (customColor) return customColor;
  if (!colorCoded) return 'hsl(var(--primary))';

  if (percentage >= 75) return 'hsl(142 76% 36%)'; // Green
  if (percentage >= 50) return 'hsl(48 96% 53%)'; // Yellow
  return 'hsl(0 84% 60%)'; // Red
}

function getSizeConfig(size: 'sm' | 'md' | 'lg') {
  const sizes = {
    sm: { diameter: 60, fontSize: 'text-sm', iconSize: 'w-4 h-4' },
    md: { diameter: 80, fontSize: 'text-lg', iconSize: 'w-5 h-5' },
    lg: { diameter: 100, fontSize: 'text-2xl', iconSize: 'w-6 h-6' },
  };
  return sizes[size];
}

// ============================================================
// Linear Progress Component
// ============================================================

function LinearProgress({
  value,
  max = 100,
  showPercentage = true,
  showFraction = false,
  label,
  colorCoded = true,
  color,
}: {
  value: number;
  max?: number;
  showPercentage?: boolean;
  showFraction?: boolean;
  label?: string;
  colorCoded?: boolean;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const progressColor = getProgressColor(percentage, colorCoded, color);

  return (
    <div className="w-full space-y-2">
      {/* Labels */}
      <div className="flex items-center justify-between">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <div className="flex items-center gap-2 text-xs">
          {showFraction && (
            <span className="text-muted-foreground">
              {value}/{max}
            </span>
          )}
          {showPercentage && (
            <span className="font-medium text-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: progressColor }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Circular Progress Component (SVG-based)
// ============================================================

function CircularProgress({
  value,
  max = 100,
  showPercentage = true,
  colorCoded = true,
  color,
  size = 'md',
  strokeWidth = 8,
  icon,
}: {
  value: number;
  max?: number;
  showPercentage?: boolean;
  colorCoded?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  icon?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const percentage = Math.min((value / max) * 100, 100);
  const progressColor = getProgressColor(percentage, colorCoded, color);
  const sizeConfig = getSizeConfig(size);
  const { diameter } = sizeConfig;

  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
        style={{ overflow: 'visible' }}
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: mounted ? strokeDashoffset : circumference }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className={sizeConfig.iconSize}>{icon}</div>}
        {showPercentage && !icon && (
          <span className={`font-bold text-foreground ${sizeConfig.fontSize}`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * ProgressTile - Linear and circular progress indicators
 *
 * Features:
 * - Linear progress bar with animated fill
 * - Circular progress (SVG-based, no library)
 * - Color coding: green >75%, yellow 50-75%, red <50%
 * - Fraction display (e.g., "75/100")
 * - Percentage display
 * - Custom colors
 *
 * @example
 * ```tsx
 * // Linear progress
 * <ProgressTile
 *   tile={tile}
 *   config={{
 *     variant: 'linear',
 *     value: 75,
 *     max: 100,
 *     showPercentage: true,
 *     showFraction: true,
 *     label: 'Tasks completed',
 *   }}
 * />
 *
 * // Circular progress
 * <ProgressTile
 *   tile={tile}
 *   config={{
 *     variant: 'circular',
 *     value: 85,
 *     size: 'lg',
 *     colorCoded: true,
 *   }}
 * />
 * ```
 */
export function ProgressTile({
  tile,
  config,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: ProgressTileProps) {
  const {
    variant = 'linear',
    value,
    max = 100,
    showPercentage = true,
    showFraction = false,
    label,
    colorCoded = true,
    color,
    size = 'md',
    strokeWidth = 8,
    icon,
  } = config;

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
          <h3 className="text-xs font-medium text-foreground truncate">{tile.name}</h3>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {variant === 'linear' ? (
                <div className="h-2 bg-muted rounded-full" />
              ) : (
                <div
                  className="rounded-full bg-muted mx-auto"
                  style={{
                    width: getSizeConfig(size).diameter,
                    height: getSizeConfig(size).diameter,
                  }}
                />
              )}
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && (
            <div
              className={`flex ${
                variant === 'circular' ? 'justify-center items-center' : 'flex-col'
              }`}
            >
              {variant === 'linear' ? (
                <LinearProgress
                  value={value}
                  max={max}
                  showPercentage={showPercentage}
                  showFraction={showFraction}
                  label={label}
                  colorCoded={colorCoded}
                  color={color}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CircularProgress
                    value={value}
                    max={max}
                    showPercentage={showPercentage}
                    colorCoded={colorCoded}
                    color={color}
                    size={size}
                    strokeWidth={strokeWidth}
                    icon={icon}
                  />
                  {label && (
                    <span className="text-xs text-muted-foreground text-center">
                      {label}
                    </span>
                  )}
                  {showFraction && (
                    <span className="text-xs text-muted-foreground">
                      {value}/{max}
                    </span>
                  )}
                </div>
              )}
            </div>
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

export default ProgressTile;
