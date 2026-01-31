'use client';

import { CalendarDays, AlertCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { useOverdueTasks, useTasksByRank, OverdueTask, Task } from '@/hooks/useTasksData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface CaliForwardLookTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Upcoming task row display
 */
function UpcomingTaskRow({ task, dueLabel }: { task: Task; dueLabel?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="truncate text-foreground">{task.name}</span>
      {dueLabel && (
        <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
          {dueLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Overdue task row display
 */
function OverdueTaskRow({ task }: { task: OverdueTask }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
      <span className="truncate text-foreground">{task.name}</span>
      <span className="ml-auto text-[10px] text-red-500 flex-shrink-0">
        {task.daysOverdue}d late
      </span>
    </div>
  );
}

/**
 * Format due date to relative label
 */
function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`;
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * CaliForwardLookTile - Shows upcoming and overdue tasks
 *
 * Displays:
 * - Overdue tasks (red warning)
 * - Upcoming high-priority tasks
 * - Due date labels
 *
 * Data comes from Notion Tasks database via useOverdueTasks and useTasksByRank hooks.
 */
export function CaliForwardLookTile({ tile, className }: CaliForwardLookTileProps) {
  const {
    data: overdueTasks,
    isLoading: overdueLoading,
    error: overdueError,
  } = useOverdueTasks();

  const {
    data: urgentTasks,
    isLoading: urgentLoading,
    error: urgentError,
    refetch,
  } = useTasksByRank(0);

  const {
    data: highTasks,
    isLoading: highLoading,
  } = useTasksByRank(1);

  const isLoading = overdueLoading || urgentLoading || highLoading;
  const error = overdueError || urgentError;

  // Filter to upcoming tasks (not done, have due dates in future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTasks = [...(urgentTasks ?? []), ...(highTasks ?? [])]
    .filter(
      (task) =>
        task.status !== 'Done' &&
        task.dueDate &&
        new Date(task.dueDate) >= today
    )
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 3);

  const overdueCount = overdueTasks?.length ?? 0;
  const topOverdue = overdueTasks?.slice(0, 2) ?? [];

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
      active={false}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground truncate">
              Forward Look
            </span>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-red-500">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount}
              </span>
            )}
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
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
                onClick={() => refetch()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-3 flex-1">
              {/* Overdue section */}
              {topOverdue.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-red-500 uppercase">
                    Overdue
                  </p>
                  {topOverdue.map((task) => (
                    <OverdueTaskRow key={task.id} task={task} />
                  ))}
                  {overdueCount > 2 && (
                    <p className="text-[10px] text-muted-foreground pl-5">
                      +{overdueCount - 2} more overdue
                    </p>
                  )}
                </div>
              )}

              {/* Upcoming section */}
              {upcomingTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    Upcoming
                  </p>
                  {upcomingTasks.map((task) => (
                    <UpcomingTaskRow
                      key={task.id}
                      task={task}
                      dueLabel={formatDueDate(task.dueDate)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {topOverdue.length === 0 && upcomingTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center">
                    No upcoming or overdue tasks
                  </p>
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

export default CaliForwardLookTile;
