'use client';

import { useQuery } from '@tanstack/react-query';

export interface MorningFormStats {
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
    weight: number | null;
    teethGrindRating: number | null;
    retainerCompliancePercent: number | null;
    photoVideoCompletionPercent: number | null;
  };
  recentSubmissions: number;
}

interface UseMorningFormStatsOptions {
  days?: number;
  enabled?: boolean;
  refetchInterval?: number;
}

async function fetchMorningFormStats(days: number = 30): Promise<MorningFormStats> {
  const response = await fetch(`/api/forms/morning/stats?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch morning form statistics');
  }

  return response.json();
}

export function useMorningFormStats(options: UseMorningFormStatsOptions = {}) {
  const { days = 30, enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery({
    queryKey: ['morningFormStats', days],
    queryFn: () => fetchMorningFormStats(days),
    enabled,
    refetchInterval,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

export function useMorningStreakRisk() {
  const { data, isLoading, error } = useMorningFormStats();

  const isAtRisk = (() => {
    if (!data?.streak.lastSubmissionDate) return true;

    const lastSubmission = new Date(data.streak.lastSubmissionDate);
    const today = new Date();
    lastSubmission.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return lastSubmission.getTime() !== today.getTime();
  })();

  const hoursUntilStreakBreaks = (() => {
    if (!data?.streak.lastSubmissionDate) return 0;

    const lastSubmission = new Date(data.streak.lastSubmissionDate);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastSubmission.setHours(0, 0, 0, 0);

    if (lastSubmission.getTime() === today.getTime()) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      return Math.floor((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60));
    }

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

export default useMorningFormStats;
