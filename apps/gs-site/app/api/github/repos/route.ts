import { NextRequest, NextResponse } from 'next/server';
import { getAllUserRepos, isGitHubConfigured } from '@/lib/github/client';

/**
 * GET /api/github/repos
 *
 * Returns repositories for a GitHub user sorted by last update.
 *
 * Query params:
 * - username: GitHub username (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'username parameter is required' },
        { status: 400 }
      );
    }

    if (!isGitHubConfigured()) {
      return NextResponse.json(
        { error: 'GitHub API not configured' },
        { status: 503 }
      );
    }

    const repos = await getAllUserRepos(username);

    // Sort by last updated
    repos.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json(repos, {
      headers: {
        // Cache for 10 minutes, serve stale for 20 minutes
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
