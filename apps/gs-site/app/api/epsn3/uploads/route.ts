import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/epsn3/uploads
 *
 * Fetch EPSN3 upload records.
 *
 * Query params:
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
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data, error, count } = await supabase
      .from('epsn3_uploads')
      .select('*', { count: 'exact' })
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching EPSN3 uploads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch uploads' },
        { status: 500 }
      );
    }

    const uploads = (data || []).map((record) => ({
      id: record.id,
      fileName: record.original_filename,
      fileSize: record.file_size_bytes,
      fileType: record.file_type,
      uploadDate: record.created_at,
      storagePath: record.storage_path,
    }));

    return NextResponse.json({
      uploads,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error('Error in EPSN3 uploads GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
