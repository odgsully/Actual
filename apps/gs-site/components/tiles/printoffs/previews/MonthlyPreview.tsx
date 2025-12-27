'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Rabbit, DollarSign } from 'lucide-react';

interface MonthlyPreviewProps {
  fullPreview?: boolean;
}

interface ROITask {
  id: string;
  title: string;
  estimatedROI: number;
  completed: boolean;
}

/**
 * MonthlyPreview - Preview component for Monthly Report
 *
 * Contents:
 * - Task List Highest ROI
 * - This Month's KPIs Chart
 * - Wabs Wabbed Count
 * - Wabs %
 */
export function MonthlyPreview({ fullPreview = false }: MonthlyPreviewProps) {
  const [roiTasks, setRoiTasks] = useState<ROITask[]>([]);
  const [wabsCount, setWabsCount] = useState(0);
  const [wabsPercent, setWabsPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: Fetch high ROI tasks from Notion
        // TODO: Fetch Wabbit metrics from Wabbit API

        // Mock data for now
        setRoiTasks([
          { id: '1', title: 'Close Johnson property deal', estimatedROI: 15000, completed: false },
          { id: '2', title: 'Launch marketing campaign', estimatedROI: 8000, completed: true },
          { id: '3', title: 'Client referral program', estimatedROI: 5000, completed: false },
          { id: '4', title: 'Automate lead follow-up', estimatedROI: 3500, completed: false },
          { id: '5', title: 'Update property photos', estimatedROI: 2000, completed: true },
        ]);

        setWabsCount(184);
        setWabsPercent(82);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS MONTHLY REVIEW
        </h2>
        <p className="text-muted-foreground">{currentMonth}</p>
      </div>

      {/* Highest ROI Tasks */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Trophy className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-yellow-500`} />
          <h3 className="font-semibold">TASK LIST - HIGHEST ROI</h3>
        </div>
        <div className="space-y-2 pl-4">
          {roiTasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-center gap-2 p-2 rounded ${
                index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : ''
              }`}
            >
              <span className="text-muted-foreground w-4">{index + 1}.</span>
              <span
                className={`flex-1 truncate ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-1 text-green-500">
                <DollarSign className="w-3 h-3" />
                <span className="font-medium">
                  {formatCurrency(task.estimatedROI)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pl-4 text-muted-foreground">
          Total Potential ROI:{' '}
          <span className="text-green-500 font-bold">
            {formatCurrency(roiTasks.reduce((sum, t) => sum + t.estimatedROI, 0))}
          </span>
        </div>
      </section>

      {/* This Month's KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">THIS MONTH&apos;S KPIs</h3>
        </div>
        <div className="pl-4 grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-500">$42.5k</div>
            <div className="text-muted-foreground">Revenue</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">184</div>
            <div className="text-muted-foreground">Tasks Done</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">85%</div>
            <div className="text-muted-foreground">Habits</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">312</div>
            <div className="text-muted-foreground">Commits</div>
          </div>
        </div>
      </section>

      {/* Wabbit Metrics */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Rabbit className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">WABBIT METRICS (Month)</h3>
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

export default MonthlyPreview;
