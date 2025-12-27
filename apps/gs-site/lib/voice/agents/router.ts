/**
 * Voice Agent Router
 *
 * Handles intent detection and agent routing for incoming calls.
 * Morgan (reception) detects intent and routes to the appropriate specialist.
 */

import {
  AGENT_DEFINITIONS,
  INTENT_DEFINITIONS,
  RETELL_AGENT_IDS,
  getAgentBySlug,
  type AgentDefinition,
} from './definitions';

// ============================================================================
// TYPES
// ============================================================================

export interface DetectedIntent {
  intent: string;
  confidence: number;
  matchedKeywords: string[];
  suggestedAgent: string;  // agent slug
}

export interface RoutingDecision {
  shouldTransfer: boolean;
  targetAgent: AgentDefinition | null;
  targetAgentRetellId: string | null;
  reason: string;
}

export interface TransferContext {
  callerName?: string;
  callerNumber: string;
  intent: string;
  summary: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  previousAgents: string[];  // slugs
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

/**
 * Detect caller intent from their utterance
 * Uses keyword matching as a fast first pass
 */
export function detectIntent(utterance: string): DetectedIntent {
  const normalizedText = utterance.toLowerCase();
  const results: Array<{
    intent: string;
    confidence: number;
    matchedKeywords: string[];
  }> = [];

  // Check each intent definition
  for (const [intentKey, intentDef] of Object.entries(INTENT_DEFINITIONS)) {
    const matchedKeywords: string[] = [];

    for (const keyword of intentDef.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // Confidence based on number of keyword matches
      const confidence = Math.min(0.9, 0.3 + matchedKeywords.length * 0.2);
      results.push({
        intent: intentKey,
        confidence,
        matchedKeywords,
      });
    }
  }

  // Sort by confidence and return best match
  results.sort((a, b) => b.confidence - a.confidence);

  if (results.length > 0) {
    const best = results[0];
    const intentDef = INTENT_DEFINITIONS[best.intent as keyof typeof INTENT_DEFINITIONS];
    return {
      ...best,
      suggestedAgent: intentDef?.primaryAgent || 'morgan',
    };
  }

  // Fallback to unknown
  return {
    intent: 'unknown',
    confidence: 0.1,
    matchedKeywords: [],
    suggestedAgent: 'morgan',
  };
}

/**
 * Detect intent using LLM for more complex cases
 * Call this when keyword matching confidence is low
 */
export function getIntentDetectionPrompt(utterance: string): string {
  const intentList = Object.entries(INTENT_DEFINITIONS)
    .map(([key, def]) => `- ${key}: ${def.description}`)
    .join('\n');

  return `Analyze this caller's statement and determine their primary intent.

Caller said: "${utterance}"

Available intents:
${intentList}

Respond with JSON only:
{
  "intent": "<intent_key>",
  "confidence": <0.0-1.0>,
  "reason": "<brief explanation>"
}`;
}

// ============================================================================
// ROUTING LOGIC
// ============================================================================

/**
 * Determine if a call should be transferred based on detected intent
 */
export function shouldTransferCall(
  currentAgentSlug: string,
  detectedIntent: DetectedIntent,
  callDurationMs: number
): RoutingDecision {
  const currentAgent = getAgentBySlug(currentAgentSlug);
  if (!currentAgent) {
    return {
      shouldTransfer: false,
      targetAgent: null,
      targetAgentRetellId: null,
      reason: 'Current agent not found',
    };
  }

  // If current agent handles this intent, don't transfer
  if (currentAgent.handlesIntents.includes(detectedIntent.intent)) {
    return {
      shouldTransfer: false,
      targetAgent: null,
      targetAgentRetellId: null,
      reason: `${currentAgent.name} handles ${detectedIntent.intent}`,
    };
  }

  // Find the best agent for this intent
  const targetAgentSlug = detectedIntent.suggestedAgent;

  // Check if current agent can transfer to target
  if (!currentAgent.canTransferTo.includes(targetAgentSlug)) {
    return {
      shouldTransfer: false,
      targetAgent: null,
      targetAgentRetellId: null,
      reason: `${currentAgent.name} cannot transfer to ${targetAgentSlug}`,
    };
  }

  const targetAgent = getAgentBySlug(targetAgentSlug);
  if (!targetAgent) {
    return {
      shouldTransfer: false,
      targetAgent: null,
      targetAgentRetellId: null,
      reason: 'Target agent not found',
    };
  }

  const targetRetellId = RETELL_AGENT_IDS[targetAgentSlug];

  return {
    shouldTransfer: true,
    targetAgent,
    targetAgentRetellId: targetRetellId || null,
    reason: `Transferring to ${targetAgent.name} for ${detectedIntent.intent}`,
  };
}

/**
 * Build transfer context for handoff
 */
export function buildTransferContext(
  callerNumber: string,
  detectedIntent: DetectedIntent,
  conversationSummary: string,
  callerName?: string,
  previousAgents: string[] = []
): TransferContext {
  // Determine urgency based on intent
  let urgency: TransferContext['urgency'] = 'normal';
  if (detectedIntent.intent.includes('urgent') || detectedIntent.confidence > 0.9) {
    urgency = 'high';
  }

  return {
    callerName,
    callerNumber,
    intent: detectedIntent.intent,
    summary: conversationSummary,
    urgency,
    previousAgents,
  };
}

/**
 * Generate whisper message for warm transfer
 */
export function generateWhisperMessage(context: TransferContext): string {
  const parts: string[] = [];

  if (context.callerName) {
    parts.push(`Caller: ${context.callerName}`);
  } else {
    parts.push(`Caller: ${context.callerNumber}`);
  }

  parts.push(`Intent: ${context.intent.replace(/_/g, ' ')}`);

  if (context.summary && context.summary.length < 100) {
    parts.push(`Summary: ${context.summary}`);
  }

  if (context.urgency === 'high' || context.urgency === 'urgent') {
    parts.push(`Priority: ${context.urgency.toUpperCase()}`);
  }

  return parts.join('. ');
}

// ============================================================================
// AGENT SELECTION
// ============================================================================

/**
 * Get the ordered list of agents to try for an intent
 */
export function getAgentPriorityList(intent: string): AgentDefinition[] {
  const intentDef = INTENT_DEFINITIONS[intent as keyof typeof INTENT_DEFINITIONS];
  const agents: AgentDefinition[] = [];

  if (intentDef?.primaryAgent) {
    const primary = getAgentBySlug(intentDef.primaryAgent);
    if (primary) agents.push(primary);
  }

  // Add Morgan as fallback if not already primary
  if (intentDef?.primaryAgent !== 'morgan') {
    const morgan = getAgentBySlug('morgan');
    if (morgan) agents.push(morgan);
  }

  return agents;
}

/**
 * Check if an agent is available (has Retell ID configured)
 */
export function isAgentAvailable(agentSlug: string): boolean {
  const retellId = RETELL_AGENT_IDS[agentSlug];
  return Boolean(retellId && retellId.length > 0);
}

/**
 * Get all configured agents
 */
export function getConfiguredAgents(): Array<{
  agent: AgentDefinition;
  retellId: string;
}> {
  return AGENT_DEFINITIONS
    .filter(agent => isAgentAvailable(agent.slug))
    .map(agent => ({
      agent,
      retellId: RETELL_AGENT_IDS[agent.slug],
    }));
}

// ============================================================================
// TRANSFER EXECUTION
// ============================================================================

export interface TransferRequest {
  callId: string;
  fromAgentSlug: string;
  toAgentSlug: string;
  context: TransferContext;
}

/**
 * Validate a transfer request
 */
export function validateTransferRequest(request: TransferRequest): {
  valid: boolean;
  error?: string;
} {
  const fromAgent = getAgentBySlug(request.fromAgentSlug);
  const toAgent = getAgentBySlug(request.toAgentSlug);

  if (!fromAgent) {
    return { valid: false, error: `Source agent ${request.fromAgentSlug} not found` };
  }

  if (!toAgent) {
    return { valid: false, error: `Target agent ${request.toAgentSlug} not found` };
  }

  if (!fromAgent.canTransferTo.includes(request.toAgentSlug)) {
    return {
      valid: false,
      error: `${fromAgent.name} cannot transfer to ${toAgent.name}`,
    };
  }

  if (!isAgentAvailable(request.toAgentSlug)) {
    return {
      valid: false,
      error: `${toAgent.name} is not configured in Retell`,
    };
  }

  return { valid: true };
}
