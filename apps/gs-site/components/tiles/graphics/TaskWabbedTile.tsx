'use client';

import { CheckCircle2, AlertCircle, RefreshCw, ListTodo } from 'lucide-react';
import { useTaskCompletion } from '@/hooks/useTasksData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface TaskWabbedTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Circular progress indicator
 */
function CircularProgress({
  percentage,
  size = 48,
  strokeWidth = 4,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  let strokeColor = 'stroke-red-500';
  if (percentage >= 75) strokeColor = 'stroke-green-500';
  else if (percentage >= 50) strokeColor = 'stroke-yellow-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={`${strokeColor} transition-all duration-500 ease-out`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

/**
 * TaskWabbedTile - Displays task Wabbed percentage with circular progress
 *
 * Shows:
 * - Circular progress indicator for Wabbed %
 * - X/Y format showing wabbed/total
 * - Completion percentage as secondary metric
 *
 * Data comes from Notion Task List database via useTaskCompletion hook.
 */
export function TaskWabbedTile({ tile, className }: TaskWabbedTileProps) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useTaskCompletion();

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
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-foreground truncate">
              Tasks Wabbed
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading && (
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-full" />
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && stats && (
            <div className="flex items-center gap-3">
              {/* Circular progress */}
              <CircularProgress percentage={stats.wabbedPercentage} />

              {/* Stats */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {stats.wabbed}/{stats.total}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>{stats.completionPercentage}% done</span>
                </div>
              </div>
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

export default TaskWabbedTile;
