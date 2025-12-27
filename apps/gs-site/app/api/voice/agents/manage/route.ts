/**
 * Agent Management API
 * POST /api/voice/agents/manage
 *
 * Creates, updates, or syncs agents with Retell AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AGENT_DEFINITIONS, MODEL_BY_TIER } from '@/lib/voice/agents/definitions';

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
// RETELL API HELPERS
// ============================================================================

async function retellApi<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(`${RETELL_API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${getRetellApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Retell API error (${response.status}): ${error}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

async function listRetellVoices(): Promise<Array<{
  voice_id: string;
  voice_name: string;
  provider: string;
  gender: string;
  accent: string;
}>> {
  return retellApi('/list-voices');
}

async function createRetellAgent(config: {
  agent_name: string;
  voice_id: string;
  response_engine: { type: string; llm_id?: string };
  llm_websocket_url?: string;
}): Promise<{ agent_id: string }> {
  return retellApi('/create-agent', {
    method: 'POST',
    body: config,
  });
}

async function createRetellLlm(config: {
  model: string;
  general_prompt: string;
  general_tools?: Array<{
    type: string;
    name: string;
    description: string;
  }>;
  begin_message?: string;
}): Promise<{ llm_id: string }> {
  return retellApi('/create-retell-llm', {
    method: 'POST',
    body: config,
  });
}

async function getRetellAgent(agentId: string): Promise<{
  agent_id: string;
  agent_name: string;
  voice_id: string;
} | null> {
  try {
    return await retellApi(`/get-agent/${agentId}`);
  } catch {
    return null;
  }
}

// ============================================================================
// VOICE SELECTION
// ============================================================================

const PREFERRED_VOICES: Record<string, { gender: string; style: string }> = {
  morgan: { gender: 'female', style: 'professional' },
  emily_liu: { gender: 'female', style: 'calm' },
  noah_carter: { gender: 'male', style: 'energetic' },
  kyle_blonkosky: { gender: 'male', style: 'confident' },
  victoria_chen: { gender: 'female', style: 'calm' },
  daniel_park: { gender: 'male', style: 'neutral' },
};

// Recommended ElevenLabs voices from Retell
const VOICE_MAPPING: Record<string, string> = {
  // Female voices
  'female_professional': '11labs-Rachel', // Professional, American
  'female_calm': '11labs-Elli',           // Calm, American
  'female_analytical': '11labs-Bella',    // Clear, analytical
  // Male voices
  'male_energetic': '11labs-Josh',        // Energetic, American
  'male_confident': '11labs-Arnold',      // Confident, authoritative
  'male_neutral': '11labs-Adam',          // Neutral, professional
  // Fallbacks
  'default_female': '11labs-Rachel',
  'default_male': '11labs-Josh',
};

function selectVoiceForAgent(agentSlug: string): string {
  const pref = PREFERRED_VOICES[agentSlug];
  if (!pref) return VOICE_MAPPING['default_female'];

  const key = `${pref.gender}_${pref.style}`;
  return VOICE_MAPPING[key] || VOICE_MAPPING[`default_${pref.gender}`] || '11labs-Rachel';
}

// ============================================================================
// AGENT CREATION
// ============================================================================

interface CreateAgentResult {
  success: boolean;
  agentSlug: string;
  retellAgentId?: string;
  retellLlmId?: string;
  voiceId?: string;
  error?: string;
}

async function createAgentInRetell(
  agentDef: (typeof AGENT_DEFINITIONS)[number],
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<CreateAgentResult> {
  try {
    // 1. Select voice
    const voiceId = agentDef.voiceId || selectVoiceForAgent(agentDef.slug);

    // 2. Create LLM configuration in Retell
    const model = MODEL_BY_TIER[agentDef.modelTier];
    const llmConfig = {
      model,
      general_prompt: agentDef.systemPrompt,
      begin_message: `Hi, this is ${agentDef.name}. How can I help you today?`,
      general_tools: [
        {
          type: 'end_call',
          name: 'end_call',
          description: 'End the call when the conversation is complete',
        },
      ],
    };

    const llmResponse = await createRetellLlm(llmConfig);

    // 3. Create agent with the LLM
    const agentConfig = {
      agent_name: agentDef.name,
      voice_id: voiceId,
      response_engine: {
        type: 'retell-llm',
        llm_id: llmResponse.llm_id,
      },
      enable_backchannel: true,
      language: 'en-US',
      interruption_sensitivity: agentDef.interruptionSensitivity,
      max_call_duration_ms: agentDef.maxCallDurationSeconds * 1000,
    };

    const agentResponse = await createRetellAgent(agentConfig as Parameters<typeof createRetellAgent>[0]);

    // 4. Update Supabase with Retell IDs
    const { error: updateError } = await supabase
      .from('voice_agents')
      .update({
        retell_agent_id: agentResponse.agent_id,
        voice_id: voiceId,
        updated_at: new Date().toISOString(),
      })
      .eq('name', agentDef.name);

    if (updateError) {
      console.error(`Failed to update Supabase for ${agentDef.name}:`, updateError);
    }

    return {
      success: true,
      agentSlug: agentDef.slug,
      retellAgentId: agentResponse.agent_id,
      retellLlmId: llmResponse.llm_id,
      voiceId,
    };
  } catch (error) {
    return {
      success: false,
      agentSlug: agentDef.slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agents } = body as {
      action: 'create' | 'sync' | 'list_voices' | 'status';
      agents?: string[]; // Agent slugs to create/update
    };

    const supabase = getSupabaseAdmin();

    // ========== LIST VOICES ==========
    if (action === 'list_voices') {
      const voices = await listRetellVoices();
      return NextResponse.json({
        success: true,
        voices: voices.slice(0, 50), // Limit response size
      });
    }

    // ========== STATUS CHECK ==========
    if (action === 'status') {
      const { data: dbAgents } = await supabase
        .from('voice_agents')
        .select('name, retell_agent_id, voice_id, is_active');

      const status = await Promise.all(
        (dbAgents || []).map(async (agent) => {
          let retellStatus = 'not_configured';
          if (agent.retell_agent_id) {
            const retellAgent = await getRetellAgent(agent.retell_agent_id);
            retellStatus = retellAgent ? 'active' : 'missing';
          }
          return {
            name: agent.name,
            retellAgentId: agent.retell_agent_id,
            voiceId: agent.voice_id,
            isActive: agent.is_active,
            retellStatus,
          };
        })
      );

      return NextResponse.json({ success: true, agents: status });
    }

    // ========== CREATE AGENTS ==========
    if (action === 'create' || action === 'sync') {
      const agentsToCreate = agents
        ? AGENT_DEFINITIONS.filter(a => agents.includes(a.slug))
        : AGENT_DEFINITIONS;

      if (agentsToCreate.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid agents specified' },
          { status: 400 }
        );
      }

      const results: CreateAgentResult[] = [];

      for (const agentDef of agentsToCreate) {
        // Skip if already configured (unless syncing)
        if (action !== 'sync') {
          const { data: existing } = await supabase
            .from('voice_agents')
            .select('retell_agent_id')
            .eq('name', agentDef.name)
            .single();

          if (existing?.retell_agent_id) {
            results.push({
              success: true,
              agentSlug: agentDef.slug,
              retellAgentId: existing.retell_agent_id,
              error: 'Already configured',
            });
            continue;
          }
        }

        const result = await createAgentInRetell(agentDef, supabase);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      const successful = results.filter(r => r.success && !r.error?.includes('Already'));
      const failed = results.filter(r => !r.success);

      return NextResponse.json({
        success: failed.length === 0,
        created: successful.length,
        failed: failed.length,
        results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Agent management error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return status of all agents
  try {
    const supabase = getSupabaseAdmin();
    const { data: agents } = await supabase
      .from('voice_agents')
      .select('name, retell_agent_id, voice_id, is_active, model_tier, model_primary');

    return NextResponse.json({
      success: true,
      agents: agents || [],
      definitions: AGENT_DEFINITIONS.map(a => ({
        slug: a.slug,
        name: a.name,
        role: a.role,
        modelTier: a.modelTier,
        handlesIntents: a.handlesIntents,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
