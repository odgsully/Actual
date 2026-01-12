/**
 * Screen Time Screenshot Processing API
 *
 * POST: Process uploaded screenshots with OpenAI Vision
 *       Extracts structured data and stores in screen_time_weekly
 *
 * Body: { weekStart: string, userId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/client';
import { getWeekStart, type LLMScreenTimeExtraction } from '@/lib/screentime/types';
import {
  buildVisionMessages,
  parseExtractionResponse,
  mergeExtractions,
} from '@/lib/screentime/vision-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const weekStart = body.weekStart || getWeekStart();
    const userId = body.userId || 'default-user';

    const supabase = createServerClient();

    // Get unprocessed uploads for this week
    const { data: uploads, error: fetchError } = await supabase
      .from('screen_time_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching uploads:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!uploads || uploads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed uploads found',
        weekStart,
      });
    }

    console.log(`Processing ${uploads.length} screenshots for week ${weekStart}`);

    // Process each screenshot with OpenAI Vision
    const extractions: Record<string, unknown>[] = [];
    const processedIds: string[] = [];

    for (const upload of uploads) {
      try {
        // Download image from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('screentime-screenshots')
          .download(upload.storage_path);

        if (downloadError) {
          console.error(`Failed to download ${upload.storage_path}:`, downloadError);
          continue;
        }

        // Convert to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Determine mime type from file extension
        const extension = upload.storage_path.split('.').pop()?.toLowerCase();
        const mimeType =
          extension === 'jpg' || extension === 'jpeg'
            ? 'image/jpeg'
            : extension === 'webp'
            ? 'image/webp'
            : 'image/png';

        // Call OpenAI Vision
        const messages = buildVisionMessages(base64, mimeType);
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          max_tokens: 2000,
          temperature: 0.1, // Low temperature for consistent extraction
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          console.error('Empty response from OpenAI');
          continue;
        }

        // Parse the extraction
        const extracted = parseExtractionResponse(content);
        if (extracted) {
          extractions.push(extracted);
          processedIds.push(upload.id);
        }

        // Mark upload as processed
        await supabase
          .from('screen_time_uploads')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', upload.id);
      } catch (err) {
        console.error(`Error processing upload ${upload.id}:`, err);
      }
    }

    if (extractions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to extract data from any screenshots',
        weekStart,
      });
    }

    // Merge all extractions into a single weekly record
    const merged = mergeExtractions(extractions) as unknown as LLMScreenTimeExtraction;

    // Calculate total minutes from daily average (if available)
    const totalMinutes = merged.dailyAverageMinutes
      ? merged.dailyAverageMinutes * 7
      : null;

    // Upsert the weekly record
    const { data: weeklyRecord, error: upsertError } = await supabase
      .from('screen_time_weekly')
      .upsert(
        {
          user_id: userId,
          week_start: weekStart,
          daily_avg_minutes: merged.dailyAverageMinutes,
          total_minutes: totalMinutes,
          week_over_week_change: merged.weekOverWeekChangePercent,
          daily_avg_pickups: merged.pickups?.dailyAverage ?? null,
          daily_avg_notifications: merged.notifications?.dailyAverage ?? null,
          categories: merged.categories,
          top_apps: merged.topApps,
          first_apps_after_pickup: merged.firstAppsAfterPickup,
          raw_extraction: merged,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,week_start',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting weekly record:', upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      weeklyId: weeklyRecord.id,
      extracted: merged,
      processedCount: processedIds.length,
      weekStart,
      message: `Processed ${processedIds.length} screenshot(s) successfully`,
    });
  } catch (error) {
    console.error('Processing error:', error);
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
 * GET: Check processing status for a week
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart') || getWeekStart();
    const userId = 'default-user';

    const supabase = createServerClient();

    // Count processed vs unprocessed
    const { data: uploads } = await supabase
      .from('screen_time_uploads')
      .select('processed')
      .eq('user_id', userId)
      .eq('week_start', weekStart);

    const processed = uploads?.filter((u) => u.processed).length || 0;
    const unprocessed = uploads?.filter((u) => !u.processed).length || 0;

    // Get weekly record if exists
    const { data: weekly } = await supabase
      .from('screen_time_weekly')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    return NextResponse.json({
      success: true,
      weekStart,
      status: {
        processed,
        unprocessed,
        hasWeeklyData: Boolean(weekly),
      },
      weekly,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
