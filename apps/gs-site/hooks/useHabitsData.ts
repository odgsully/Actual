'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Habits data hooks for React Query
 *
 * These hooks fetch habit data from the Notion API via our server-side
 * endpoints to avoid exposing the Notion token.
 */

export interface HabitStreak {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completionRate7Days: number;
  completionRate30Days: number;
  emoji?: string;
}

export interface HabitsHeatmapData {
  date: string;
  count: number;
  total: number;
  habits: string[];
}

export interface HabitsCompletionRate {
  completed: number;
  total: number;
  rate: number;
}

/**
 * Fetch habit streaks from API
 */
async function fetchHabitStreaks(): Promise<HabitStreak[]> {
  const response = await fetch('/api/notion/habits/streaks');

  if (!response.ok) {
    throw new Error('Failed to fetch habit streaks');
  }

  return response.json();
}

/**
 * Fetch heatmap data from API
 */
async function fetchHeatmapData(days: number = 90): Promise<HabitsHeatmapData[]> {
  const response = await fetch(`/api/notion/habits/heatmap?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch heatmap data');
  }

  return response.json();
}

/**
 * Fetch completion rate from API
 */
async function fetchCompletionRate(days: number = 7): Promise<HabitsCompletionRate> {
  const response = await fetch(`/api/notion/habits/completion?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch completion rate');
  }

  return response.json();
}

/**
 * Hook to fetch all habit streaks
 *
 * @example
 * ```tsx
 * const { data: streaks, isLoading, error } = useHabitsStreak();
 * ```
 */
export function useHabitsStreak() {
  return useQuery({
    queryKey: ['habits', 'streaks'],
    queryFn: fetchHabitStreaks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch habit heatmap data
 *
 * @param days Number of days to fetch (default: 90)
 *
 * @example
 * ```tsx
 * const { data: heatmap, isLoading } = useHabitsHeatmap(90);
 * ```
 */
export function useHabitsHeatmap(days: number = 90) {
  return useQuery({
    queryKey: ['habits', 'heatmap', days],
    queryFn: () => fetchHeatmapData(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch habit completion rate
 *
 * @param days Number of days to calculate rate over (default: 7)
 *
 * @example
 * ```tsx
 * const { data: rate } = useHabitsCompletionRate(7);
 * // rate.rate = 85 (percent)
 * ```
 */
export function useHabitsCompletionRate(days: number = 7) {
  return useQuery({
    queryKey: ['habits', 'completion', days],
    queryFn: () => fetchCompletionRate(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get the top habit by streak
 *
 * Derived from useHabitsStreak - returns the habit with highest current streak
 */
export function useTopHabitStreak() {
  const { data: streaks, ...rest } = useHabitsStreak();

  const topHabit = streaks?.length
    ? streaks.reduce((top, current) =>
        current.currentStreak > top.currentStreak ? current : top
      )
    : null;

  return {
    data: topHabit,
    ...rest,
  };
}
