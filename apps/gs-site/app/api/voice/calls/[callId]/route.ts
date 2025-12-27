/**
 * Single Call API
 * GET /api/voice/calls/[callId] - Get call details
 * DELETE /api/voice/calls/[callId] - End/delete call record
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { retellProvider } from '@/lib/voice/providers/retell/client';

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
// GET - Get Single Call Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;

    const supabase = getSupabaseAdmin();

    // Get call with related data
    const { data: call, error } = await supabase
      .from('voice_calls')
      .select(`
        *,
        voice_agents (
          id,
          name,
          persona,
          description
        ),
        voice_transcripts (
          id,
          transcript_text,
          word_count,
          summary,
          created_at
        ),
        voice_recordings (
          id,
          recording_type,
          storage_path,
          original_url,
          duration_ms,
          sync_status,
          created_at
        ),
        voice_turns (
          id,
          turn_index,
          role,
          content,
          start_ms,
          end_ms
        )
      `)
      .eq('id', callId)
      .single();

    if (error) {
      // Try by external_call_id if UUID lookup fails
      if (error.code === 'PGRST116') {
        const { data: callByExternalId, error: externalError } = await supabase
          .from('voice_calls')
          .select(`
            *,
            voice_agents (
              id,
              name,
              persona,
              description
            ),
            voice_transcripts (
              id,
              transcript_text,
              word_count,
              summary,
              created_at
            ),
            voice_recordings (
              id,
              recording_type,
              storage_path,
              original_url,
              duration_ms,
              sync_status,
              created_at
            ),
            voice_turns (
              id,
              turn_index,
              role,
              content,
              start_ms,
              end_ms
            )
          `)
          .eq('external_call_id', callId)
          .single();

        if (externalError || !callByExternalId) {
          return NextResponse.json(
            { error: 'Call not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ call: transformCall(callByExternalId) });
      }

      throw error;
    }

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ call: transformCall(call) });
  } catch (error) {
    console.error('[Call API] Error getting call:', error);
    return NextResponse.json(
      { error: 'Failed to get call' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - End Call or Delete Record
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const endCall = searchParams.get('end') === 'true';

    const supabase = getSupabaseAdmin();

    // Get call to check status
    const { data: call, error: fetchError } = await supabase
      .from('voice_calls')
      .select('id, external_call_id, status')
      .or(`id.eq.${callId},external_call_id.eq.${callId}`)
      .single();

    if (fetchError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // If call is in progress and endCall=true, end it via Retell
    if (endCall && call.status === 'in_progress' && call.external_call_id) {
      try {
        await retellProvider.endCall(call.external_call_id);
      } catch (endError) {
        console.error('[Call API] Failed to end call via Retell:', endError);
        // Continue - we'll still mark it as ended in our DB
      }

      // Update status
      await supabase
        .from('voice_calls')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', call.id);

      return NextResponse.json({
        success: true,
        message: 'Call ended',
        callId: call.id,
      });
    }

    // Otherwise, soft delete (archive) the call record
    const { error: deleteError } = await supabase
      .from('voice_calls')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', call.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Call record archived',
      callId: call.id,
    });
  } catch (error) {
    console.error('[Call API] Error deleting call:', error);
    return NextResponse.json(
      { error: 'Failed to delete call' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

interface DbCall {
  id: string;
  external_call_id: string;
  platform: string;
  direction: string;
  status: string;
  call_type: string;
  from_number: string;
  to_number: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  agent_id: string | null;
  cost_breakdown: Record<string, number> | null;
  total_cost_usd: number | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  voice_agents: {
    id: string;
    name: string;
    persona: string;
    description: string;
  } | null;
  voice_transcripts: Array<{
    id: string;
    transcript_text: string;
    word_count: number;
    summary: string | null;
    created_at: string;
  }>;
  voice_recordings: Array<{
    id: string;
    recording_type: string;
    storage_path: string | null;
    original_url: string;
    duration_ms: number | null;
    sync_status: string;
    created_at: string;
  }>;
  voice_turns: Array<{
    id: string;
    turn_index: number;
    role: string;
    content: string;
    start_ms: number | null;
    end_ms: number | null;
  }>;
}

function transformCall(call: DbCall) {
  return {
    id: call.id,
    externalCallId: call.external_call_id,
    platform: call.platform,
    direction: call.direction,
    status: call.status,
    callType: call.call_type,
    fromNumber: call.from_number,
    toNumber: call.to_number,
    startedAt: call.started_at,
    endedAt: call.ended_at,
    durationMs: call.duration_ms,
    durationFormatted: call.duration_ms
      ? formatDuration(call.duration_ms)
      : null,
    agent: call.voice_agents
      ? {
          id: call.voice_agents.id,
          name: call.voice_agents.name,
          persona: call.voice_agents.persona,
          description: call.voice_agents.description,
        }
      : null,
    transcript: call.voice_transcripts?.[0]
      ? {
          id: call.voice_transcripts[0].id,
          text: call.voice_transcripts[0].transcript_text,
          wordCount: call.voice_transcripts[0].word_count,
          summary: call.voice_transcripts[0].summary,
        }
      : null,
    recordings: (call.voice_recordings || []).map((r) => ({
      id: r.id,
      type: r.recording_type,
      url: r.storage_path || r.original_url,
      durationMs: r.duration_ms,
      syncStatus: r.sync_status,
    })),
    turns: (call.voice_turns || [])
      .sort((a, b) => a.turn_index - b.turn_index)
      .map((t) => ({
        index: t.turn_index,
        role: t.role,
        content: t.content,
        startMs: t.start_ms,
        endMs: t.end_ms,
      })),
    costBreakdown: call.cost_breakdown,
    totalCostUsd: call.total_cost_usd,
    error: call.error_code
      ? {
          code: call.error_code,
          message: call.error_message,
        }
      : null,
    metadata: call.metadata,
    createdAt: call.created_at,
    updatedAt: call.updated_at,
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
