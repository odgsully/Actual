'use client';

import { useEffect, useState } from 'react';
import { ListTodo, TrendingUp, Rabbit, CheckCircle2 } from 'lucide-react';

interface WeeklyPreviewProps {
  fullPreview?: boolean;
}

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

/**
 * WeeklyPreview - Preview component for Weekly Report
 *
 * Contents:
 * - Task List for the week
 * - This Month's KPIs Chart
 * - Wabs Wabbed Count
 * - Wabs %
 */
export function WeeklyPreview({ fullPreview = false }: WeeklyPreviewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wabsCount, setWabsCount] = useState(0);
  const [wabsPercent, setWabsPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tasks from Notion
        const tasksRes = await fetch('/api/notion/tasks/high-priority');
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks?.slice(0, 10) || []);
        }

        // TODO: Fetch Wabbit metrics from Wabbit API
        // Mock data for now
        setWabsCount(47);
        setWabsPercent(78);

        // Mock tasks if API fails
        if (tasks.length === 0) {
          setTasks([
            { id: '1', title: 'Complete Q4 planning doc', priority: 'high', completed: false },
            { id: '2', title: 'Review property listings', priority: 'high', completed: true },
            { id: '3', title: 'Client follow-up calls', priority: 'medium', completed: false },
            { id: '4', title: 'Update CRM records', priority: 'medium', completed: false },
            { id: '5', title: 'Prepare presentation', priority: 'low', completed: true },
          ]);
        }
      } catch (error) {
        console.error('Error fetching weekly data:', error);
        // Use mock data on error
        setTasks([
          { id: '1', title: 'Complete Q4 planning doc', priority: 'high', completed: false },
          { id: '2', title: 'Review property listings', priority: 'high', completed: true },
          { id: '3', title: 'Client follow-up calls', priority: 'medium', completed: false },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS WEEKLY REVIEW
        </h2>
        <p className="text-muted-foreground">
          Week of {formatDate(weekStart)} - {formatDate(weekEnd)}
        </p>
      </div>

      {/* Task List */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <ListTodo className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-blue-500`} />
          <h3 className="font-semibold">TASK LIST</h3>
        </div>
        <div className="space-y-1.5 pl-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  task.completed ? 'text-green-500' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`flex-1 truncate ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </span>
              <span className={`text-[10px] ${priorityColors[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* This Month's KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">THIS MONTH&apos;S KPIs</h3>
        </div>
        <div className="pl-4">
          {/* Simple bar chart representation */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Tasks</span>
                <span>47/60</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Habits</span>
                <span>82%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Revenue</span>
                <span>$12.5k/$15k</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '83%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wabbit Metrics */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Rabbit className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">WABBIT METRICS</h3>
        </div>
        <div className="pl-4 grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className={`font-bold ${fullPreview ? 'text-2xl' : 'text-lg'}`}>
              {wabsCount}
            </div>
            <div className="text-muted-foreground">Wabs Wabbed</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className={`font-bold ${fullPreview ? 'text-2xl' : 'text-lg'}`}>
              {wabsPercent}%
            </div>
            <div className="text-muted-foreground">Completion Rate</div>
          </div>
        </div>
        <p className="text-muted-foreground text-center mt-2 italic text-[10px]">
          Wabbit API integration pending
        </p>
      </section>
    </div>
  );
}

export default WeeklyPreview;
