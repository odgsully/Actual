/**
 * Retell AI Provider Implementation
 * https://docs.retellai.com/
 */

import type {
  AgentConfig,
  CallResult,
  InitiateCallParams,
  TransferTarget,
  VoiceCall,
} from '../../types';
import type { ParsedWebhookEvent, VoiceProvider } from '../interface';
import { verifyRetellSignature } from '../../webhook-security';
import { parseRetellWebhook } from './webhooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RETELL_API_BASE = 'https://api.retellai.com';

function getApiKey(): string {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    throw new Error('RETELL_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getWebhookSecret(): string {
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('RETELL_WEBHOOK_SECRET environment variable is not set');
  }
  return secret;
}

// ============================================================================
// API HELPERS
// ============================================================================

interface RetellApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function retellApi<T>(
  endpoint: string,
  options: RetellApiOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  const response = await fetch(`${RETELL_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Retell API error (${response.status}): ${error}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// RETELL PROVIDER
// ============================================================================

export class RetellProvider implements VoiceProvider {
  readonly name = 'retell';

  // --------------------------------------------------------------------------
  // AGENT MANAGEMENT
  // --------------------------------------------------------------------------

  async createAgent(config: AgentConfig): Promise<string> {
    interface RetellAgentResponse {
      agent_id: string;
    }

    const response = await retellApi<RetellAgentResponse>('/create-agent', {
      method: 'POST',
      body: {
        agent_name: config.name,
        voice_id: config.voiceId,
        llm_websocket_url: config.webhookUrl,
        response_engine: {
          type: 'retell-llm',
          llm_id: undefined, // Use default
        },
        general_prompt: config.systemPrompt,
        general_tools: [],
        enable_backchannel: true,
        ambient_sound: null,
        language: 'en-US',
        opt_out_sensitive_data_storage: false,
        pronunciation_dictionary: [],
        normalize_for_speech: true,
        end_call_after_silence_ms: 30000,
        max_call_duration_ms: (config.maxDurationSeconds || 300) * 1000,
        enable_voicemail_detection: true,
        voicemail_message: "Hi, you've reached Garrett Sullivan's office. Please leave a message.",
        post_call_analysis_data: [],
      },
    });

    return response.agent_id;
  }

  async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<void> {
    const updateBody: Record<string, unknown> = {};

    if (config.name) updateBody.agent_name = config.name;
    if (config.systemPrompt) updateBody.general_prompt = config.systemPrompt;
    if (config.voiceId) updateBody.voice_id = config.voiceId;
    if (config.maxDurationSeconds) {
      updateBody.max_call_duration_ms = config.maxDurationSeconds * 1000;
    }

    await retellApi(`/update-agent/${agentId}`, {
      method: 'PATCH',
      body: updateBody,
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await retellApi(`/delete-agent/${agentId}`, {
      method: 'DELETE',
    });
  }

  async getAgent(agentId: string): Promise<AgentConfig | null> {
    try {
      interface RetellAgentDetails {
        agent_id: string;
        agent_name: string;
        voice_id: string;
        general_prompt: string;
        max_call_duration_ms: number;
      }

      const response = await retellApi<RetellAgentDetails>(`/get-agent/${agentId}`);

      return {
        name: response.agent_name,
        voiceId: response.voice_id,
        systemPrompt: response.general_prompt,
        maxDurationSeconds: response.max_call_duration_ms / 1000,
      };
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // CALL OPERATIONS
  // --------------------------------------------------------------------------

  async initiateCall(params: InitiateCallParams): Promise<CallResult> {
    interface RetellCallResponse {
      call_id: string;
      call_status: string;
    }

    const response = await retellApi<RetellCallResponse>('/create-phone-call', {
      method: 'POST',
      body: {
        agent_id: params.agentId,
        to_number: params.toNumber,
        from_number: params.fromNumber || process.env.RETELL_PHONE_NUMBER,
        metadata: params.metadata,
      },
    });

    return {
      callId: response.call_id,
      externalCallId: response.call_id,
      status: this.mapRetellStatus(response.call_status),
    };
  }

  async transferCall(callId: string, target: TransferTarget): Promise<void> {
    if (target.type === 'human' && target.number) {
      // Warm transfer to human
      await retellApi(`/transfer-call/${callId}`, {
        method: 'POST',
        body: {
          transfer_to: target.number,
          transfer_type: 'warm',
          whisper_message: `Incoming call transfer. Caller requested to speak with ${target.name}.`,
        },
      });
    } else if (target.type === 'agent' && target.agentId) {
      // Agent-to-agent transfer
      await retellApi(`/transfer-call/${callId}`, {
        method: 'POST',
        body: {
          transfer_to_agent_id: target.agentId,
        },
      });
    } else {
      throw new Error('Invalid transfer target: must specify number or agentId');
    }
  }

  async endCall(callId: string): Promise<void> {
    await retellApi(`/end-call/${callId}`, {
      method: 'POST',
    });
  }

  async getCall(callId: string): Promise<VoiceCall | null> {
    try {
      interface RetellCallDetails {
        call_id: string;
        call_status: string;
        direction: string;
        from_number: string;
        to_number: string;
        agent_id: string;
        start_timestamp: number;
        end_timestamp: number;
        duration_ms: number;
        transcript: string;
        recording_url: string;
        cost: {
          platform: number;
          llm: number;
          tts: number;
          stt: number;
        };
      }

      const response = await retellApi<RetellCallDetails>(`/get-call/${callId}`);

      return {
        id: response.call_id,
        externalCallId: response.call_id,
        platform: 'retell',
        direction: response.direction === 'inbound' ? 'inbound' : 'outbound',
        status: this.mapRetellStatus(response.call_status),
        callType: 'live',
        fromNumber: response.from_number,
        toNumber: response.to_number,
        startedAt: response.start_timestamp ? new Date(response.start_timestamp) : undefined,
        endedAt: response.end_timestamp ? new Date(response.end_timestamp) : undefined,
        durationMs: response.duration_ms,
        agentId: response.agent_id,
        costBreakdown: response.cost,
        totalCostUsd: response.cost
          ? Object.values(response.cost).reduce((a, b) => a + b, 0)
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // RECORDING & TRANSCRIPT
  // --------------------------------------------------------------------------

  async getRecordingUrl(callId: string): Promise<string | null> {
    try {
      interface RetellRecordingResponse {
        recording_url: string;
      }

      const response = await retellApi<RetellRecordingResponse>(`/get-call/${callId}`);
      return response.recording_url || null;
    } catch {
      return null;
    }
  }

  async getTranscript(callId: string): Promise<string | null> {
    try {
      interface RetellTranscriptResponse {
        transcript: string;
      }

      const response = await retellApi<RetellTranscriptResponse>(`/get-call/${callId}`);
      return response.transcript || null;
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // WEBHOOK HANDLING
  // --------------------------------------------------------------------------

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return verifyRetellSignature(payload, signature, getWebhookSecret());
  }

  parseWebhook(payload: unknown): ParsedWebhookEvent {
    return parseRetellWebhook(payload);
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private mapRetellStatus(
    status: string
  ): 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail' | 'transferred' {
    const statusMap: Record<string, 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail' | 'transferred'> = {
      'registered': 'initiated',
      'ongoing': 'in_progress',
      'ended': 'completed',
      'error': 'failed',
      'no-answer': 'no_answer',
      'busy': 'busy',
      'voicemail': 'voicemail',
      'transferred': 'transferred',
    };

    return statusMap[status] || 'initiated';
  }
}

// Export singleton instance
export const retellProvider = new RetellProvider();
