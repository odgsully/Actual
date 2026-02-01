import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Photo, PhotoCategory, PhotoDeleteResponse } from '@/lib/slideshow/types';

const DEFAULT_USER_ID = 'default-user';
const STORAGE_BUCKET = 'photo-slideshow';

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

/**
 * PATCH /api/slideshow/[photoId]
 *
 * Update a photo's metadata (category, caption, dateTaken).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { photoId } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    const body = await request.json();

    const { category, caption, dateTaken } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (category !== undefined) updates.category = category;
    if (caption !== undefined) updates.caption = caption;
    if (dateTaken !== undefined) updates.date_taken = dateTaken;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: record, error } = await supabase
      .from('slideshow_photos')
      .update(updates)
      .eq('id', photoId)
      .eq('user_id', DEFAULT_USER_ID)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        );
      }
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update photo' },
        { status: 500 }
      );
    }

    const photo: Photo = {
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
    };

    return NextResponse.json({ photo, success: true });
  } catch (error) {
    console.error('Error in PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/slideshow/[photoId]
 *
 * Delete a photo and its storage file.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { photoId } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // First, get the photo to find the storage path
    const { data: photo, error: fetchError } = await supabase
      .from('slideshow_photos')
      .select('storage_path')
      .eq('id', photoId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        );
      }
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch photo' },
        { status: 500 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete record even if storage delete fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('slideshow_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', DEFAULT_USER_ID);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete photo record' },
        { status: 500 }
      );
    }

    const response: PhotoDeleteResponse = {
      success: true,
      deletedId: photoId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
