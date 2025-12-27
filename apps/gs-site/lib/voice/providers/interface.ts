/**
 * Voice Provider Interface
 * Abstract interface for voice AI providers (Retell, Pipecat, LiveKit, etc.)
 * Allows swapping providers without changing application code
 */

import type {
  AgentConfig,
  CallResult,
  CallStatus,
  InitiateCallParams,
  TransferTarget,
  VoiceCall,
  VoiceTurn,
} from '../types';

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export type WebhookEventType =
  | 'call_started'
  | 'call_ended'
  | 'call_analyzed'
  | 'agent_transfer'
  | 'voicemail_detected'
  | 'error';

export interface ParsedWebhookEvent {
  type: WebhookEventType;
  callId: string;
  timestamp: Date;
  data: WebhookEventData;
  raw: unknown;
}

export interface WebhookEventData {
  // Common fields
  status?: CallStatus;
  direction?: 'inbound' | 'outbound';
  fromNumber?: string;
  toNumber?: string;
  agentId?: string;

  // Timing
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;

  // Transcript
  transcript?: string;
  turns?: VoiceTurn[];

  // Recording
  recordingUrl?: string;
  recordingDurationMs?: number;

  // Analysis
  callSummary?: string;
  sentiment?: string;

  // Transfer
  transferTarget?: string;
  transferType?: 'cold' | 'warm' | 'agent_handoff';

  // Costs
  costBreakdown?: {
    platform?: number;
    llm?: number;
    tts?: number;
    stt?: number;
  };

  // Error
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface VoiceProvider {
  /**
   * Provider name (e.g., 'retell', 'pipecat', 'livekit')
   */
  readonly name: string;

  // --------------------------------------------------------------------------
  // AGENT MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create a new agent in the provider's system
   * @returns The provider's agent ID
   */
  createAgent(config: AgentConfig): Promise<string>;

  /**
   * Update an existing agent's configuration
   */
  updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<void>;

  /**
   * Delete an agent from the provider's system
   */
  deleteAgent(agentId: string): Promise<void>;

  /**
   * Get agent details from the provider
   */
  getAgent(agentId: string): Promise<AgentConfig | null>;

  // --------------------------------------------------------------------------
  // CALL OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Initiate an outbound call
   */
  initiateCall(params: InitiateCallParams): Promise<CallResult>;

  /**
   * Transfer an active call to another target (human or agent)
   */
  transferCall(callId: string, target: TransferTarget): Promise<void>;

  /**
   * End an active call
   */
  endCall(callId: string): Promise<void>;

  /**
   * Get call details from the provider
   */
  getCall(callId: string): Promise<VoiceCall | null>;

  // --------------------------------------------------------------------------
  // RECORDING & TRANSCRIPT
  // --------------------------------------------------------------------------

  /**
   * Get the recording URL for a completed call
   * Note: URLs may expire - download promptly
   */
  getRecordingUrl(callId: string): Promise<string | null>;

  /**
   * Get the transcript for a completed call
   */
  getTranscript(callId: string): Promise<string | null>;

  // --------------------------------------------------------------------------
  // WEBHOOK HANDLING
  // --------------------------------------------------------------------------

  /**
   * Verify webhook signature
   * @returns true if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /**
   * Parse a webhook payload into a standardized event
   */
  parseWebhook(payload: unknown): ParsedWebhookEvent;

  // --------------------------------------------------------------------------
  // PHONE NUMBER MANAGEMENT (optional)
  // --------------------------------------------------------------------------

  /**
   * List available phone numbers
   */
  listPhoneNumbers?(): Promise<PhoneNumber[]>;

  /**
   * Link a phone number to an agent
   */
  linkPhoneNumber?(phoneNumberId: string, agentId: string): Promise<void>;
}

// ============================================================================
// PHONE NUMBER TYPES
// ============================================================================

export interface PhoneNumber {
  id: string;
  number: string; // E.164 format
  agentId?: string;
  capabilities: ('inbound' | 'outbound' | 'sms')[];
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export type ProviderType = 'retell' | 'pipecat' | 'livekit' | 'vapi';

/**
 * Get a voice provider instance
 * Currently only Retell is implemented
 */
export function getVoiceProvider(type: ProviderType = 'retell'): VoiceProvider {
  switch (type) {
    case 'retell':
      // Lazy import to avoid loading unused providers
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RetellProvider } = require('./retell/client');
      return new RetellProvider();
    default:
      throw new Error(`Voice provider '${type}' is not implemented`);
  }
}
