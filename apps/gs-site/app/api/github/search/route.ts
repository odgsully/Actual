import { NextRequest, NextResponse } from 'next/server';
import { searchRepos, searchArizonaRepos, isGitHubConfigured } from '@/lib/github/client';

/**
 * GET /api/github/search
 *
 * Search GitHub repositories with optional filters.
 *
 * Query params:
 * - q: Search query (required)
 * - location: Filter by location (e.g., "Arizona")
 * - language: Filter by programming language
 * - sort: Sort by (stars, forks, help-wanted-issues, updated)
 * - order: Sort order (asc, desc)
 * - per_page: Results per page (max 100, default 30)
 * - page: Page number (default 1)
 *
 * @example
 * /api/github/search?q=react
 * /api/github/search?q=web%20development&location=Arizona&per_page=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const language = searchParams.get('language');
    const sort = searchParams.get('sort') as
      | 'stars'
      | 'forks'
      | 'help-wanted-issues'
      | 'updated'
      | null;
    const order = searchParams.get('order') as 'asc' | 'desc' | null;
    const perPageParam = searchParams.get('per_page');
    const pageParam = searchParams.get('page');

    if (!query) {
      return NextResponse.json(
        { error: 'q (query) parameter is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!isGitHubConfigured()) {
      return NextResponse.json(
        { error: 'GitHub API not configured' },
        { status: 503 }
      );
    }

    const per_page = perPageParam ? Math.min(parseInt(perPageParam, 10), 100) : 30;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    let results;

    // Use convenience method if searching Arizona
    if (location?.toLowerCase() === 'arizona' && !language && !sort) {
      results = await searchArizonaRepos(query, { per_page, page });
    } else {
      results = await searchRepos(query, {
        location: location || undefined,
        language: language || undefined,
        sort: sort || undefined,
        order: order || undefined,
        per_page,
        page,
      });
    }

    return NextResponse.json(results, {
      headers: {
        // Cache for 5 minutes, serve stale for 10 minutes
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error searching GitHub repos:', error);
    return NextResponse.json(
      { error: 'Failed to search repositories' },
      { status: 500 }
    );
  }
}
