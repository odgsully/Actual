'use client';

import { useEffect, useState } from 'react';
import { Target, TrendingUp, Rabbit, CheckCircle2, Circle } from 'lucide-react';

interface QuarterlyPreviewProps {
  fullPreview?: boolean;
}

interface QuarterlyGoal {
  id: string;
  title: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed';
}

/**
 * QuarterlyPreview - Preview component for Quarterly Report
 *
 * Contents:
 * - Quarterly Goals Review
 * - Quarterly KPIs
 * - Wabs Wabbed Count (Quarter)
 * - Wabs % (Quarter avg)
 */
export function QuarterlyPreview({ fullPreview = false }: QuarterlyPreviewProps) {
  const [goals, setGoals] = useState<QuarterlyGoal[]>([]);
  const [wabsCount, setWabsCount] = useState(0);
  const [wabsPercent, setWabsPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: Fetch quarterly goals from Notion
        // TODO: Fetch Wabbit metrics from Wabbit API

        // Mock data for now
        setGoals([
          { id: '1', title: 'Close 10 property deals', progress: 70, status: 'on-track' },
          { id: '2', title: 'Launch new app feature', progress: 100, status: 'completed' },
          { id: '3', title: 'Grow newsletter to 5k', progress: 45, status: 'at-risk' },
          { id: '4', title: 'Complete AWS certification', progress: 80, status: 'on-track' },
          { id: '5', title: 'Hire 2 new team members', progress: 50, status: 'on-track' },
        ]);

        setWabsCount(547);
        setWabsPercent(79);
      } catch (error) {
        console.error('Error fetching quarterly data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getQuarter = () => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  const statusColors = {
    'on-track': 'text-green-500',
    'at-risk': 'text-yellow-500',
    completed: 'text-blue-500',
  };

  const statusIcons = {
    'on-track': <Circle className="w-3 h-3 text-green-500" />,
    'at-risk': <Circle className="w-3 h-3 text-yellow-500" />,
    completed: <CheckCircle2 className="w-3 h-3 text-blue-500" />,
  };

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS QUARTERLY REVIEW
        </h2>
        <p className="text-muted-foreground">{getQuarter()}</p>
      </div>

      {/* Quarterly Goals */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Target className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-purple-500`} />
          <h3 className="font-semibold">QUARTERLY GOALS REVIEW</h3>
        </div>
        <div className="space-y-3 pl-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {statusIcons[goal.status]}
                <span
                  className={`flex-1 truncate ${
                    goal.status === 'completed' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {goal.title}
                </span>
                <span className={`font-medium ${statusColors[goal.status]}`}>
                  {goal.progress}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-5">
                <div
                  className={`h-full rounded-full ${
                    goal.status === 'completed'
                      ? 'bg-blue-500'
                      : goal.status === 'at-risk'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pl-4 flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-green-500 fill-green-500" /> On Track
          </span>
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-yellow-500 fill-yellow-500" /> At Risk
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
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-500">$127k</div>
            <div className="text-muted-foreground">Revenue</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">547</div>
            <div className="text-muted-foreground">Tasks Done</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">79%</div>
            <div className="text-muted-foreground">Avg Habits</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">892</div>
            <div className="text-muted-foreground">Commits</div>
          </div>
        </div>
      </section>

      {/* Wabbit Metrics */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Rabbit className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">WABBIT METRICS (Quarter)</h3>
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
            <div className="text-muted-foreground">Avg Completion</div>
          </div>
        </div>
        <p className="text-muted-foreground text-center mt-2 italic text-[10px]">
          Wabbit API integration pending
        </p>
      </section>
    </div>
  );
}

export default QuarterlyPreview;
