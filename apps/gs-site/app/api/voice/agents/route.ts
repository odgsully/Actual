/**
 * Voice Agents API
 * GET /api/voice/agents - List agents
 * POST /api/voice/agents - Link Retell agent to our database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
// GET - List Agents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') !== 'false';

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('voice_agents')
      .select('*')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: agents, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to camelCase for API response
    const transformedAgents = (agents || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      persona: agent.persona,
      description: agent.description,
      retellAgentId: agent.retell_agent_id,
      voiceProvider: agent.voice_provider,
      voiceId: agent.voice_id,
      modelPrimary: agent.model_primary,
      modelTier: agent.model_tier,
      isActive: agent.is_active,
      canTransfer: agent.can_transfer,
      transferTargets: agent.transfer_targets,
      maxCallDurationSeconds: agent.max_call_duration_seconds,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    }));

    return NextResponse.json({
      agents: transformedAgents,
      count: transformedAgents.length,
    });
  } catch (error) {
    console.error('[Agents API] Error listing agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Link Retell Agent ID
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, retellAgentId } = body;

    // Validate required fields
    if (!agentId || !retellAgentId) {
      return NextResponse.json(
        { error: 'agentId and retellAgentId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update agent with Retell ID
    const { data: agent, error } = await supabase
      .from('voice_agents')
      .update({
        retell_agent_id: retellAgentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        retellAgentId: agent.retell_agent_id,
      },
    });
  } catch (error) {
    console.error('[Agents API] Error linking agent:', error);
    const message = error instanceof Error ? error.message : 'Failed to link agent';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Agent (using POST with _method for simplicity)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, updates } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.retellAgentId !== undefined) {
      dbUpdates.retell_agent_id = updates.retellAgentId;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }
    if (updates.voiceId !== undefined) {
      dbUpdates.voice_id = updates.voiceId;
    }
    if (updates.systemPrompt !== undefined) {
      dbUpdates.system_prompt = updates.systemPrompt;
    }
    if (updates.modelPrimary !== undefined) {
      dbUpdates.model_primary = updates.modelPrimary;
    }
    if (updates.transferTargets !== undefined) {
      dbUpdates.transfer_targets = updates.transferTargets;
    }

    const { data: agent, error } = await supabase
      .from('voice_agents')
      .update(dbUpdates)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        retellAgentId: agent.retell_agent_id,
        isActive: agent.is_active,
      },
    });
  } catch (error) {
    console.error('[Agents API] Error updating agent:', error);
    const message = error instanceof Error ? error.message : 'Failed to update agent';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
