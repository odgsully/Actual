/**
 * YouTube Data API v3 Client
 *
 * Wrapper for YouTube Data API using API Key authentication.
 * Used by: Socials Stats tile, YouTube wrapper tile.
 *
 * API Key vs OAuth:
 * - API Key: Public data only (subscriber count, video stats) - SIMPLER
 * - OAuth: Private data (analytics, playlists) - MORE COMPLEX
 *
 * This client uses API Key for public channel/video stats.
 *
 * Quota Limits:
 * - Daily quota: 10,000 units
 * - Read operations: 1 unit
 * - Search operations: 100 units
 * - Quota resets at midnight Pacific Time
 *
 * Required Environment Variables:
 * - YOUTUBE_API_KEY: API key from Google Cloud Console
 * - YOUTUBE_CHANNEL_ID: Channel ID to track (optional, can be passed per-request)
 *
 * @see https://developers.google.com/youtube/v3/getting-started
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ============================================================
// Configuration
// ============================================================

/**
 * Get YouTube API key from environment
 */
function getYouTubeApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

/**
 * Get default channel ID from environment
 */
function getDefaultChannelId(): string | null {
  return process.env.YOUTUBE_CHANNEL_ID || null;
}

/**
 * Check if YouTube API is configured
 */
export function isYouTubeConfigured(): boolean {
  return Boolean(getYouTubeApiKey());
}

// ============================================================
// Types
// ============================================================

export interface YouTubeChannelStatistics {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
}

export interface YouTubeChannel {
  id: string;
  snippet: YouTubeChannelSnippet;
  statistics: YouTubeChannelStatistics;
}

export interface YouTubeChannelResponse {
  items: YouTubeChannel[];
}

export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
}

export interface YouTubeVideo {
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics: YouTubeVideoStatistics;
}

export interface YouTubeVideoResponse {
  items: YouTubeVideo[];
}

export interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: YouTubeVideoSnippet;
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
}

/**
 * Formatted stats for display
 */
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
// API Request Helper
// ============================================================

/**
 * Make a request to YouTube Data API
 */
async function youtubeFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = getYouTubeApiKey();

  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  const searchParams = new URLSearchParams({
    ...params,
    key: apiKey,
  });

  const url = `${YOUTUBE_API_BASE}${endpoint}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `YouTube API error: ${response.status}`;

    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
      // Check for quota exceeded
      if (errorJson.error?.errors?.[0]?.reason === 'quotaExceeded') {
        throw new Error('YouTube API quota exceeded. Try again after midnight PT.');
      }
    } catch {
      // Use default error message
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================
// Formatting Helpers
// ============================================================

/**
 * Format large numbers for display (e.g., 1234567 -> "1.2M")
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

// ============================================================
// Channel API
// ============================================================

/**
 * Get channel statistics by channel ID
 *
 * @param channelId YouTube channel ID (e.g., "UC_x5XG1OV2P6uZZ5FSM9Ttw")
 * @returns Channel statistics
 *
 * Quota cost: 1 unit (very cheap)
 *
 * @example
 * ```ts
 * const stats = await getChannelStats('UC_x5XG1OV2P6uZZ5FSM9Ttw');
 * console.log(stats.subscriberCount); // 5000
 * ```
 */
export async function getChannelStats(channelId?: string): Promise<YouTubeStats> {
  const id = channelId || getDefaultChannelId();

  if (!id) {
    throw new Error('Channel ID is required');
  }

  const response = await youtubeFetch<YouTubeChannelResponse>('/channels', {
    part: 'snippet,statistics',
    id,
  });

  if (!response.items || response.items.length === 0) {
    throw new Error(`Channel not found: ${id}`);
  }

  const channel = response.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  const subscriberCount = parseInt(stats.subscriberCount, 10);
  const viewCount = parseInt(stats.viewCount, 10);
  const videoCount = parseInt(stats.videoCount, 10);

  return {
    channelId: channel.id,
    channelTitle: snippet.title,
    subscriberCount,
    subscriberCountFormatted: formatCount(subscriberCount),
    viewCount,
    viewCountFormatted: formatCount(viewCount),
    videoCount,
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
    customUrl: snippet.customUrl || null,
  };
}

/**
 * Get channel by custom URL (handle)
 *
 * Note: This uses search which costs 100 quota units.
 * Prefer using channel ID directly when possible.
 *
 * @param customUrl Channel handle (e.g., "@MrBeast")
 */
export async function getChannelByHandle(handle: string): Promise<YouTubeStats> {
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  // Use forHandle parameter (available since 2022)
  const response = await youtubeFetch<YouTubeChannelResponse>('/channels', {
    part: 'snippet,statistics',
    forHandle: cleanHandle,
  });

  if (!response.items || response.items.length === 0) {
    throw new Error(`Channel not found: @${cleanHandle}`);
  }

  const channel = response.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  const subscriberCount = parseInt(stats.subscriberCount, 10);
  const viewCount = parseInt(stats.viewCount, 10);
  const videoCount = parseInt(stats.videoCount, 10);

  return {
    channelId: channel.id,
    channelTitle: snippet.title,
    subscriberCount,
    subscriberCountFormatted: formatCount(subscriberCount),
    viewCount,
    viewCountFormatted: formatCount(viewCount),
    videoCount,
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
    customUrl: snippet.customUrl || null,
  };
}

// ============================================================
// Video API
// ============================================================

/**
 * Get video statistics by video ID
 *
 * @param videoId YouTube video ID
 * @returns Video statistics
 *
 * Quota cost: 1 unit
 */
export async function getVideoStats(videoId: string): Promise<YouTubeVideoStats> {
  const response = await youtubeFetch<YouTubeVideoResponse>('/videos', {
    part: 'snippet,statistics',
    id: videoId,
  });

  if (!response.items || response.items.length === 0) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const video = response.items[0];
  const stats = video.statistics;
  const snippet = video.snippet;

  return {
    videoId: video.id,
    title: snippet.title,
    publishedAt: snippet.publishedAt,
    viewCount: parseInt(stats.viewCount, 10),
    likeCount: parseInt(stats.likeCount, 10),
    commentCount: parseInt(stats.commentCount, 10),
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
  };
}

/**
 * Get multiple video statistics
 *
 * @param videoIds Array of video IDs (max 50)
 * @returns Array of video statistics
 *
 * Quota cost: 1 unit (same as single video)
 */
export async function getMultipleVideoStats(
  videoIds: string[]
): Promise<YouTubeVideoStats[]> {
  if (videoIds.length === 0) {
    return [];
  }

  if (videoIds.length > 50) {
    throw new Error('Maximum 50 video IDs per request');
  }

  const response = await youtubeFetch<YouTubeVideoResponse>('/videos', {
    part: 'snippet,statistics',
    id: videoIds.join(','),
  });

  return response.items.map((video) => ({
    videoId: video.id,
    title: video.snippet.title,
    publishedAt: video.snippet.publishedAt,
    viewCount: parseInt(video.statistics.viewCount, 10),
    likeCount: parseInt(video.statistics.likeCount, 10),
    commentCount: parseInt(video.statistics.commentCount, 10),
    thumbnailUrl:
      video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
  }));
}

/**
 * Get recent videos for a channel
 *
 * Note: Uses search endpoint which costs 100 quota units.
 * Use sparingly and cache aggressively.
 *
 * @param channelId YouTube channel ID
 * @param maxResults Maximum results (default 5)
 * @returns Recent videos with basic info
 *
 * Quota cost: 100 units (expensive!)
 */
export async function getRecentVideos(
  channelId?: string,
  maxResults: number = 5
): Promise<YouTubeSearchItem[]> {
  const id = channelId || getDefaultChannelId();

  if (!id) {
    throw new Error('Channel ID is required');
  }

  const response = await youtubeFetch<YouTubeSearchResponse>('/search', {
    part: 'snippet',
    channelId: id,
    order: 'date',
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
  });

  return response.items;
}

/**
 * Get recent videos with full statistics
 *
 * Combines search (100 units) + videos (1 unit) = 101 units
 * Use sparingly!
 *
 * @param channelId YouTube channel ID
 * @param maxResults Maximum results (default 5)
 */
export async function getRecentVideosWithStats(
  channelId?: string,
  maxResults: number = 5
): Promise<YouTubeVideoStats[]> {
  const recentVideos = await getRecentVideos(channelId, maxResults);

  const videoIds = recentVideos
    .filter((item) => item.id.videoId)
    .map((item) => item.id.videoId as string);

  if (videoIds.length === 0) {
    return [];
  }

  return getMultipleVideoStats(videoIds);
}

// ============================================================
// Convenience Exports
// ============================================================

export const youtube = {
  // Config
  isConfigured: isYouTubeConfigured,
  // Channel
  getChannelStats,
  getChannelByHandle,
  // Videos
  getVideoStats,
  getMultipleVideoStats,
  getRecentVideos,
  getRecentVideosWithStats,
  // Helpers
  formatCount,
};

export default youtube;
