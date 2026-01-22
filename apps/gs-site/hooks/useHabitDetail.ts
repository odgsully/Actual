'use client';

import { useQuery } from '@tanstack/react-query';

export interface HabitDetail {
  name: string;
  emoji: string;
  currentStreak: number;
  longestStreak: number;
  completionRate2026: number;
  completedDays2026: number;
  totalDays2026: number;
  last7Days: boolean[]; // true = completed, most recent first
  completionRate7Days: number;
  completionRate30Days: number;
}

interface HabitStreakResponse {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completionRate7Days: number;
  completionRate30Days: number;
  emoji?: string;
}

interface Completion2026Response {
  habits: Array<{
    name: string;
    emoji: string;
    completedDays: number;
    totalDays: number;
    completionRate: number;
    last7Days: boolean[];
  }>;
  totalDays: number;
  year: number;
}

/**
 * Fetch habit streaks from API
 */
async function fetchHabitStreaks(): Promise<HabitStreakResponse[]> {
  const response = await fetch('/api/notion/habits/streaks');
  if (!response.ok) {
    throw new Error('Failed to fetch habit streaks');
  }
  const data = await response.json();
  return data.streaks || [];
}

/**
 * Fetch 2026 completion data from API
 */
async function fetchCompletion2026(): Promise<Completion2026Response> {
  const response = await fetch('/api/notion/habits/completion-2026');
  if (!response.ok) {
    throw new Error('Failed to fetch 2026 completion data');
  }
  return response.json();
}

/**
 * Combine streaks and 2026 completion data
 */
async function fetchHabitDetails(): Promise<HabitDetail[]> {
  const [streaks, completion2026] = await Promise.all([
    fetchHabitStreaks(),
    fetchCompletion2026(),
  ]);

  // Create a map for quick lookup
  const streakMap = new Map(streaks.map((s) => [s.name, s]));
  const completionMap = new Map(completion2026.habits.map((h) => [h.name, h]));

  // Merge data from both sources
  const allHabitNames = new Set([
    ...streaks.map((s) => s.name),
    ...completion2026.habits.map((h) => h.name),
  ]);

  const habitDetails: HabitDetail[] = [];

  for (const name of allHabitNames) {
    const streak = streakMap.get(name);
    const completion = completionMap.get(name);

    habitDetails.push({
      name,
      emoji: streak?.emoji || completion?.emoji || '✓',
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      completionRate2026: completion?.completionRate || 0,
      completedDays2026: completion?.completedDays || 0,
      totalDays2026: completion?.totalDays || 0,
      last7Days: completion?.last7Days || [],
      completionRate7Days: streak?.completionRate7Days || 0,
      completionRate30Days: streak?.completionRate30Days || 0,
    });
  }

  // Sort by current streak descending
  return habitDetails.sort((a, b) => b.currentStreak - a.currentStreak);
}

/**
 * Hook for fetching detailed habit data
 *
 * Combines:
 * - Current streak and longest streak
 * - 7-day and 30-day completion rates
 * - 2026 year-to-date completion rate
 * - Last 7 days completion status (for dot display)
 */
export function useHabitDetail() {
  const query = useQuery({
    queryKey: ['habit-detail'],
    queryFn: fetchHabitDetails,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    habits: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get the top habit by current streak
 */
export function useTopHabit() {
  const { habits, isLoading, isError } = useHabitDetail();

  const topHabit = habits.length > 0 ? habits[0] : null;

  return {
    topHabit,
    isLoading,
    isError,
  };
}

export default useHabitDetail;
