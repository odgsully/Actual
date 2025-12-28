'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Twitter/X data hooks for React Query
 *
 * Cache Strategy:
 * - Stats are cached for 24 hours (Free tier limit: 1 request/day)
 * - Historical data is stored in Supabase for growth tracking
 *
 * The API route handles:
 * - Checking if we already fetched today
 * - Storing new data in database
 * - Calculating growth multiples
 */

// ============================================================
// Types
// ============================================================

export interface TwitterStats {
  current: {
    followersCount: number;
    followersFormatted: string;
    followingCount: number;
    tweetCount: number;
    likeCount: number;
    fetchedAt: string;
  };
  growth: {
    monthlyMultiple: number | null;
    monthlyMultipleFormatted: string;
    weeklyMultiple: number | null;
    weeklyMultipleFormatted: string;
    monthAgoFollowers: number | null;
    weekAgoFollowers: number | null;
  };
  username: string;
  configured: boolean;
  warning?: string;
  error?: string;
}

// ============================================================
// Fetch Functions
// ============================================================

async function fetchTwitterStats(username?: string): Promise<TwitterStats> {
  const params = new URLSearchParams();
  if (username) params.set('username', username);

  const response = await fetch(`/api/twitter/stats?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || error.message || 'Failed to fetch Twitter stats');
  }

  return response.json();
}

// ============================================================
// Cache Configuration
// ============================================================

const CACHE_CONFIG = {
  // 24 hours - matches Free tier rate limit
  staleTime: 24 * 60 * 60 * 1000,
  // 7 days - keep cached data for a week
  gcTime: 7 * 24 * 60 * 60 * 1000,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch Twitter stats for a user
 *
 * @param username Twitter handle (default: gsu11y from API)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTwitterStats('gsu11y');
 * console.log(data?.growth.monthlyMultipleFormatted); // "+15%"
 * ```
 */
export function useTwitterStats(username?: string) {
  return useQuery({
    queryKey: ['twitter', 'stats', username || 'default'],
    queryFn: () => fetchTwitterStats(username),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: 1,
    refetchOnWindowFocus: false, // Don't waste rate limit on focus
    refetchOnReconnect: false,
  });
}

/**
 * Hook for default user stats (gsu11y)
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useMyTwitterStats();
 * if (stats) {
 *   console.log(stats.current.followersFormatted); // "1.2K"
 *   console.log(stats.growth.monthlyMultipleFormatted); // "+15%"
 * }
 * ```
 */
export function useMyTwitterStats() {
  return useTwitterStats();
}

/**
 * Check if Twitter data is available
 */
export function useTwitterAvailability() {
  const { data, isLoading, error } = useTwitterStats();

  return {
    isAvailable: Boolean(data?.configured) && !error,
    isConfigured: data?.configured ?? false,
    isLoading,
    error,
    hasWarning: Boolean(data?.warning),
    warning: data?.warning,
  };
}
