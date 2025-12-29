'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * YouTube data hooks for React Query
 *
 * These hooks fetch YouTube data from our server-side endpoints
 * to avoid exposing the YouTube API key.
 *
 * Cache Strategy:
 * - Channel stats: 6 hours (subscriber counts change slowly)
 * - Video stats: 30 minutes (views change faster)
 * - Recent videos: 12 hours (rarely post new videos)
 *
 * Quota Awareness:
 * - Channel stats: 1 unit (cheap)
 * - Video stats: 1 unit (cheap)
 * - Recent videos: 100 units (expensive - use sparingly!)
 *
 * Daily quota: 10,000 units (resets at midnight PT)
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

export interface YouTubeVideoStats {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
}

// ============================================================
// Fetch Functions
// ============================================================

/**
 * Fetch channel stats from API
 */
async function fetchChannelStats(
  channelId?: string,
  handle?: string
): Promise<YouTubeStats> {
  const params = new URLSearchParams();
  if (channelId) params.set('channelId', channelId);
  if (handle) params.set('handle', handle);

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
  channelStats: {
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    gcTime: 12 * 60 * 60 * 1000, // 12 hours
  },
  videoStats: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  recentVideos: {
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch YouTube channel statistics
 *
 * @param channelId YouTube channel ID (optional if YOUTUBE_CHANNEL_ID is set)
 *
 * @example
 * ```tsx
 * // Using default channel from env
 * const { data: stats, isLoading, error } = useYouTubeStats();
 *
 * // Using specific channel
 * const { data: stats } = useYouTubeStats({ channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' });
 *
 * // Using channel handle
 * const { data: stats } = useYouTubeStats({ handle: '@MrBeast' });
 * ```
 */
export function useYouTubeStats(options?: { channelId?: string; handle?: string }) {
  const { channelId, handle } = options || {};

  return useQuery({
    queryKey: ['youtube', 'stats', channelId || handle || 'default'],
    queryFn: () => fetchChannelStats(channelId, handle),
    staleTime: CACHE_CONFIG.channelStats.staleTime,
    gcTime: CACHE_CONFIG.channelStats.gcTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch YouTube stats by channel handle
 *
 * Convenience wrapper for useYouTubeStats with handle parameter.
 *
 * @param handle YouTube channel handle (e.g., "@MrBeast")
 *
 * @example
 * ```tsx
 * const { data: stats } = useYouTubeStatsByHandle('@MrBeast');
 * console.log(stats?.subscriberCountFormatted); // "100M"
 * ```
 */
export function useYouTubeStatsByHandle(handle: string) {
  return useYouTubeStats({ handle });
}

/**
 * Hook for default channel stats (uses YOUTUBE_CHANNEL_ID from env)
 *
 * Use this in the Socials Stats tile when displaying your own channel.
 *
 * @example
 * ```tsx
 * const { data: myStats, isLoading, error } = useMyYouTubeStats();
 * if (isLoading) return <TileSkeleton />;
 * if (error) return <TileError message="YouTube unavailable" />;
 * return <div>Subscribers: {myStats.subscriberCountFormatted}</div>;
 * ```
 */
export function useMyYouTubeStats() {
  return useYouTubeStats();
}

/**
 * Hook to check if YouTube data is available
 *
 * Useful for conditional rendering or error states.
 *
 * @example
 * ```tsx
 * const { isAvailable, isLoading, error } = useYouTubeAvailability();
 * if (!isAvailable && !isLoading) {
 *   return <div>YouTube not configured</div>;
 * }
 * ```
 */
export function useYouTubeAvailability() {
  const { data, isLoading, error } = useYouTubeStats();

  return {
    isAvailable: Boolean(data) && !error,
    isLoading,
    error,
    data,
  };
}

// ============================================================
// Formatting Helpers (client-side)
// ============================================================

/**
 * Format large numbers for display
 *
 * @param count Number to format
 * @returns Formatted string (e.g., "1.2M", "5.6K")
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}

/**
 * Format view count with suffix
 *
 * @param views View count
 * @returns Formatted string (e.g., "1.2M views")
 */
export function formatViews(views: number): string {
  return `${formatCount(views)} views`;
}

/**
 * Calculate subscriber growth (mock - would need historical data)
 *
 * For now, returns null. In future, could compare with cached previous value.
 */
export function calculateGrowth(
  _current: number,
  _previous?: number
): { delta: number; percentage: number } | null {
  // TODO: Implement with historical data storage
  return null;
}
