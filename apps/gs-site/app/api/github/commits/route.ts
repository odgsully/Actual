import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnualCommits,
  getCombinedAnnualCommits,
  isGitHubConfigured,
} from '@/lib/github/client';

/**
 * GET /api/github/commits
 *
 * Returns annual commit statistics for one or more GitHub users.
 *
 * Query params:
 * - username: GitHub username(s) - can be repeated for multiple users
 * - year: Optional year (defaults to current year)
 *
 * @example
 * /api/github/commits?username=odgsully
 * /api/github/commits?username=odgsully&username=odgsully-agent&year=2025
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usernames = searchParams.getAll('username');
    const yearParam = searchParams.get('year');

    if (usernames.length === 0) {
      return NextResponse.json(
        { error: 'At least one username parameter is required' },
        { status: 400 }
      );
    }

    if (!isGitHubConfigured()) {
      return NextResponse.json(
        { error: 'GitHub API not configured' },
        { status: 503 }
      );
    }

    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    if (yearParam && (isNaN(year!) || year! < 2000 || year! > 2100)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    let stats;

    if (usernames.length === 1) {
      stats = await getAnnualCommits(usernames[0], year);
    } else {
      stats = await getCombinedAnnualCommits(usernames, year);
    }

    return NextResponse.json(stats, {
      headers: {
        // Cache for 1 hour, serve stale for 2 hours (expensive query)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit statistics' },
      { status: 500 }
    );
  }
}
