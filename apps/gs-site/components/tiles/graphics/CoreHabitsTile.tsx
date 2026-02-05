'use client';

import { useState } from 'react';
import { Heart, Brain, UtensilsCrossed, AlertCircle, RefreshCw } from 'lucide-react';
import { useHabitsStreak } from '@/hooks/useHabitsData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { HabitInsightsModal } from './HabitInsightsModal';
import type { Tile } from '@/lib/types/tiles';

interface CoreHabitsTileProps {
  tile: Tile;
  className?: string;
}

/**
 * The 3 core habits we want to track prominently
 */
const CORE_HABITS = [
  { name: 'Heart rate UP', label: 'HR Up', icon: Heart, color: 'text-red-500' },
  { name: 'Stillness', label: 'Stillness', icon: Brain, color: 'text-purple-500' },
  { name: 'Food Tracked', label: 'Food', icon: UtensilsCrossed, color: 'text-green-500' },
] as const;

/**
 * CoreHabitsTile - Displays 3 key habits: HR Up, Stillness, Food Tracked
 *
 * Shows each habit with:
 * - Icon
 * - Current streak (prominent)
 * - 7-day completion rate
 *
 * Data comes from Notion Habits database via useHabitsStreak hook.
 */
export function CoreHabitsTile({ tile, className }: CoreHabitsTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    data: allStreaks,
    isLoading,
    error,
    refetch,
  } = useHabitsStreak();

  // Filter to just our 3 core habits
  const coreStreaks = CORE_HABITS.map((habit) => {
    const streak = allStreaks?.find((s) => s.name === habit.name);
    return {
      ...habit,
      currentStreak: streak?.currentStreak ?? 0,
      completionRate7Days: streak?.completionRate7Days ?? 0,
    };
  });

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
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
          <span className="text-xs font-medium text-foreground">
            Core Habits
          </span>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 bg-muted rounded-full" />
                  <div className="w-8 h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Data unavailable</p>
              <button
                onClick={(e) => { e.stopPropagation(); refetch(); }}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex items-center justify-around w-full gap-2">
              {coreStreaks.map((habit) => {
                const Icon = habit.icon;
                return (
                  <div
                    key={habit.name}
                    className="flex flex-col items-center gap-0.5 min-w-0"
                  >
                    {/* Icon */}
                    <Icon className={`w-5 h-5 ${habit.color}`} />

                    {/* Streak number - prominent */}
                    <span className="text-xl font-bold text-foreground leading-none">
                      {habit.currentStreak}
                    </span>

                    {/* Label */}
                    <span className="text-[10px] text-muted-foreground truncate">
                      {habit.label}
                    </span>

                    {/* 7-day rate - subtle */}
                    <span className="text-[9px] text-muted-foreground/70">
                      {habit.completionRate7Days}%
                    </span>
                  </div>
                );
              })}
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

    <HabitInsightsModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
}

export default CoreHabitsTile;
