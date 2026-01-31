import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Photo, PhotoCategory, PhotoUploadResponse } from '@/lib/slideshow/types';

const DEFAULT_USER_ID = 'default-user';
const STORAGE_BUCKET = 'photo-slideshow';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/slideshow/upload
 *
 * Upload a new photo to the slideshow.
 *
 * FormData:
 * - file: File (required)
 * - category: PhotoCategory (required)
 * - caption: string (optional)
 * - dateTaken: string ISO date (optional)
 */
export async function POST(request: NextRequest) {
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
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;
    const caption = formData.get('caption') as string | null;
    const dateTaken = formData.get('dateTaken') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const storagePath = `${DEFAULT_USER_ID}/${category}/${timestamp}-${randomId}.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Insert record in database
    const { data: record, error: dbError } = await supabase
      .from('slideshow_photos')
      .insert({
        user_id: DEFAULT_USER_ID,
        category,
        storage_path: storagePath,
        original_filename: file.name,
        caption,
        date_taken: dateTaken,
        metadata: {
          contentType: file.type,
          size: file.size,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      );
    }

    // Build response
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

    const response: PhotoUploadResponse = {
      photo,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in upload POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
