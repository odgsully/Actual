'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Rabbit, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MonthlyPreviewProps {
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

interface MonthlyData {
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
  };
}

/**
 * MonthlyPreview - Preview component for Monthly Report
 *
 * Contents:
 * - Task List (filtered by Date field, current month)
 * - This Month's KPIs Chart
 * - Wabs Wabbed Count (0 - not connected)
 * - Wabs % (0 - not connected)
 */
export function MonthlyPreview({ fullPreview = false }: MonthlyPreviewProps) {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/notion/tasks/this-month');
        if (!res.ok) {
          throw new Error('Failed to fetch monthly tasks');
        }
        const monthlyData = await res.json();
        setData(monthlyData);
        setError(null);
      } catch (err) {
        console.error('Error fetching monthly data:', err);
        setError('Unable to load tasks from Notion');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Priority rank to label mapping
  const rankLabels: Record<number, { label: string; color: string }> = {
    0: { label: 'S', color: 'text-purple-500' },
    1: { label: 'A', color: 'text-red-500' },
    2: { label: 'B', color: 'text-yellow-500' },
    3: { label: 'C', color: 'text-green-500' },
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
  const periodLabel = data?.period?.label || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Sort tasks by rank (S tier first) for "highest priority" display
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS MONTHLY REVIEW
        </h2>
        <p className="text-muted-foreground">{periodLabel}</p>
      </div>

      {/* Highest Priority Tasks */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Trophy className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-yellow-500`} />
          <h3 className="font-semibold">TASK LIST - HIGHEST PRIORITY ({stats.total} tasks)</h3>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-muted-foreground pl-4">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>{error}</span>
          </div>
        ) : sortedTasks.length === 0 ? (
          <p className="text-muted-foreground pl-4">No tasks scheduled for this month</p>
        ) : (
          <div className="space-y-2 pl-4">
            {sortedTasks.slice(0, fullPreview ? 10 : 5).map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 p-2 rounded ${
                  index === 0 && task.rank === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : ''
                }`}
              >
                <span className="text-muted-foreground w-4">{index + 1}.</span>
                <CheckCircle2
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    task.status === 'Done' ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`flex-1 truncate ${
                    task.status === 'Done' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {task.name}
                </span>
                {task.rank !== null && (
                  <span className={`text-[10px] font-bold ${rankLabels[task.rank]?.color || 'text-muted-foreground'}`}>
                    {rankLabels[task.rank]?.label} Tier
                  </span>
                )}
              </div>
            ))}
            {sortedTasks.length > (fullPreview ? 10 : 5) && (
              <p className="text-muted-foreground text-[10px]">
                +{sortedTasks.length - (fullPreview ? 10 : 5)} more tasks
              </p>
            )}
          </div>
        )}
      </section>

      {/* This Month's KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">THIS MONTH&apos;S KPIs</h3>
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
            <div className="text-muted-foreground">Habits</div>
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
          <h3 className="font-semibold">WABBIT METRICS (Month)</h3>
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
            <div className="text-muted-foreground">Completion Rate</div>
          </div>
        </div>
        <p className="text-muted-foreground text-center mt-2 italic text-[10px]">
          Wabbit not connected
        </p>
      </section>
    </div>
  );
}

export default MonthlyPreview;
