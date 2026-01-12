'use client';

import { useEffect, useState } from 'react';
import { Target, TrendingUp, Rabbit, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface QuarterlyPreviewProps {
  fullPreview?: boolean;
}

interface Task {
  id: string;
  name: string;
  rank: number | null;
  status: 'Not started' | 'In progress' | 'Done';
  dueDate: string | null;
  categories: string[];
  project?: string;
}

interface QuarterlyData {
  tasks: Task[];
  stats: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
  period: {
    start: string;
    end: string;
    label: string;
    quarter: number;
    year: number;
  };
}

/**
 * QuarterlyPreview - Preview component for Quarterly Report
 *
 * Contents:
 * - Task List (filtered by Date field, current quarter)
 * - Quarterly KPIs
 * - Wabs Wabbed Count (0 - not connected)
 * - Wabs % (0 - not connected)
 */
export function QuarterlyPreview({ fullPreview = false }: QuarterlyPreviewProps) {
  const [data, setData] = useState<QuarterlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/notion/tasks/this-quarter');
        if (!res.ok) {
          throw new Error('Failed to fetch quarterly tasks');
        }
        const quarterlyData = await res.json();
        setData(quarterlyData);
        setError(null);
      } catch (err) {
        console.error('Error fetching quarterly data:', err);
        setError('Unable to load tasks from Notion');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Priority rank to label mapping
  const rankLabels: Record<number, { label: string; color: string }> = {
    0: { label: 'S Tier', color: 'text-purple-500' },
    1: { label: 'A Tier', color: 'text-red-500' },
    2: { label: 'B Tier', color: 'text-yellow-500' },
    3: { label: 'C Tier', color: 'text-green-500' },
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  const tasks = data?.tasks || [];
  const stats = data?.stats || { total: 0, completed: 0, completionPercentage: 0 };

  // Default quarter label if no data
  const getDefaultQuarterLabel = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  };
  const periodLabel = data?.period?.label || getDefaultQuarterLabel();

  // Group tasks by completion status for quarterly "goals" view
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const incompleteTasks = tasks.filter(t => t.status !== 'Done');

  // Sort incomplete by priority (S tier first)
  const sortedIncompleteTasks = [...incompleteTasks].sort((a, b) => {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS QUARTERLY REVIEW
        </h2>
        <p className="text-muted-foreground">{periodLabel}</p>
      </div>

      {/* Quarterly Task Overview */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Target className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-purple-500`} />
          <h3 className="font-semibold">QUARTERLY TASKS ({stats.total} total)</h3>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-muted-foreground pl-4">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>{error}</span>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground pl-4">No tasks scheduled for this quarter</p>
        ) : (
          <div className="space-y-3 pl-4">
            {/* Show top priority incomplete tasks */}
            {sortedIncompleteTasks.slice(0, fullPreview ? 8 : 5).map((task) => {
              // Calculate a "progress" based on whether task is in progress vs not started
              const progress = task.status === 'In progress' ? 50 : 0;
              const statusColor = task.rank === 0 || task.rank === 1 ? 'text-green-500' : 'text-yellow-500';

              return (
                <div key={task.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Circle className={`w-3 h-3 ${statusColor}`} />
                    <span className="flex-1 truncate">{task.name}</span>
                    {task.rank !== null && (
                      <span className={`font-medium text-[10px] ${rankLabels[task.rank]?.color || 'text-muted-foreground'}`}>
                        {rankLabels[task.rank]?.label}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-5">
                    <div
                      className={`h-full rounded-full ${
                        task.rank === 0 || task.rank === 1 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Show completed count */}
            {completedTasks.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-muted">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                <span className="text-muted-foreground">
                  {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed this quarter
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pl-4 flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-green-500 fill-green-500" /> High Priority
          </span>
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-yellow-500 fill-yellow-500" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-2 h-2 text-blue-500" /> Completed
          </span>
        </div>
      </section>

      {/* Quarterly KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">QUARTERLY KPIs</h3>
        </div>
        <div className="pl-4 grid grid-cols-2 gap-2">
          {/* Real task data */}
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">{stats.completed}</div>
            <div className="text-muted-foreground">Tasks Done</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">{stats.completionPercentage}%</div>
            <div className="text-muted-foreground">Completion</div>
          </div>
          {/* Placeholder KPIs */}
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold text-muted-foreground/50">--</div>
            <div className="text-muted-foreground">Avg Habits</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold text-muted-foreground/50">--</div>
            <div className="text-muted-foreground">Commits</div>
          </div>
        </div>
      </section>

      {/* Wabbit Metrics - Always 0 until connected */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Rabbit className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">WABBIT METRICS (Quarter)</h3>
        </div>
        <div className="pl-4 grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className={`font-bold text-muted-foreground/50 ${fullPreview ? 'text-2xl' : 'text-lg'}`}>
              0
            </div>
            <div className="text-muted-foreground">Wabs Wabbed</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className={`font-bold text-muted-foreground/50 ${fullPreview ? 'text-2xl' : 'text-lg'}`}>
              0%
            </div>
            <div className="text-muted-foreground">Avg Completion</div>
          </div>
        </div>
        <p className="text-muted-foreground text-center mt-2 italic text-[10px]">
          Wabbit not connected
        </p>
      </section>
    </div>
  );
}

export default QuarterlyPreview;
