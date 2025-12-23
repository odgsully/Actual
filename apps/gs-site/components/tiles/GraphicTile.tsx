'use client';

import { useState } from 'react';
import {
  LineChart,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  Flame,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { WarningBorderTrail } from './WarningBorderTrail';
import type { TileComponentProps } from './TileRegistry';
import type { Tile } from '@/lib/types/tiles';

/**
 * Get appropriate icon for graphic tile based on name/type
 */
function getGraphicIcon(tile: Tile) {
  const name = tile.name.toLowerCase();

  if (name.includes('streak') || name.includes('habit')) return Flame;
  if (name.includes('pie') || name.includes('time spent')) return PieChart;
  if (name.includes('bar') || name.includes('commit') || name.includes('kpi')) return BarChart3;
  if (name.includes('health') || name.includes('whoop') || name.includes('tracker')) return Activity;
  if (name.includes('trend') || name.includes('insight')) return TrendingUp;

  return LineChart;
}

/**
 * Placeholder states for graphic tiles
 */
type GraphicState = 'idle' | 'loading' | 'error' | 'success';

interface GraphicTileInternalProps extends TileComponentProps {
  /** Custom render function for chart content */
  children?: React.ReactNode;
  /** Override loading state */
  isLoading?: boolean;
  /** Override error state */
  error?: Error | null;
  /** Retry callback for error state */
  onRetry?: () => void;
}

/**
 * GraphicTile - Base wrapper for visualization tiles
 *
 * Provides consistent loading, error, and empty states for tiles that
 * display charts, counters, heatmaps, or other data visualizations.
 *
 * Features:
 * - Responsive container with min-height
 * - Loading skeleton state
 * - Error state with retry button
 * - Accepts children for custom chart content
 * - Falls back to placeholder when no data
 *
 * Usage:
 * ```tsx
 * <GraphicTile tile={tile}>
 *   <MyChart data={chartData} />
 * </GraphicTile>
 * ```
 *
 * For tiles with data fetching:
 * ```tsx
 * <GraphicTile
 *   tile={tile}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 * >
 *   <HeatmapChart data={data} />
 * </GraphicTile>
 * ```
 */
export function GraphicTile({
  tile,
  className,
  children,
  isLoading = false,
  error = null,
  onRetry,
}: GraphicTileInternalProps) {
  const [hovered, setHovered] = useState(false);
  const Icon = getGraphicIcon(tile);

  // Determine state
  let state: GraphicState = 'idle';
  if (isLoading) state = 'loading';
  else if (error) state = 'error';
  else if (children) state = 'success';

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
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
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div
        className={baseClasses}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="region"
        aria-label={`${tile.name} visualization`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate max-w-[120px]">
              {tile.name}
            </h3>
          </div>

          {/* Loading indicator */}
          {state === 'loading' && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center min-h-[3rem]">
          {state === 'loading' && <GraphicLoadingState />}
          {state === 'error' && <GraphicErrorState error={error} onRetry={onRetry} />}
          {state === 'success' && children}
          {state === 'idle' && <GraphicIdleState Icon={Icon} hovered={hovered} />}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}

        {/* 3rd Party indicator */}
        {tile.thirdParty.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
              title={`Data from: ${tile.thirdParty.join(', ')}`}
            />
          </div>
        )}
      </div>
    </WarningBorderTrail>
  );
}

/**
 * Loading skeleton for graphic tiles
 */
function GraphicLoadingState() {
  return (
    <div className="w-full space-y-2 animate-pulse">
      <div className="h-2 bg-muted rounded w-3/4" />
      <div className="h-2 bg-muted rounded w-1/2" />
      <div className="h-2 bg-muted rounded w-2/3" />
    </div>
  );
}

/**
 * Error state with retry option
 */
function GraphicErrorState({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center">
      <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
      <p className="text-xs text-muted-foreground mb-2">
        {error?.message || 'Data unavailable'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Idle/placeholder state for graphic tiles
 */
function GraphicIdleState({
  Icon,
  hovered,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  hovered: boolean;
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        transition-opacity duration-200
        ${hovered ? 'opacity-70' : 'opacity-40'}
      `}
    >
      <Icon className="w-8 h-8 text-muted-foreground" />
      <span className="text-xs text-muted-foreground mt-1">No data</span>
    </div>
  );
}

export default GraphicTile;
