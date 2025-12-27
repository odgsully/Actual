/**
 * Retell Webhook Parsing
 * Converts Retell webhook payloads to standardized events
 *
 * Retell Webhook Events:
 * - call_started: When a call begins
 * - call_ended: When a call ends (includes transcript, recording)
 * - call_analyzed: Post-call analysis complete
 *
 * Reference: https://docs.retellai.com/api-references/webhooks
 */

import type { ParsedWebhookEvent, WebhookEventType, WebhookEventData } from '../interface';
import type { VoiceTurn } from '../../types';

// ============================================================================
// RETELL WEBHOOK TYPES
// ============================================================================

interface RetellWebhookPayload {
  event: string;
  call: RetellCallData;
}

interface RetellCallData {
  call_id: string;
  call_status: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  agent_id: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  recording_url?: string;
  transcript?: string;
  transcript_object?: RetellTranscriptTurn[];
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: string;
    custom_analysis_data?: Record<string, unknown>;
  };
  call_cost?: {
    combined_cost?: number;
    llm_cost?: number;
    tts_cost?: number;
    stt_cost?: number;
  };
  disconnection_reason?: string;
  public_log_url?: string;
}

interface RetellTranscriptTurn {
  role: 'agent' | 'user';
  content: string;
  words?: {
    word: string;
    start: number;
    end: number;
  }[];
}

// ============================================================================
// WEBHOOK PARSING
// ============================================================================

/**
 * Parse Retell webhook payload into standardized event
 */
export function parseRetellWebhook(payload: unknown): ParsedWebhookEvent {
  const data = payload as RetellWebhookPayload;

  if (!data || !data.event || !data.call) {
    throw new Error('Invalid Retell webhook payload');
  }

  const eventType = mapRetellEventType(data.event);
  const eventData = extractEventData(data.call, eventType);

  return {
    type: eventType,
    callId: data.call.call_id,
    timestamp: new Date(),
    data: eventData,
    raw: payload,
  };
}

/**
 * Map Retell event types to our standardized types
 */
function mapRetellEventType(event: string): WebhookEventType {
  const eventMap: Record<string, WebhookEventType> = {
    'call_started': 'call_started',
    'call_ended': 'call_ended',
    'call_analyzed': 'call_analyzed',
    'agent_transfer': 'agent_transfer',
    'voicemail_detected': 'voicemail_detected',
  };

  return eventMap[event] || 'error';
}

/**
 * Extract relevant data from Retell call object
 */
function extractEventData(call: RetellCallData, eventType: WebhookEventType): WebhookEventData {
  const data: WebhookEventData = {
    status: mapRetellStatus(call.call_status),
    direction: call.direction,
    fromNumber: call.from_number,
    toNumber: call.to_number,
    agentId: call.agent_id,
  };

  // Timing
  if (call.start_timestamp) {
    data.startedAt = new Date(call.start_timestamp);
  }
  if (call.end_timestamp) {
    data.endedAt = new Date(call.end_timestamp);
  }
  if (call.duration_ms) {
    data.durationMs = call.duration_ms;
  }

  // Recording (only for call_ended)
  if (eventType === 'call_ended' && call.recording_url) {
    data.recordingUrl = call.recording_url;
    data.recordingDurationMs = call.duration_ms;
  }

  // Transcript
  if (call.transcript) {
    data.transcript = call.transcript;
  }
  if (call.transcript_object) {
    data.turns = parseTranscriptTurns(call.transcript_object, call.call_id);
  }

  // Analysis (call_analyzed event)
  if (call.call_analysis) {
    data.callSummary = call.call_analysis.call_summary;
    data.sentiment = call.call_analysis.user_sentiment;
  }

  // Costs
  if (call.call_cost) {
    data.costBreakdown = {
      platform: call.call_cost.combined_cost,
      llm: call.call_cost.llm_cost,
      tts: call.call_cost.tts_cost,
      stt: call.call_cost.stt_cost,
    };
  }

  // Error handling
  if (call.disconnection_reason && call.disconnection_reason !== 'call_ended') {
    data.errorCode = call.disconnection_reason;
    data.errorMessage = getDisconnectionMessage(call.disconnection_reason);
  }

  return data;
}

/**
 * Parse transcript turns from Retell format
 */
function parseTranscriptTurns(
  turns: RetellTranscriptTurn[],
  callId: string
): VoiceTurn[] {
  let currentMs = 0;

  return turns.map((turn, index) => {
    // Estimate timing from words if available
    let startMs = currentMs;
    let endMs = currentMs;

    if (turn.words && turn.words.length > 0) {
      startMs = turn.words[0].start;
      endMs = turn.words[turn.words.length - 1].end;
      currentMs = endMs;
    } else {
      // Estimate ~150ms per word
      const wordCount = turn.content.split(' ').length;
      endMs = startMs + wordCount * 150;
      currentMs = endMs;
    }

    return {
      id: `${callId}-turn-${index}`,
      callId,
      turnIndex: index,
      role: turn.role === 'agent' ? 'agent' : 'user',
      content: turn.content,
      startMs,
      endMs,
      words: turn.words?.map((w) => ({
        word: w.word,
        startMs: w.start,
        endMs: w.end,
      })),
      createdAt: new Date(),
    };
  });
}

/**
 * Map Retell call status to our status
 */
function mapRetellStatus(
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

  return statusMap[status] || 'completed';
}

/**
 * Get human-readable disconnection reason
 */
function getDisconnectionMessage(reason: string): string {
  const messages: Record<string, string> = {
    'user_hangup': 'Caller hung up',
    'agent_hangup': 'Agent ended the call',
    'call_transfer': 'Call was transferred',
    'voicemail_reached': 'Reached voicemail',
    'inactivity': 'Call ended due to inactivity',
    'machine_detected': 'Answering machine detected',
    'max_duration_reached': 'Maximum call duration reached',
    'concurrency_limit_reached': 'Concurrency limit reached',
    'no_valid_payment': 'Payment issue',
    'dial_busy': 'Line was busy',
    'dial_failed': 'Failed to connect',
    'dial_no_answer': 'No answer',
    'error_inbound_webhook': 'Webhook error',
    'error_llm_websocket': 'LLM connection error',
    'error_frontend_corrupted_payload': 'Corrupted audio',
    'error_twilio': 'Telephony error',
    'error_no_audio_from_agent': 'No audio from agent',
    'error_asr': 'Speech recognition error',
    'error_retell': 'Retell platform error',
    'error_unknown': 'Unknown error',
  };

  return messages[reason] || reason;
}
