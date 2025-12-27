'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface CounterConfig {
  /** Prefix before the number (e.g., "$", "#") */
  prefix?: string;
  /** Suffix after the number (e.g., "%", "k", "days") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Trend direction indicator */
  trend?: TrendDirection;
  /** Trend percentage or value change */
  trendValue?: string;
  /** Duration of count animation in seconds */
  duration?: number;
  /** Format number with commas */
  formatNumber?: boolean;
  /** Secondary label below the number */
  label?: string;
  /** Icon component to display */
  icon?: React.ReactNode;
}

interface CounterTileProps {
  tile: Tile;
  value: number;
  config?: CounterConfig;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

// ============================================================
// Animated Counter Component
// ============================================================

function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
  formatNumber = true,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  formatNumber?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    const rounded = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
    if (formatNumber && typeof rounded === 'number') {
      return rounded.toLocaleString();
    }
    if (formatNumber && typeof rounded === 'string') {
      const num = parseFloat(rounded);
      const intPart = Math.floor(num);
      const decPart = rounded.split('.')[1];
      return decPart ? `${intPart.toLocaleString()}.${decPart}` : intPart.toLocaleString();
    }
    return rounded.toString();
  });

  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>{displayValue}</span>;
}

// ============================================================
// Trend Indicator Component
// ============================================================

function TrendIndicator({
  direction,
  value,
}: {
  direction: TrendDirection;
  value?: string;
}) {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const colors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  const Icon = icons[direction];

  return (
    <div className={`flex items-center gap-1 text-xs ${colors[direction]}`}>
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * CounterTile - Animated number display with trend indicator
 *
 * Features:
 * - Smooth count-up animation using framer-motion
 * - Configurable prefix/suffix (e.g., "$1,234", "45%")
 * - Trend indicator (up/down/neutral)
 * - Number formatting with commas
 * - No external dependencies beyond framer-motion
 *
 * @example
 * ```tsx
 * <CounterTile
 *   tile={tile}
 *   value={1234}
 *   config={{
 *     prefix: '$',
 *     suffix: 'k',
 *     trend: 'up',
 *     trendValue: '+12%',
 *     label: 'Revenue',
 *   }}
 * />
 * ```
 */
export function CounterTile({
  tile,
  value,
  config = {},
  isLoading = false,
  error = null,
  onRetry,
  className,
}: CounterTileProps) {
  const {
    prefix = '',
    suffix = '',
    decimals = 0,
    trend,
    trendValue,
    duration = 1,
    formatNumber = true,
    label,
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
          <div className="flex items-center gap-1.5">
            {icon}
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name}
            </h3>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
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
            <>
              {/* Counter display */}
              <div className="flex items-baseline gap-1">
                {prefix && (
                  <span className="text-lg text-muted-foreground">{prefix}</span>
                )}
                <motion.span
                  className="text-3xl font-bold text-foreground tabular-nums"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedCounter
                    value={value}
                    duration={duration}
                    decimals={decimals}
                    formatNumber={formatNumber}
                  />
                </motion.span>
                {suffix && (
                  <span className="text-lg text-muted-foreground">{suffix}</span>
                )}
              </div>

              {/* Label and trend */}
              <div className="flex items-center justify-between mt-1">
                {label && (
                  <span className="text-xs text-muted-foreground">{label}</span>
                )}
                {trend && <TrendIndicator direction={trend} value={trendValue} />}
              </div>
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

export default CounterTile;
