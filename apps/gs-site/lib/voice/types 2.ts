/**
 * Voice AI Types
 * Provider-agnostic types for the voice calling system
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface VoiceAgent {
  id: string;
  name: string;
  persona: 'Direct' | 'Diplomatic' | 'Analytical' | 'Creative' | 'Casual' | 'Technical';
  description?: string;
  retellAgentId?: string;
  voiceProvider: 'elevenlabs' | 'cartesia' | 'openai' | 'azure' | 'retell';
  voiceId: string;
  voiceSettings?: Record<string, unknown>;
  systemPrompt: string;
  modelPrimary: string;
  modelFallback?: string[];
  temperature?: number;
  interruptionSensitivity?: number;
  responseDelayMs?: number;
  maxCallDurationSeconds?: number;
  enabledTools?: string[];
  canTransfer?: boolean;
  transferTargets?: TransferTarget[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferTarget {
  name: string;
  number?: string;
  agentId?: string;
  type: 'human' | 'agent' | 'voicemail';
}

// ============================================================================
// CALL TYPES
// ============================================================================

export type CallDirection = 'inbound' | 'outbound';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'transferred';

export type CallType = 'live' | 'voicemail' | 'missed';

export interface VoiceCall {
  id: string;
  externalCallId: string;
  platform: 'retell' | 'pipecat' | 'livekit' | 'vapi' | 'twilio';
  direction: CallDirection;
  status: CallStatus;
  callType: CallType;
  fromNumber: string;
  toNumber: string;
  startedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  talkTimeMs?: number;
  agentId?: string;
  agentName?: string;
  agentPersona?: string;
  transferredTo?: string;
  transferType?: 'cold' | 'warm' | 'agent_handoff';
  transferContext?: Record<string, unknown>;
  transferAt?: Date;
  outcome?: string;
  outcomeDetails?: Record<string, unknown>;
  costBreakdown?: CostBreakdown;
  totalCostUsd?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  userId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostBreakdown {
  platform?: number;
  llm?: number;
  tts?: number;
  stt?: number;
  telephony?: number;
}

// ============================================================================
// TRANSCRIPT TYPES
// ============================================================================

export type TurnRole = 'user' | 'agent' | 'system';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface VoiceTurn {
  id: string;
  callId: string;
  turnIndex: number;
  role: TurnRole;
  content: string;
  startMs: number;
  endMs: number;
  words?: WordTimestamp[];
  sentiment?: Sentiment;
  sentimentScore?: number;
  confidence?: number;
  detectedIntent?: string;
  intentConfidence?: number;
  wasInterrupted?: boolean;
  interruptedAtMs?: number;
  language?: string;
  createdAt: Date;
}

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface VoiceTranscript {
  id: string;
  callId: string;
  format: 'plain' | 'timestamped' | 'speaker_labeled' | 'json';
  content: string;
  wordCount?: number;
  characterCount?: number;
  createdAt: Date;
}

// ============================================================================
// RECORDING TYPES
// ============================================================================

export type RecordingType = 'call' | 'voicemail';
export type SyncStatus = 'pending' | 'downloading' | 'uploaded' | 'failed';

export interface VoiceRecording {
  id: string;
  callId: string;
  recordingType: RecordingType;
  externalUrl?: string;
  storagePath?: string;
  publicUrl?: string;
  durationMs?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  channels?: number;
  sampleRate?: number;
  syncStatus: SyncStatus;
  syncError?: string;
  syncedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export type WebhookStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface WebhookQueueItem {
  id: string;
  webhookType: string;
  payload: Record<string, unknown>;
  externalCallId?: string;
  status: WebhookStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  nextRetryAt?: Date;
  createdAt: Date;
  processedAt?: Date;
}

// ============================================================================
// VOICEMAIL TYPES
// ============================================================================

export type VoicemailUrgency = 'low' | 'normal' | 'high' | 'urgent';

export interface Voicemail {
  id: string;
  callId: string;
  recordingId?: string;
  transcript?: string;
  callerName?: string;
  callbackNumber?: string;
  urgency: VoicemailUrgency;
  notifiedAt?: Date;
  listenedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface InitiateCallParams {
  toNumber: string;
  fromNumber?: string;
  agentId: string;
  metadata?: Record<string, unknown>;
}

export interface CallResult {
  callId: string;
  externalCallId: string;
  status: CallStatus;
}

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  voiceId: string;
  voiceProvider?: string;
  model?: string;
  temperature?: number;
  maxDurationSeconds?: number;
  enableRecording?: boolean;
  webhookUrl?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface CallStats {
  totalCalls: number;
  completedCalls: number;
  avgDurationSeconds: number;
  totalCost: number;
  inboundCalls: number;
  outboundCalls: number;
}

export interface RecentCall {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  fromNumber: string;
  toNumber: string;
  agentName?: string;
  durationMs?: number;
  createdAt: Date;
}
