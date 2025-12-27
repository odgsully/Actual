import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnualCommits,
  getCombinedAnnualCommitsWithUserBreakdown,
  isGitHubConfigured,
} from '@/lib/github/client';

/**
 * GET /api/github/commits
 *
 * Returns annual commit statistics for one or more GitHub users.
 * When multiple users are provided, includes per-user breakdown for stacked charts.
 *
 * Query params:
 * - username: GitHub username(s) - can be repeated for multiple users
 * - year: Optional year (defaults to current year)
 *
 * @example
 * /api/github/commits?username=odgsully
 * /api/github/commits?username=odgsully&username=odgsully-agents&year=2025
 *
 * Response for multiple users includes `byUser` array for stacked chart support:
 * {
 *   totalCommits: 150,
 *   monthlyBreakdown: [...],
 *   lastCommitDate: "2025-12-20",
 *   byUser: [
 *     { username: "odgsully", totalCommits: 128, monthlyBreakdown: [...] },
 *     { username: "odgsully-agents", totalCommits: 22, monthlyBreakdown: [...] }
 *   ]
 * }
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
      // Single user - return basic stats
      const basicStats = await getAnnualCommits(usernames[0], year);
      // Wrap in user breakdown format for consistency
      stats = {
        ...basicStats,
        byUser: [
          {
            username: usernames[0],
            totalCommits: basicStats.totalCommits,
            monthlyBreakdown: basicStats.monthlyBreakdown,
            lastCommitDate: basicStats.lastCommitDate,
          },
        ],
      };
    } else {
      // Multiple users - return with per-user breakdown for stacked charts
      stats = await getCombinedAnnualCommitsWithUserBreakdown(usernames, year);
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
