/**
 * Voice Calls API
 * GET /api/voice/calls - List calls
 * POST /api/voice/calls - Initiate outbound call
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
// GET - List Calls
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');
    const direction = searchParams.get('direction');
    const agentId = searchParams.get('agent_id');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('voice_calls')
      .select(`
        *,
        voice_agents (
          id,
          name,
          persona
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (direction) {
      query = query.eq('direction', direction);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: calls, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      calls: calls || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('[Calls API] Error listing calls:', error);
    return NextResponse.json(
      { error: 'Failed to list calls' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Initiate Outbound Call
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toNumber, agentId, metadata } = body;

    // Validate required fields
    if (!toNumber) {
      return NextResponse.json(
        { error: 'toNumber is required' },
        { status: 400 }
      );
    }

    // Get agent's Retell ID
    const supabase = getSupabaseAdmin();
    let retellAgentId = agentId;

    if (agentId && !agentId.startsWith('agent_')) {
      // It's a UUID, look up Retell agent ID
      const { data: agent } = await supabase
        .from('voice_agents')
        .select('retell_agent_id')
        .eq('id', agentId)
        .single();

      if (!agent?.retell_agent_id) {
        return NextResponse.json(
          { error: 'Agent not configured with Retell' },
          { status: 400 }
        );
      }

      retellAgentId = agent.retell_agent_id;
    }

    // Use default agent if none specified
    if (!retellAgentId) {
      retellAgentId = process.env.RETELL_AGENT_ID;
    }

    if (!retellAgentId) {
      return NextResponse.json(
        { error: 'No agent specified and no default agent configured' },
        { status: 400 }
      );
    }

    // Initiate call via Retell
    const result = await retellProvider.initiateCall({
      toNumber,
      agentId: retellAgentId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      callId: result.callId,
      externalCallId: result.externalCallId,
      status: result.status,
    });
  } catch (error) {
    console.error('[Calls API] Error initiating call:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate call';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
