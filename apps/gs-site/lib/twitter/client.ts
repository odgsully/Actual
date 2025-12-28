/**
 * X (Twitter) API v2 Client
 *
 * Uses Bearer Token authentication for public data.
 * Free tier: 1 request per 24 hours - cache aggressively!
 *
 * Required Environment Variables:
 * - TWITTER_BEARER_TOKEN: Bearer token from X Developer Portal
 *
 * @see https://developer.x.com/en/docs/x-api/users/lookup
 */

const X_API_BASE = 'https://api.x.com/2';

// ============================================================
// Configuration
// ============================================================

function getBearerToken(): string | null {
  return process.env.TWITTER_BEARER_TOKEN || null;
}

export function isTwitterConfigured(): boolean {
  return Boolean(getBearerToken());
}

// ============================================================
// Types
// ============================================================

export interface TwitterPublicMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
  like_count: number;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  created_at?: string;
  verified?: boolean;
  public_metrics: TwitterPublicMetrics;
}

export interface TwitterUserResponse {
  data: TwitterUser;
}

export interface TwitterStats {
  userId: string;
  username: string;
  name: string;
  followersCount: number;
  followersFormatted: string;
  followingCount: number;
  tweetCount: number;
  likeCount: number;
  profileImageUrl: string | null;
  fetchedAt: string;
}

export interface TwitterStatsHistory {
  id: string;
  username: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  like_count: number;
  fetched_at: string;
}

// ============================================================
// API Request Helper
// ============================================================

async function twitterFetch<T>(endpoint: string): Promise<T> {
  const bearerToken = getBearerToken();

  if (!bearerToken) {
    throw new Error('Twitter Bearer Token not configured');
  }

  const url = `${X_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 429) {
    throw new Error('X API rate limit exceeded. Free tier allows 1 request per 24 hours.');
  }

  if (response.status === 401) {
    throw new Error('X API authentication failed. Check TWITTER_BEARER_TOKEN.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`X API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

// ============================================================
// Formatting Helpers
// ============================================================

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
 * Calculate growth multiple (e.g., 1.5x means 50% growth)
 */
export function calculateGrowthMultiple(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return current / previous;
}

/**
 * Format growth multiple for display
 */
export function formatGrowthMultiple(multiple: number | null): string {
  if (multiple === null) return '--';
  if (multiple >= 2) return `${multiple.toFixed(1)}x`;
  if (multiple >= 1) return `+${((multiple - 1) * 100).toFixed(0)}%`;
  return `${((multiple - 1) * 100).toFixed(0)}%`;
}

// ============================================================
// User Lookup API
// ============================================================

/**
 * Get user stats by username
 *
 * @param username Twitter handle without @ (e.g., "gsu11y")
 * @returns User stats including follower count
 *
 * Rate limit: 1 request per 24 hours (Free tier)
 */
export async function getUserStats(username: string): Promise<TwitterStats> {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  const response = await twitterFetch<TwitterUserResponse>(
    `/users/by/username/${cleanUsername}?user.fields=public_metrics,profile_image_url,created_at,description`
  );

  const user = response.data;
  const metrics = user.public_metrics;

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    followersCount: metrics.followers_count,
    followersFormatted: formatCount(metrics.followers_count),
    followingCount: metrics.following_count,
    tweetCount: metrics.tweet_count,
    likeCount: metrics.like_count,
    profileImageUrl: user.profile_image_url || null,
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================
// Convenience Exports
// ============================================================

export const twitter = {
  isConfigured: isTwitterConfigured,
  getUserStats,
  formatCount,
  calculateGrowthMultiple,
  formatGrowthMultiple,
};

export default twitter;
