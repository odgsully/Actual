'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { HabitInsightsModal } from './HabitInsightsModal';
import type { Tile } from '@/lib/types/tiles';

interface HabitInsightsTileProps {
  tile: Tile;
  className?: string;
}

interface HabitsInsightsData {
  currentStreak: number;
  habitCompletionRates: {
    heartRateUp: number;
    duolingo: number;
    foodTracked: number;
    stillness: number;
  };
  weightData: Array<{ date: string; weight: number }>;
  latestWeight: number | null;
  weightTrend: 'up' | 'down' | 'stable' | null;
  last28Days: Array<{
    date: string;
    weight: number | null;
    totalProgress: number;
  }>;
}

async function fetchHabitsInsights(): Promise<HabitsInsightsData> {
  const res = await fetch('/api/notion/habits/insights');
  if (!res.ok) throw new Error('Failed to fetch habits insights');
  return res.json();
}

/**
 * Mini weight sparkline showing trend
 */
function WeightSparkline({ data }: { data: Array<{ weight: number }> }) {
  if (data.length < 2) return null;

  // Show last 14 data points
  const points = data.slice(-14);
  const min = Math.min(...points.map((p) => p.weight));
  const max = Math.max(...points.map((p) => p.weight));
  const range = max - min || 1;

  const height = 24;
  const width = 80;
  const stepX = width / (points.length - 1);

  const pathPoints = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.weight - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathPoints}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary/60"
      />
    </svg>
  );
}

/**
 * Habit completion rate bars
 */
function CompletionBars({
  rates,
}: {
  rates: HabitsInsightsData['habitCompletionRates'];
}) {
  const habits = [
    { key: 'heartRateUp', emoji: '❤️', label: 'Heart', rate: rates.heartRateUp },
    { key: 'duolingo', emoji: '🦉', label: 'Duo', rate: rates.duolingo },
    { key: 'foodTracked', emoji: '🍽️', label: 'Food', rate: rates.foodTracked },
    { key: 'stillness', emoji: '🧘', label: 'Still', rate: rates.stillness },
  ];

  return (
    <div className="grid grid-cols-4 gap-1">
      {habits.map((habit) => (
        <div key={habit.key} className="flex flex-col items-center">
          <span className="text-[10px]">{habit.emoji}</span>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all"
              style={{ width: `${Math.round(habit.rate * 100)}%` }}
            />
          </div>
          <span className="text-[8px] text-muted-foreground">
            {Math.round(habit.rate * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * HabitInsightsTile - Comprehensive habit insights display
 *
 * Shows:
 * - Current streak with flame icon
 * - Per-habit completion rates as mini bars
 * - Weight trend sparkline
 * - Latest weight with trend indicator
 *
 * Data comes from Notion Habits database via /api/notion/habits/insights
 */
export function HabitInsightsTile({ tile, className }: HabitInsightsTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['habits', 'insights'],
    queryFn: fetchHabitsInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

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
    hover:bg-muted/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses} onClick={() => setIsModalOpen(true)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-foreground truncate">
              Habit Insights
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="h-2 w-full bg-muted rounded" />
              <div className="h-6 w-16 bg-muted rounded" />
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

          {!isLoading && !error && data && (
            <>
              {/* Streak display */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-foreground">
                  {data.currentStreak}
                </span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>

              {/* Habit completion bars */}
              <div className="mb-2">
                <CompletionBars rates={data.habitCompletionRates} />
              </div>

              {/* Weight section */}
              {data.weightData.length > 0 && (
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1">
                    {data.weightTrend === 'down' && (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    )}
                    {data.weightTrend === 'up' && (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    )}
                    {data.weightTrend === 'stable' && (
                      <Minus className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {data.latestWeight?.toFixed(1) ?? '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">lbs</span>
                  </div>
                  <WeightSparkline data={data.weightData} />
                </div>
              )}
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

    {/* Habit Insights Modal */}
    <HabitInsightsModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
}

export default HabitInsightsTile;
