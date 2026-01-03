/**
 * Screen Time Screenshot Upload API
 *
 * POST: Upload 1-3 screenshots to Supabase Storage
 *       Auto-triggers LLM processing after upload
 *
 * Accepts: multipart/form-data with:
 *   - files: File[] (1-3 image files)
 *   - weekStart: string (ISO date for Sunday of the week, optional - defaults to current week)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { getWeekStart } from '@/lib/screentime/types';

const BUCKET_NAME = 'screentime-screenshots';
const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get week start from form or default to current week
    const weekStartParam = formData.get('weekStart') as string | null;
    const weekStart = weekStartParam || getWeekStart();

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' || key.startsWith('file')) {
        if (value instanceof File) {
          files.push(value);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}. Allowed: PNG, JPEG, WebP` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();
    const userId = 'default-user';
    const uploadIds: string[] = [];
    const storagePaths: string[] = [];

    // Upload each file
    for (const file of files) {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const storagePath = `${userId}/${weekStart}/${timestamp}.${extension}`;

      // Convert File to ArrayBuffer then Buffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);

        // If bucket doesn't exist, provide helpful error
        if (uploadError.message?.includes('Bucket not found')) {
          return NextResponse.json(
            {
              success: false,
              error: `Storage bucket "${BUCKET_NAME}" not found. Please create it in Supabase Dashboard.`,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Create database record
      const { data: uploadRecord, error: dbError } = await supabase
        .from('screen_time_uploads')
        .insert({
          user_id: userId,
          week_start: weekStart,
          storage_path: storagePath,
          file_name: file.name,
          file_size_bytes: file.size,
          processed: false,
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        return NextResponse.json(
          { success: false, error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }

      uploadIds.push(uploadRecord.id);
      storagePaths.push(storagePath);
    }

    // Trigger async processing
    // We'll call the process endpoint internally
    const processUrl = new URL('/api/screentime/process', request.url);
    fetch(processUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, userId }),
    }).catch((err) => {
      console.error('Failed to trigger processing:', err);
    });

    return NextResponse.json({
      success: true,
      uploadIds,
      storagePaths,
      weekStart,
      message: `${files.length} file(s) uploaded. Processing started.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List uploads for a week
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart') || getWeekStart();
    const userId = 'default-user';

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('screen_time_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploads: data,
      weekStart,
    });
  } catch (error) {
    console.error('List uploads error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
