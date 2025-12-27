/**
 * Call Transfer API
 * POST /api/voice/calls/[callId]/transfer
 *
 * Transfers an active call to another agent or human.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getAgentBySlug,
  RETELL_AGENT_IDS,
} from '@/lib/voice/agents/definitions';
import {
  validateTransferRequest,
  generateWhisperMessage,
  type TransferContext,
} from '@/lib/voice/agents/router';

// ============================================================================
// CONFIG
// ============================================================================

const RETELL_API_BASE = 'https://api.retellai.com';

function getRetellApiKey(): string {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error('RETELL_API_KEY not configured');
  return key;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

// ============================================================================
// RETELL API
// ============================================================================

async function transferRetellCall(
  callId: string,
  options: {
    type: 'agent' | 'human';
    targetAgentId?: string;
    targetNumber?: string;
    whisperMessage?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = {};

    if (options.type === 'agent' && options.targetAgentId) {
      body.transfer_to_agent_id = options.targetAgentId;
    } else if (options.type === 'human' && options.targetNumber) {
      body.transfer_to = options.targetNumber;
      body.transfer_type = 'warm';
      if (options.whisperMessage) {
        body.whisper_message = options.whisperMessage;
      }
    } else {
      return { success: false, error: 'Invalid transfer configuration' };
    }

    const response = await fetch(`${RETELL_API_BASE}/v2/transfer-call/${callId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getRetellApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Retell API error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

interface TransferRequestBody {
  targetType: 'agent' | 'human';
  targetAgentSlug?: string;
  targetNumber?: string;
  context: Partial<TransferContext>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const body = (await request.json()) as TransferRequestBody;
    const { targetType, targetAgentSlug, targetNumber, context } = body;

    const supabase = getSupabaseAdmin();

    // 1. Get the call from our database
    const { data: call, error: callError } = await supabase
      .from('voice_calls')
      .select('id, external_call_id, agent_id, status, from_number')
      .eq('external_call_id', callId)
      .single();

    if (callError || !call) {
      return NextResponse.json(
        { success: false, error: 'Call not found' },
        { status: 404 }
      );
    }

    if (call.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: `Cannot transfer call in ${call.status} status` },
        { status: 400 }
      );
    }

    // 2. Get current agent info
    let fromAgentSlug = 'morgan'; // Default
    if (call.agent_id) {
      const { data: agent } = await supabase
        .from('voice_agents')
        .select('name')
        .eq('id', call.agent_id)
        .single();
      if (agent) {
        fromAgentSlug = agent.name.toLowerCase().replace(' ', '_');
      }
    }

    // 3. Handle transfer based on type
    if (targetType === 'agent') {
      if (!targetAgentSlug) {
        return NextResponse.json(
          { success: false, error: 'targetAgentSlug required for agent transfer' },
          { status: 400 }
        );
      }

      // Validate the transfer
      const validation = validateTransferRequest({
        callId,
        fromAgentSlug,
        toAgentSlug: targetAgentSlug,
        context: {
          callerNumber: call.from_number,
          intent: context.intent || 'unknown',
          summary: context.summary || '',
          urgency: context.urgency || 'normal',
          previousAgents: context.previousAgents || [],
        },
      });

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      // Get the Retell agent ID
      const targetRetellId = RETELL_AGENT_IDS[targetAgentSlug];
      if (!targetRetellId) {
        return NextResponse.json(
          { success: false, error: `Agent ${targetAgentSlug} not configured in Retell` },
          { status: 400 }
        );
      }

      // Execute transfer
      const transferResult = await transferRetellCall(callId, {
        type: 'agent',
        targetAgentId: targetRetellId,
      });

      if (!transferResult.success) {
        return NextResponse.json(
          { success: false, error: transferResult.error },
          { status: 500 }
        );
      }

      // Update call record
      const targetAgent = getAgentBySlug(targetAgentSlug);
      const { data: targetAgentDb } = await supabase
        .from('voice_agents')
        .select('id')
        .eq('name', targetAgent?.name)
        .single();

      await supabase
        .from('voice_calls')
        .update({
          transferred_to: targetAgentSlug,
          transfer_type: 'agent_handoff',
          transfer_context: context,
          transfer_at: new Date().toISOString(),
          agent_id: targetAgentDb?.id,
        })
        .eq('id', call.id);

      return NextResponse.json({
        success: true,
        transferType: 'agent',
        targetAgent: targetAgentSlug,
      });
    }

    // Human transfer
    if (targetType === 'human') {
      if (!targetNumber) {
        return NextResponse.json(
          { success: false, error: 'targetNumber required for human transfer' },
          { status: 400 }
        );
      }

      // Generate whisper message
      const whisperMessage = generateWhisperMessage({
        callerName: context.callerName,
        callerNumber: call.from_number,
        intent: context.intent || 'unknown',
        summary: context.summary || '',
        urgency: context.urgency || 'normal',
        previousAgents: context.previousAgents || [],
      });

      // Execute transfer
      const transferResult = await transferRetellCall(callId, {
        type: 'human',
        targetNumber,
        whisperMessage,
      });

      if (!transferResult.success) {
        return NextResponse.json(
          { success: false, error: transferResult.error },
          { status: 500 }
        );
      }

      // Update call record
      await supabase
        .from('voice_calls')
        .update({
          status: 'transferred',
          transferred_to: targetNumber,
          transfer_type: 'warm',
          transfer_context: { ...context, whisperMessage },
          transfer_at: new Date().toISOString(),
        })
        .eq('id', call.id);

      return NextResponse.json({
        success: true,
        transferType: 'human',
        targetNumber,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid targetType' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
