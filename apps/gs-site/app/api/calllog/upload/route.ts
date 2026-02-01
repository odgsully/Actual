/**
 * Call Log Screenshot Upload API
 *
 * POST: Upload 1-3 screenshots to Supabase Storage
 *       Auto-triggers LLM processing after upload
 *
 * Accepts: multipart/form-data with:
 *   - files: File[] (1-3 image files)
 *   - periodStart: string (ISO date, optional - defaults to today)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'calllog-screenshots';
const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get period start from form or default to today
    const periodStartParam = formData.get('periodStart') as string | null;
    const periodStart = periodStartParam || getTodayDate();

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
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }
    const userId = 'default-user';
    const uploadIds: string[] = [];
    const storagePaths: string[] = [];

    // Upload each file
    for (const file of files) {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const storagePath = `${userId}/${periodStart}/${timestamp}.${extension}`;

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
        .from('call_log_uploads')
        .insert({
          user_id: userId,
          period_start: periodStart,
          storage_path: storagePath,
          file_name: file.name,
          file_size_bytes: file.size,
          processed: false,
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Table might not exist yet - just log and continue
        console.warn('call_log_uploads table may not exist. Run migration to create it.');
      } else {
        uploadIds.push(uploadRecord.id);
      }

      storagePaths.push(storagePath);
    }

    // Trigger async processing
    const processUrl = new URL('/api/calllog/process', request.url);
    fetch(processUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodStart, userId, storagePaths }),
    }).catch((err) => {
      console.error('Failed to trigger processing:', err);
    });

    return NextResponse.json({
      success: true,
      uploadIds,
      storagePaths,
      periodStart,
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
 * GET: List uploads for a period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('periodStart') || getTodayDate();
    const userId = 'default-user';

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('call_log_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploads: data || [],
      periodStart,
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
