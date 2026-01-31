/**
 * Call Log Processing API
 *
 * POST: Process uploaded screenshots using OpenAI Vision API
 *       Extracts call data and stores in database
 *
 * GET: Check processing status for a period
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import OpenAI from 'openai';
import {
  buildVisionMessages,
  parseExtractionResponse,
  mergeExtractions,
  normalizeCallEntry,
} from '@/lib/calllog/vision-prompt';
import type { LLMCallLogExtraction, CallEntry } from '@/lib/calllog/types';
import { getWeekStart, formatDuration, formatWeekLabel } from '@/lib/calllog/types';

const BUCKET_NAME = 'calllog-screenshots';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periodStart, userId = 'default-user', storagePaths = [] } = body;

    if (!periodStart) {
      return NextResponse.json(
        { success: false, error: 'periodStart is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Get unprocessed uploads if storagePaths not provided
    let pathsToProcess = storagePaths;
    if (pathsToProcess.length === 0) {
      const { data: uploads } = await supabase
        .from('call_log_uploads')
        .select('storage_path')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .eq('processed', false);

      pathsToProcess = uploads?.map((u) => u.storage_path) || [];
    }

    if (pathsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No uploads to process',
        callsProcessed: 0,
      });
    }

    const extractions: Record<string, unknown>[] = [];

    // Process each screenshot
    for (const storagePath of pathsToProcess) {
      try {
        // Download image from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(storagePath);

        if (downloadError || !fileData) {
          console.error('Failed to download:', storagePath, downloadError);
          continue;
        }

        // Convert to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = storagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

        // Call OpenAI Vision API
        const messages = buildVisionMessages(base64, mimeType);
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          max_tokens: 4096,
          temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = parseExtractionResponse(content);
          if (parsed) {
            extractions.push(parsed);
          }
        }

        // Mark upload as processed
        await supabase
          .from('call_log_uploads')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('storage_path', storagePath);
      } catch (err) {
        console.error('Error processing screenshot:', storagePath, err);
      }
    }

    // Merge all extractions
    const merged = mergeExtractions(extractions) as unknown as LLMCallLogExtraction;

    // Normalize and validate calls
    const validCalls: CallEntry[] = [];
    for (const call of merged.calls || []) {
      const normalized = normalizeCallEntry(call as unknown as Record<string, unknown>);
      if (normalized) {
        validCalls.push(normalized as unknown as CallEntry);
      }
    }

    // Aggregate stats
    const outboundCount = validCalls.filter((c) => c.direction === 'outgoing').length;
    const inboundCount = validCalls.filter((c) => c.direction === 'incoming').length;
    const missedCount = validCalls.filter((c) => c.direction === 'missed').length;
    const totalDuration = validCalls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

    // Store daily record
    const { error: dailyError } = await supabase
      .from('call_log_daily')
      .upsert({
        user_id: userId,
        date: periodStart,
        outbound_count: outboundCount,
        inbound_count: inboundCount,
        missed_count: missedCount,
        total_duration_seconds: totalDuration,
        calls: validCalls,
        raw_extraction: merged,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      });

    if (dailyError) {
      console.error('Failed to store daily record:', dailyError);
    }

    // Update weekly aggregate
    const weekStart = getWeekStart(new Date(periodStart));
    await updateWeeklyAggregate(supabase, userId, weekStart);

    return NextResponse.json({
      success: true,
      extracted: merged,
      callsProcessed: validCalls.length,
      stats: {
        outbound: outboundCount,
        inbound: inboundCount,
        missed: missedCount,
        totalDuration: formatDuration(totalDuration),
      },
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
 * Update weekly aggregate from daily records
 */
async function updateWeeklyAggregate(
  supabase: NonNullable<ReturnType<typeof createServerClient>>,
  userId: string,
  weekStart: string
) {
  // Get all daily records for this week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { data: dailyRecords } = await supabase
    .from('call_log_daily')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEndStr);

  if (!dailyRecords || dailyRecords.length === 0) return;

  // Aggregate stats
  const totalOutbound = dailyRecords.reduce((sum, r) => sum + (r.outbound_count || 0), 0);
  const totalInbound = dailyRecords.reduce((sum, r) => sum + (r.inbound_count || 0), 0);
  const totalMissed = dailyRecords.reduce((sum, r) => sum + (r.missed_count || 0), 0);
  const totalDuration = dailyRecords.reduce((sum, r) => sum + (r.total_duration_seconds || 0), 0);

  const daysWithData = dailyRecords.length;
  const dailyAvgOutbound = daysWithData > 0 ? totalOutbound / daysWithData : 0;
  const dailyAvgInbound = daysWithData > 0 ? totalInbound / daysWithData : 0;

  // Aggregate top contacts from all calls
  const allCalls: CallEntry[] = dailyRecords.flatMap((r) => r.calls || []);
  const contactMap = new Map<string, { name: string; phoneNumber: string; callCount: number; totalDuration: number }>();

  for (const call of allCalls) {
    const key = call.phoneNumber || call.contactName || 'Unknown';
    const existing = contactMap.get(key) || {
      name: call.contactName || '',
      phoneNumber: call.phoneNumber || '',
      callCount: 0,
      totalDuration: 0,
    };
    existing.callCount++;
    existing.totalDuration += call.durationSeconds || 0;
    if (call.contactName && !existing.name) existing.name = call.contactName;
    contactMap.set(key, existing);
  }

  const topContacts = Array.from(contactMap.values())
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 10);

  // Get previous week for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0];

  const { data: prevWeek } = await supabase
    .from('call_log_weekly')
    .select('total_outbound')
    .eq('user_id', userId)
    .eq('week_start', prevWeekStartStr)
    .single();

  let weekOverWeekChange: number | null = null;
  if (prevWeek?.total_outbound) {
    weekOverWeekChange = Math.round(((totalOutbound - prevWeek.total_outbound) / prevWeek.total_outbound) * 100);
  }

  // Upsert weekly record
  await supabase
    .from('call_log_weekly')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      total_outbound: totalOutbound,
      total_inbound: totalInbound,
      total_missed: totalMissed,
      total_duration_seconds: totalDuration,
      daily_avg_outbound: dailyAvgOutbound,
      daily_avg_inbound: dailyAvgInbound,
      week_over_week_change: weekOverWeekChange,
      top_contacts: topContacts,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,week_start',
    });
}

/**
 * GET: Check processing status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('periodStart');
    const userId = 'default-user';

    if (!periodStart) {
      return NextResponse.json(
        { success: false, error: 'periodStart is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Get upload status
    const { data: uploads } = await supabase
      .from('call_log_uploads')
      .select('id, processed, created_at')
      .eq('user_id', userId)
      .eq('period_start', periodStart);

    const total = uploads?.length || 0;
    const processed = uploads?.filter((u) => u.processed).length || 0;
    const unprocessed = total - processed;

    return NextResponse.json({
      success: true,
      status: {
        total,
        processed,
        unprocessed,
        complete: unprocessed === 0,
      },
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
