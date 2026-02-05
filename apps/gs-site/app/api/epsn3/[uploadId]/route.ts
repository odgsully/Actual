import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

const DEFAULT_USER_ID = 'default-user';
const STORAGE_BUCKET = 'epsn3-uploads';

interface RouteParams {
  params: Promise<{ uploadId: string }>;
}

/**
 * DELETE /api/epsn3/[uploadId]
 *
 * Delete an EPSN3 upload and its storage file.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { uploadId } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Get the upload to find storage path
    const { data: upload, error: fetchError } = await supabase
      .from('epsn3_uploads')
      .select('storage_path')
      .eq('id', uploadId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        );
      }
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch upload' },
        { status: 500 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([upload.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete record even if storage delete fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('epsn3_uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', DEFAULT_USER_ID);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete upload record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: uploadId,
    });
  } catch (error) {
    console.error('Error in EPSN3 DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
