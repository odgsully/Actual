'use client';

import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { subDays, format, startOfDay } from 'date-fns';
import { AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// Import the CSS for react-calendar-heatmap
import 'react-calendar-heatmap/dist/styles.css';

// ============================================================
// Types
// ============================================================

export interface HeatmapDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
  [key: string]: string | number;
}

export interface HeatmapConfig {
  /** Number of days to display */
  days?: number;
  /** Start date (defaults to today - days) */
  startDate?: Date;
  /** End date (defaults to today) */
  endDate?: Date;
  /** Color intensity levels (4 levels) */
  colors?: [string, string, string, string];
  /** Show month labels */
  showMonthLabels?: boolean;
  /** Show weekday labels */
  showWeekdayLabels?: boolean;
  /** Custom tooltip formatter */
  tooltipFormatter?: (value: HeatmapDataPoint | null) => string;
  /** Value key to use for count (defaults to 'count') */
  valueKey?: string;
  /** Maximum value for color scaling (auto-detected if not provided) */
  maxValue?: number;
}

interface HeatmapTileProps {
  tile: Tile;
  data: HeatmapDataPoint[];
  config?: HeatmapConfig;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

// Default color scale (4 intensity levels)
const DEFAULT_COLORS: [string, string, string, string] = [
  'var(--color-empty, #ebedf0)',
  'var(--color-scale-1, #9be9a8)',
  'var(--color-scale-2, #40c463)',
  'var(--color-scale-3, #30a14e)',
];

// ============================================================
// Helper Functions
// ============================================================

function getColorLevel(count: number, maxValue: number): number {
  if (count === 0) return 0;
  const ratio = count / maxValue;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function defaultTooltipFormatter(value: HeatmapDataPoint | null): string {
  if (!value || !value.date) return 'No data';
  return `${value.count} on ${format(new Date(value.date), 'MMM d, yyyy')}`;
}

// ============================================================
// Custom Styles Component
// ============================================================

function HeatmapStyles({ colors }: { colors: [string, string, string, string] }) {
  return (
    <style jsx global>{`
      .react-calendar-heatmap .color-empty {
        fill: ${colors[0]};
      }
      .react-calendar-heatmap .color-scale-1 {
        fill: ${colors[1]};
      }
      .react-calendar-heatmap .color-scale-2 {
        fill: ${colors[2]};
      }
      .react-calendar-heatmap .color-scale-3 {
        fill: ${colors[3]};
      }
      .react-calendar-heatmap .color-scale-4 {
        fill: ${colors[3]};
      }
      .react-calendar-heatmap text {
        font-size: 8px;
        fill: hsl(var(--muted-foreground));
      }
      .react-calendar-heatmap rect:hover {
        stroke: hsl(var(--foreground));
        stroke-width: 1px;
      }
    `}</style>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * HeatmapTile - Calendar heatmap for activity/habit visualization
 *
 * Uses react-calendar-heatmap for the visualization.
 *
 * Features:
 * - Shows last N days (default: 90)
 * - 4 levels of color intensity
 * - Tooltip on hover
 * - Auto-scales colors based on max value
 * - Mobile-friendly with horizontal scroll
 *
 * @example
 * ```tsx
 * <HeatmapTile
 *   tile={tile}
 *   data={[
 *     { date: '2025-01-01', count: 3 },
 *     { date: '2025-01-02', count: 5 },
 *   ]}
 *   config={{
 *     days: 90,
 *     showMonthLabels: true,
 *   }}
 * />
 * ```
 */
export function HeatmapTile({
  tile,
  data,
  config = {},
  isLoading = false,
  error = null,
  onRetry,
  className,
  title,
}: HeatmapTileProps) {
  const {
    days = 90,
    startDate,
    endDate,
    colors = DEFAULT_COLORS,
    showMonthLabels = true,
    showWeekdayLabels = false,
    tooltipFormatter = defaultTooltipFormatter,
    valueKey = 'count',
    maxValue: configMaxValue,
  } = config;

  // Calculate date range
  const end = endDate || new Date();
  const start = startDate || subDays(end, days);

  // Calculate max value for color scaling
  const maxValue = useMemo(() => {
    if (configMaxValue) return configMaxValue;
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d[valueKey] as number), 1);
  }, [data, valueKey, configMaxValue]);

  // Transform data for the heatmap
  const heatmapData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      count: d[valueKey] as number,
    }));
  }, [data, valueKey]);

  // Calculate total for summary
  const total = useMemo(() => {
    return data.reduce((sum, d) => sum + (d[valueKey] as number), 0);
  }, [data, valueKey]);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[8rem]
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
        <HeatmapStyles colors={colors} />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {title || tile.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && !error && (
              <span className="text-xs text-muted-foreground">{total} total</span>
            )}
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center overflow-x-auto">
          {isLoading && (
            <div className="grid grid-cols-13 gap-0.5 animate-pulse">
              {Array.from({ length: 91 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-muted rounded-sm" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Heatmap unavailable</p>
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
            <div className="w-full min-w-[200px]">
              <CalendarHeatmap
                startDate={start}
                endDate={end}
                values={heatmapData}
                classForValue={(value) => {
                  if (!value || value.count === 0) {
                    return 'color-empty';
                  }
                  const level = getColorLevel(value.count, maxValue);
                  return `color-scale-${level}`;
                }}
                titleForValue={(value) =>
                  tooltipFormatter(value as HeatmapDataPoint | null)
                }
                showMonthLabels={showMonthLabels}
                showWeekdayLabels={showWeekdayLabels}
                gutterSize={2}
              />
            </div>
          )}
        </div>

        {/* Legend */}
        {!isLoading && !error && data.length > 0 && (
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {colors.map((color, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        )}

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

export default HeatmapTile;
