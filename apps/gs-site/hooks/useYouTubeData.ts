'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * YouTube data hooks for React Query
 *
 * Cache Strategy:
 * - Stats are cached for 6 hours (YouTube data doesn't change frequently)
 * - Quota limit: 10,000 units/day, each request costs 1 unit
 *
 * The API route handles:
 * - Channel ID lookup by handle
 * - Formatting subscriber/view counts
 */

// ============================================================
// Types
// ============================================================

export interface YouTubeStats {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  subscriberCountFormatted: string;
  viewCount: number;
  viewCountFormatted: string;
  videoCount: number;
  thumbnailUrl: string;
  customUrl: string | null;
}

// ============================================================
// Fetch Functions
// ============================================================

async function fetchYouTubeStats(options?: {
  channelId?: string;
  handle?: string;
}): Promise<YouTubeStats> {
  const params = new URLSearchParams();
  if (options?.channelId) params.set('channelId', options.channelId);
  if (options?.handle) params.set('handle', options.handle);

  const response = await fetch(`/api/youtube/stats?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || error.message || 'Failed to fetch YouTube stats');
  }

  return response.json();
}

// ============================================================
// Cache Configuration
// ============================================================

const CACHE_CONFIG = {
  // 6 hours - YouTube stats don't change frequently
  staleTime: 6 * 60 * 60 * 1000,
  // 24 hours - keep cached data for a day
  gcTime: 24 * 60 * 60 * 1000,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch YouTube stats for a channel
 *
 * @param options.channelId YouTube channel ID (e.g., "UC_x5XG1OV2P6uZZ5FSM9Ttw")
 * @param options.handle YouTube handle (e.g., "@MrBeast") - alternative to channelId
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useYouTubeStats({ handle: '@MrBeast' });
 * console.log(data?.subscriberCountFormatted); // "200M"
 * ```
 */
export function useYouTubeStats(options?: { channelId?: string; handle?: string }) {
  return useQuery({
    queryKey: ['youtube', 'stats', options?.channelId || options?.handle || 'default'],
    queryFn: () => fetchYouTubeStats(options),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook for default channel stats (uses YOUTUBE_CHANNEL_ID from env)
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useMyYouTubeStats();
 * if (stats) {
 *   console.log(stats.subscriberCountFormatted); // "1.2M"
 *   console.log(stats.videoCount); // 342
 * }
 * ```
 */
export function useMyYouTubeStats() {
  return useYouTubeStats();
}

/**
 * Check if YouTube data is available
 */
export function useYouTubeAvailability() {
  const { data, isLoading, error } = useYouTubeStats();

  return {
    isAvailable: Boolean(data?.channelId) && !error,
    isConfigured: !error || (error instanceof Error && !error.message.includes('not configured')),
    isLoading,
    error,
  };
}
