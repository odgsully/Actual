import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelStats,
  getChannelByHandle,
  isYouTubeConfigured,
  type YouTubeStats,
} from '@/lib/youtube/client';

/**
 * GET /api/youtube/stats
 *
 * Returns channel statistics for a YouTube channel.
 *
 * Query params:
 * - channelId: YouTube channel ID (e.g., "UC_x5XG1OV2P6uZZ5FSM9Ttw")
 * - handle: YouTube handle (e.g., "@MrBeast") - alternative to channelId
 *
 * If neither is provided, uses YOUTUBE_CHANNEL_ID from environment.
 *
 * Response:
 * {
 *   channelId: string;
 *   channelTitle: string;
 *   subscriberCount: number;
 *   subscriberCountFormatted: string;
 *   viewCount: number;
 *   viewCountFormatted: string;
 *   videoCount: number;
 *   thumbnailUrl: string;
 *   customUrl: string | null;
 * }
 *
 * Quota cost: 1 unit (very cheap)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const handle = searchParams.get('handle');

    // Check if YouTube is configured
    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        {
          error: 'YouTube API not configured',
          message: 'YOUTUBE_API_KEY environment variable is not set',
        },
        { status: 503 }
      );
    }

    let stats: YouTubeStats;

    if (handle) {
      // Fetch by handle (e.g., "@MrBeast")
      stats = await getChannelByHandle(handle);
    } else {
      // Fetch by channel ID (or default from env)
      stats = await getChannelStats(channelId || undefined);
    }

    return NextResponse.json(stats, {
      headers: {
        // Cache for 6 hours, serve stale for 12 hours
        // YouTube stats don't change frequently
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);

    // Handle quota exceeded specifically
    if (error instanceof Error && error.message.includes('quota')) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: error.message,
        },
        { status: 429 }
      );
    }

    // Handle channel not found
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Channel not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch YouTube stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
