import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Photo, PhotoCategory, PhotosResponse } from '@/lib/slideshow/types';

const DEFAULT_USER_ID = 'default-user';
const STORAGE_BUCKET = 'photo-slideshow';

/**
 * GET /api/slideshow/photos
 *
 * Fetch photos from the slideshow, optionally filtered by category.
 *
 * Query params:
 * - category: 'all' | PhotoCategory (default: 'all')
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('slideshow_photos')
      .select('*', { count: 'exact' })
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by category if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    // Transform database records to Photo interface
    const photos: Photo[] = (data || []).map((record) => ({
      id: record.id,
      userId: record.user_id,
      category: record.category as PhotoCategory,
      storagePath: record.storage_path,
      publicUrl: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(record.storage_path).data.publicUrl,
      originalFilename: record.original_filename,
      caption: record.caption,
      dateTaken: record.date_taken,
      createdAt: record.created_at,
      metadata: record.metadata,
    }));

    const response: PhotosResponse = {
      photos,
      totalCount: count || 0,
      category: category as PhotoCategory | 'all',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in photos GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
