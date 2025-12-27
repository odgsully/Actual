import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * GET /api/jarvis
 *
 * Returns a paginated list of Jarvis briefings.
 *
 * Query params:
 * - limit: Number of briefings to return (default: 10, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @example
 * /api/jarvis?limit=20&offset=0
 *
 * Response:
 * {
 *   briefings: [...],
 *   total: 150,
 *   hasMore: true
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Parse and validate params
    const limit = Math.min(parseInt(limitParam || '10', 10), 100); // Max 100
    const offset = Math.max(parseInt(offsetParam || '0', 10), 0);

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: 'Invalid limit or offset parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get total count
    const { count, error: countError } = await supabase
      .from('jarvis_briefings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching briefings count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch briefings count' },
        { status: 500 }
      );
    }

    // Get paginated briefings
    const { data, error } = await supabase
      .from('jarvis_briefings')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching briefings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch briefings' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json(
      {
        briefings: data || [],
        total,
        hasMore,
      },
      {
        headers: {
          // Cache for 5 minutes, serve stale for 1 hour
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in /api/jarvis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
