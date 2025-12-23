'use client';

import { ListChecks, AlertCircle, RefreshCw, Check, Circle } from 'lucide-react';
import { useHighPriorityTasks, useTaskCompletion, Task } from '@/hooks/useTasksData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface CaliTaskListTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Task item row display
 */
function TaskRow({ task }: { task: Task }) {
  const isDone = task.status === 'Done';

  return (
    <div className="flex items-center gap-2 text-xs">
      {isDone ? (
        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
      ) : (
        <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={`truncate ${
          isDone ? 'text-muted-foreground line-through' : 'text-foreground'
        }`}
      >
        {task.name}
      </span>
      {task.rank !== null && (
        <span
          className={`ml-auto flex-shrink-0 px-1 rounded text-[10px] ${
            task.rank === 0
              ? 'bg-red-500/20 text-red-500'
              : task.rank === 1
              ? 'bg-orange-500/20 text-orange-500'
              : task.rank === 2
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          R{task.rank}
        </span>
      )}
    </div>
  );
}

/**
 * Completion progress ring
 */
function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="36" height="36" className="flex-shrink-0">
      {/* Background ring */}
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted"
      />
      {/* Progress ring */}
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
        transform="rotate(-90 18 18)"
      />
      {/* Percentage text */}
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-[10px] font-medium fill-current text-foreground"
      >
        {percentage}%
      </text>
    </svg>
  );
}

/**
 * CaliTaskListTile - Shows high-priority tasks with completion status
 *
 * Displays:
 * - Top 5 high-priority tasks (rank 0-1)
 * - Task completion percentage ring
 * - Individual task status indicators
 *
 * Data comes from Notion Tasks database via useHighPriorityTasks hook.
 */
export function CaliTaskListTile({ tile, className }: CaliTaskListTileProps) {
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useHighPriorityTasks();

  const {
    data: completion,
    isLoading: completionLoading,
  } = useTaskCompletion();

  const isLoading = tasksLoading || completionLoading;
  const error = tasksError;

  // Get top 5 tasks
  const topTasks = tasks?.slice(0, 5) ?? [];
  const completedCount = topTasks.filter((t) => t.status === 'Done').length;
  const completionPercent = completion?.completionPercentage ?? 0;

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
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground truncate">
              Task List
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
            {!isLoading && completion && (
              <ProgressRing percentage={completionPercent} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center flex-1 flex flex-col justify-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              <button
                onClick={() => refetchTasks()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Task list */}
              <div className="space-y-1.5 flex-1">
                {topTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No high-priority tasks
                  </p>
                ) : (
                  topTasks.map((task) => <TaskRow key={task.id} task={task} />)
                )}
              </div>

              {/* Summary footer */}
              <div className="mt-auto pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {completedCount}/{topTasks.length} done
                  </span>
                  <span>
                    {completion?.total ?? 0} total tasks
                  </span>
                </div>
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

export default CaliTaskListTile;
