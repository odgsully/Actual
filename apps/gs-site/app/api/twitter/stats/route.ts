import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getUserStats,
  isTwitterConfigured,
  calculateGrowthMultiple,
  formatGrowthMultiple,
  formatCount,
} from '@/lib/twitter/client';

// Default username to track
const DEFAULT_USERNAME = 'gsu11y';

// Initialize Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase not configured');
  }

  return createClient(url, key);
}

interface TwitterStatsRow {
  id: string;
  username: string;
  user_id: string | null;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  like_count: number;
  fetched_at: string;
  created_at: string;
}

interface StatsResponse {
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
}

/**
 * Check if we already have a record from today
 */
async function getTodaysRecord(supabase: ReturnType<typeof getSupabase>, username: string): Promise<TwitterStatsRow | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('twitter_stats')
    .select('*')
    .eq('username', username.toLowerCase())
    .gte('fetched_at', today.toISOString())
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking today\'s record:', error);
  }

  return data as TwitterStatsRow | null;
}

/**
 * Get historical record from X days ago (for growth calculation)
 */
async function getHistoricalRecord(
  supabase: ReturnType<typeof getSupabase>,
  username: string,
  daysAgo: number
): Promise<TwitterStatsRow | null> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);

  const { data, error } = await supabase
    .from('twitter_stats')
    .select('*')
    .eq('username', username.toLowerCase())
    .gte('fetched_at', targetDate.toISOString())
    .lt('fetched_at', endDate.toISOString())
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Try to get closest record before target date
    const { data: closestData } = await supabase
      .from('twitter_stats')
      .select('*')
      .eq('username', username.toLowerCase())
      .lte('fetched_at', endDate.toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    return closestData as TwitterStatsRow | null;
  }

  return data as TwitterStatsRow | null;
}

/**
 * Get the latest record (for when we can't fetch fresh)
 */
async function getLatestRecord(supabase: ReturnType<typeof getSupabase>, username: string): Promise<TwitterStatsRow | null> {
  const { data, error } = await supabase
    .from('twitter_stats')
    .select('*')
    .eq('username', username.toLowerCase())
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting latest record:', error);
  }

  return data as TwitterStatsRow | null;
}

/**
 * Store new stats in database
 */
async function storeStats(
  supabase: ReturnType<typeof getSupabase>,
  username: string,
  userId: string,
  stats: { followersCount: number; followingCount: number; tweetCount: number; likeCount: number }
): Promise<void> {
  const { error } = await supabase.from('twitter_stats').insert({
    username: username.toLowerCase(),
    user_id: userId,
    followers_count: stats.followersCount,
    following_count: stats.followingCount,
    tweet_count: stats.tweetCount,
    like_count: stats.likeCount,
    fetched_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error storing Twitter stats:', error);
    throw error;
  }
}

/**
 * Build response from a database record
 */
function buildResponseFromRecord(
  record: TwitterStatsRow,
  monthAgoRecord: TwitterStatsRow | null,
  weekAgoRecord: TwitterStatsRow | null,
  username: string
): StatsResponse {
  const monthlyMultiple = monthAgoRecord
    ? calculateGrowthMultiple(record.followers_count, monthAgoRecord.followers_count)
    : null;

  const weeklyMultiple = weekAgoRecord
    ? calculateGrowthMultiple(record.followers_count, weekAgoRecord.followers_count)
    : null;

  return {
    current: {
      followersCount: record.followers_count,
      followersFormatted: formatCount(record.followers_count),
      followingCount: record.following_count,
      tweetCount: record.tweet_count,
      likeCount: record.like_count,
      fetchedAt: record.fetched_at,
    },
    growth: {
      monthlyMultiple,
      monthlyMultipleFormatted: formatGrowthMultiple(monthlyMultiple),
      weeklyMultiple,
      weeklyMultipleFormatted: formatGrowthMultiple(weeklyMultiple),
      monthAgoFollowers: monthAgoRecord?.followers_count ?? null,
      weekAgoFollowers: weekAgoRecord?.followers_count ?? null,
    },
    username,
    configured: true,
  };
}

/**
 * GET /api/twitter/stats
 *
 * Returns Twitter stats with monthly growth tracking.
 * - Fetches from X API at most once per day (Free tier limit)
 * - Stores historical data in Supabase
 * - Calculates monthly growth multiple
 *
 * Query params:
 * - username: Twitter handle (default: gsu11y)
 * - force: Set to 'true' to force a fresh fetch (use sparingly!)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || DEFAULT_USERNAME;
    const forceRefresh = searchParams.get('force') === 'true';

    // Check if Twitter is configured
    if (!isTwitterConfigured()) {
      return NextResponse.json(
        {
          error: 'Twitter API not configured',
          message: 'TWITTER_BEARER_TOKEN environment variable is not set',
          configured: false,
        },
        { status: 503 }
      );
    }

    const supabase = getSupabase();

    // Check if we have today's data already
    const todaysRecord = await getTodaysRecord(supabase, username);
    const monthAgoRecord = await getHistoricalRecord(supabase, username, 30);
    const weekAgoRecord = await getHistoricalRecord(supabase, username, 7);

    // If we have today's data and not forcing refresh, return cached
    if (todaysRecord && !forceRefresh) {
      const response = buildResponseFromRecord(todaysRecord, monthAgoRecord, weekAgoRecord, username);

      return NextResponse.json(response, {
        headers: {
          // Cache for 1 hour, stale for 24 hours
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Fetch fresh data from X API
    try {
      const freshStats = await getUserStats(username);

      // Store in database
      await storeStats(supabase, username, freshStats.userId, {
        followersCount: freshStats.followersCount,
        followingCount: freshStats.followingCount,
        tweetCount: freshStats.tweetCount,
        likeCount: freshStats.likeCount,
      });

      // Calculate growth
      const monthlyMultiple = monthAgoRecord
        ? calculateGrowthMultiple(freshStats.followersCount, monthAgoRecord.followers_count)
        : null;

      const weeklyMultiple = weekAgoRecord
        ? calculateGrowthMultiple(freshStats.followersCount, weekAgoRecord.followers_count)
        : null;

      const response: StatsResponse = {
        current: {
          followersCount: freshStats.followersCount,
          followersFormatted: freshStats.followersFormatted,
          followingCount: freshStats.followingCount,
          tweetCount: freshStats.tweetCount,
          likeCount: freshStats.likeCount,
          fetchedAt: freshStats.fetchedAt,
        },
        growth: {
          monthlyMultiple,
          monthlyMultipleFormatted: formatGrowthMultiple(monthlyMultiple),
          weeklyMultiple,
          weeklyMultipleFormatted: formatGrowthMultiple(weeklyMultiple),
          monthAgoFollowers: monthAgoRecord?.followers_count ?? null,
          weekAgoFollowers: weekAgoRecord?.followers_count ?? null,
        },
        username,
        configured: true,
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    } catch (fetchError) {
      // If X API fails (rate limit, etc.), try to return latest cached data
      console.error('X API fetch failed:', fetchError);

      const latestRecord = await getLatestRecord(supabase, username);

      if (latestRecord) {
        const response = buildResponseFromRecord(latestRecord, monthAgoRecord, weekAgoRecord, username);

        return NextResponse.json(
          {
            ...response,
            warning: 'Using cached data - X API unavailable',
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
          }
        );
      }

      // No cached data available
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in Twitter stats endpoint:', error);

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate limited',
          message: error.message,
          configured: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch Twitter stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        configured: isTwitterConfigured(),
      },
      { status: 500 }
    );
  }
}
