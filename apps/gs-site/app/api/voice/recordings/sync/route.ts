/**
 * Recording Sync API
 * POST /api/voice/recordings/sync - Sync pending recordings to Supabase Storage
 * GET /api/voice/recordings/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  syncRecording,
  syncPendingRecordings,
  syncRecordingFromUrl,
} from '@/lib/voice/recording-sync';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// ============================================================================
// GET - Sync Status
// ============================================================================

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get recording stats
    const { data: stats } = await supabase
      .from('voice_recordings')
      .select('sync_status')
      .then(({ data }) => {
        const counts = {
          pending: 0,
          syncing: 0,
          uploaded: 0,
          failed: 0,
          expired: 0,
        };

        for (const r of data || []) {
          const status = r.sync_status as keyof typeof counts;
          if (status in counts) {
            counts[status]++;
          }
        }

        return { data: counts };
      });

    // Get recent recordings
    const { data: recent } = await supabase
      .from('voice_recordings')
      .select(`
        id,
        sync_status,
        storage_path,
        file_size_bytes,
        synced_at,
        created_at,
        voice_calls (
          external_call_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      status: 'ok',
      stats,
      recent: (recent || []).map((r) => ({
        id: r.id,
        callId: r.voice_calls?.[0]?.external_call_id,
        syncStatus: r.sync_status,
        storagePath: r.storage_path,
        fileSizeBytes: r.file_size_bytes,
        syncedAt: r.synced_at,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('[Recording Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Trigger Sync
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { recordingId, callId, recordingUrl, syncAll } = body;

    // Sync all pending recordings
    if (syncAll) {
      const result = await syncPendingRecordings();
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} recordings, ${result.failed} failed`,
        ...result,
      });
    }

    // Sync specific recording by ID
    if (recordingId) {
      const result = await syncRecording(recordingId);
      return NextResponse.json(result);
    }

    // Sync recording from URL (immediate sync after call)
    if (callId && recordingUrl) {
      const result = await syncRecordingFromUrl(callId, recordingUrl);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Must provide recordingId, syncAll=true, or callId+recordingUrl' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Recording Sync API] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
