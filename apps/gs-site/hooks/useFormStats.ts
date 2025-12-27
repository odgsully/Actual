'use client';

import { useQuery } from '@tanstack/react-query';

export interface FormStats {
  streak: {
    current: number;
    longest: number;
    lastSubmissionDate: string | null;
  };
  thisWeek: {
    completed: number;
    target: number;
    percentage: number;
  };
  averages: {
    mood: string | null;
    calendarGrade: string | null;
    deepWorkHoursPerDay: number | null;
  };
  recentSubmissions: number;
}

interface UseFormStatsOptions {
  days?: number;
  enabled?: boolean;
  refetchInterval?: number;
}

async function fetchFormStats(days: number = 30): Promise<FormStats> {
  const response = await fetch(`/api/forms/productivity/stats?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch form statistics');
  }

  return response.json();
}

/**
 * React Query hook for fetching productivity form statistics
 *
 * @param options - Configuration options
 * @param options.days - Number of days to look back for streak calculation (default: 30)
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.refetchInterval - Refetch interval in milliseconds (default: 5 minutes)
 *
 * @returns Query result with form statistics
 */
export function useFormStats(options: UseFormStatsOptions = {}) {
  const { days = 30, enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery({
    queryKey: ['formStats', days],
    queryFn: () => fetchFormStats(days),
    enabled,
    refetchInterval,
    staleTime: 60 * 1000, // Consider data stale after 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to check if the form streak is at risk (not submitted today)
 *
 * @returns Object with streak risk status
 */
export function useFormStreakRisk() {
  const { data, isLoading, error } = useFormStats();

  const isAtRisk = (() => {
    if (!data?.streak.lastSubmissionDate) return true;

    const lastSubmission = new Date(data.streak.lastSubmissionDate);
    const today = new Date();
    lastSubmission.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // At risk if last submission wasn't today
    return lastSubmission.getTime() !== today.getTime();
  })();

  const hoursUntilStreakBreaks = (() => {
    if (!data?.streak.lastSubmissionDate) return 0;

    const lastSubmission = new Date(data.streak.lastSubmissionDate);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // If already submitted today, streak is safe until tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastSubmission.setHours(0, 0, 0, 0);

    if (lastSubmission.getTime() === today.getTime()) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      return Math.floor((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60));
    }

    // If not submitted today, streak breaks at end of today
    return Math.max(0, Math.floor((endOfToday.getTime() - Date.now()) / (1000 * 60 * 60)));
  })();

  return {
    isAtRisk,
    hoursUntilStreakBreaks,
    currentStreak: data?.streak.current || 0,
    isLoading,
    error,
  };
}

export default useFormStats;
