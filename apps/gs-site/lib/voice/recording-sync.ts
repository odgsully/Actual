/**
 * Recording Sync Module
 * Downloads recordings from Retell (expires in 24h) and uploads to Supabase Storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface RecordingSyncResult {
  success: boolean;
  recordingId: string;
  storagePath?: string;
  error?: string;
  durationMs?: number;
}

export interface PendingRecording {
  id: string;
  call_id: string;
  original_url: string;
  original_url_expires_at: string | null;
  sync_status: string;
  external_call_id?: string;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// ============================================================================
// RECORDING SYNC
// ============================================================================

/**
 * Sync a single recording from Retell to Supabase Storage
 */
export async function syncRecording(recordingId: string): Promise<RecordingSyncResult> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  try {
    // Get recording record
    const { data: recording, error: fetchError } = await supabase
      .from('voice_recordings')
      .select(`
        id,
        call_id,
        original_url,
        original_url_expires_at,
        sync_status,
        voice_calls (
          external_call_id
        )
      `)
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      return {
        success: false,
        recordingId,
        error: `Recording not found: ${fetchError?.message || 'No data'}`,
      };
    }

    // Check if already synced
    if (recording.sync_status === 'uploaded') {
      return {
        success: true,
        recordingId,
        error: 'Already synced',
      };
    }

    // Check if URL expired
    if (recording.original_url_expires_at) {
      const expiresAt = new Date(recording.original_url_expires_at);
      if (expiresAt < new Date()) {
        await updateSyncStatus(supabase, recordingId, 'expired', 'Recording URL has expired');
        return {
          success: false,
          recordingId,
          error: 'Recording URL has expired',
        };
      }
    }

    if (!recording.original_url) {
      return {
        success: false,
        recordingId,
        error: 'No original URL available',
      };
    }

    // Mark as downloading
    await updateSyncStatus(supabase, recordingId, 'downloading');

    // Download recording from Retell
    const audioBuffer = await downloadRecording(recording.original_url);

    if (!audioBuffer) {
      await updateSyncStatus(supabase, recordingId, 'failed', 'Failed to download recording');
      return {
        success: false,
        recordingId,
        error: 'Failed to download recording',
      };
    }

    // Generate storage path
    const callId = recording.voice_calls?.[0]?.external_call_id || recording.call_id;
    const date = new Date().toISOString().split('T')[0];
    const storagePath = `${date}/${callId}.wav`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      await updateSyncStatus(supabase, recordingId, 'failed', `Upload failed: ${uploadError.message}`);
      return {
        success: false,
        recordingId,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Update recording record with storage path
    const { error: updateError } = await supabase
      .from('voice_recordings')
      .update({
        storage_path: storagePath,
        sync_status: 'uploaded',
        synced_at: new Date().toISOString(),
        file_size_bytes: audioBuffer.byteLength,
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('[Recording Sync] Failed to update record:', updateError);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Recording Sync] Synced ${recordingId} in ${durationMs}ms (${audioBuffer.byteLength} bytes)`);

    return {
      success: true,
      recordingId,
      storagePath,
      durationMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncStatus(supabase, recordingId, 'failed', errorMessage);
    return {
      success: false,
      recordingId,
      error: errorMessage,
    };
  }
}

/**
 * Sync all pending recordings
 */
export async function syncPendingRecordings(): Promise<{
  synced: number;
  failed: number;
  results: RecordingSyncResult[];
}> {
  const supabase = getSupabaseAdmin();

  // Get pending recordings that haven't expired
  const { data: pending, error } = await supabase
    .from('voice_recordings')
    .select('id')
    .eq('sync_status', 'pending')
    .or('original_url_expires_at.is.null,original_url_expires_at.gt.now()')
    .limit(10);

  if (error || !pending) {
    console.error('[Recording Sync] Failed to fetch pending recordings:', error);
    return { synced: 0, failed: 0, results: [] };
  }

  const results: RecordingSyncResult[] = [];
  let synced = 0;
  let failed = 0;

  for (const recording of pending) {
    const result = await syncRecording(recording.id);
    results.push(result);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed, results };
}

/**
 * Sync recording immediately after call ends
 * Called from webhook handler
 */
export async function syncRecordingFromUrl(
  callId: string,
  recordingUrl: string,
  durationMs?: number
): Promise<RecordingSyncResult> {
  const supabase = getSupabaseAdmin();
  const startTime = Date.now();

  try {
    // Get the call's internal ID
    const { data: call } = await supabase
      .from('voice_calls')
      .select('id, external_call_id')
      .eq('id', callId)
      .single();

    if (!call) {
      // Try by external_call_id
      const { data: callByExternal } = await supabase
        .from('voice_calls')
        .select('id, external_call_id')
        .eq('external_call_id', callId)
        .single();

      if (!callByExternal) {
        return {
          success: false,
          recordingId: '',
          error: `Call not found: ${callId}`,
        };
      }
    }

    const internalCallId = call?.id || callId;
    const externalCallId = call?.external_call_id || callId;

    // Download recording
    console.log(`[Recording Sync] Downloading from ${recordingUrl.substring(0, 60)}...`);
    const audioBuffer = await downloadRecording(recordingUrl);

    if (!audioBuffer) {
      return {
        success: false,
        recordingId: '',
        error: 'Failed to download recording',
      };
    }

    // Generate storage path
    const date = new Date().toISOString().split('T')[0];
    const storagePath = `${date}/${externalCallId}.wav`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        recordingId: '',
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Create or update recording record
    const { data: recording, error: upsertError } = await supabase
      .from('voice_recordings')
      .upsert({
        call_id: internalCallId,
        recording_type: 'call',
        format: 'wav',
        original_url: recordingUrl,
        storage_path: storagePath,
        duration_ms: durationMs,
        sync_status: 'uploaded',
        synced_at: new Date().toISOString(),
        file_size_bytes: audioBuffer.byteLength,
        original_url_expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'call_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[Recording Sync] Failed to upsert record:', upsertError);
    }

    const syncDuration = Date.now() - startTime;
    console.log(`[Recording Sync] Synced recording in ${syncDuration}ms (${audioBuffer.byteLength} bytes)`);

    return {
      success: true,
      recordingId: recording?.id || '',
      storagePath,
      durationMs: syncDuration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Recording Sync] Error:', errorMessage);
    return {
      success: false,
      recordingId: '',
      error: errorMessage,
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function downloadRecording(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'audio/*',
      },
    });

    if (!response.ok) {
      console.error(`[Recording Sync] Download failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[Recording Sync] Download error:', error);
    return null;
  }
}

async function updateSyncStatus(
  supabase: SupabaseClient,
  recordingId: string,
  status: string,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    sync_status: status,
    updated_at: new Date().toISOString(),
  };

  if (error) {
    updateData.sync_error = error;
  }

  await supabase
    .from('voice_recordings')
    .update(updateData)
    .eq('id', recordingId);
}

/**
 * Get a signed URL for a recording
 */
export async function getRecordingSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from('voice-recordings')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('[Recording Sync] Failed to create signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a recording from storage
 */
export async function deleteRecording(storagePath: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('voice-recordings')
    .remove([storagePath]);

  if (error) {
    console.error('[Recording Sync] Failed to delete recording:', error);
    return false;
  }

  return true;
}
