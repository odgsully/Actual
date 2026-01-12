'use client';

import { useEffect, useState } from 'react';
import { ListTodo, TrendingUp, Rabbit, CheckCircle2, AlertCircle } from 'lucide-react';

interface WeeklyPreviewProps {
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

interface WeeklyData {
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
 * WeeklyPreview - Preview component for Weekly Report
 *
 * Contents:
 * - Task List for the week (filtered by Date field, Sunday-Saturday)
 * - This Month's KPIs Chart
 * - Wabs Wabbed Count (0 - not connected)
 * - Wabs % (0 - not connected)
 */
export function WeeklyPreview({ fullPreview = false }: WeeklyPreviewProps) {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/notion/tasks/this-week');
        if (!res.ok) {
          throw new Error('Failed to fetch weekly tasks');
        }
        const weeklyData = await res.json();
        setData(weeklyData);
        setError(null);
      } catch (err) {
        console.error('Error fetching weekly data:', err);
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
  const periodLabel = data?.period?.label || 'This Week';

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS WEEKLY REVIEW
        </h2>
        <p className="text-muted-foreground">{periodLabel}</p>
      </div>

      {/* Task List */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <ListTodo className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-blue-500`} />
          <h3 className="font-semibold">TASK LIST ({stats.total} tasks)</h3>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-muted-foreground pl-4">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>{error}</span>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground pl-4">No tasks scheduled for this week</p>
        ) : (
          <div className="space-y-1.5 pl-4">
            {tasks.slice(0, fullPreview ? 15 : 8).map((task) => (
              <div key={task.id} className="flex items-center gap-2">
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
                    {rankLabels[task.rank]?.label || '?'}
                  </span>
                )}
              </div>
            ))}
            {tasks.length > (fullPreview ? 15 : 8) && (
              <p className="text-muted-foreground text-[10px]">
                +{tasks.length - (fullPreview ? 15 : 8)} more tasks
              </p>
            )}
          </div>
        )}
      </section>

      {/* This Month's KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">WEEKLY KPIs</h3>
        </div>
        <div className="pl-4">
          <div className="space-y-2">
            {/* Real task data */}
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Tasks</span>
                <span>{stats.completed}/{stats.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionPercentage}%` }}
                />
              </div>
            </div>
            {/* Placeholder KPIs */}
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Habits</span>
                <span className="text-muted-foreground/50">--</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Revenue</span>
                <span className="text-muted-foreground/50">--</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wabbit Metrics - Always 0 until connected */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Rabbit className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">WABBIT METRICS</h3>
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

export default WeeklyPreview;
