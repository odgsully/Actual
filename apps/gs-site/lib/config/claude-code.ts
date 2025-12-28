/**
 * Claude Code MAX Plan Configuration
 *
 * Based on official Anthropic documentation:
 * - https://claude.com/pricing/max
 * - https://support.claude.com/en/articles/11014257-about-claude-s-max-plan-usage
 */

export type MaxPlanType = '5x' | '20x';

export interface PlanLimits {
  messagesPerWindow: number;
  windowHours: number;
  weeklyOpusHours: number;
  weeklySonnetHours: number;
  opusSwitchThreshold: number; // Percentage at which Opus switches to Sonnet
}

export interface TokenPricing {
  input: number; // per 1M tokens
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

/**
 * MAX plan limits based on Anthropic documentation
 *
 * MAX 5x: Switches Opus → Sonnet at 20% usage
 * MAX 20x: Switches Opus → Sonnet at 50% usage
 */
export const PLAN_LIMITS: Record<MaxPlanType, PlanLimits> = {
  '5x': {
    messagesPerWindow: 225,
    windowHours: 5,
    weeklyOpusHours: 10,
    weeklySonnetHours: 240,
    opusSwitchThreshold: 0.20,
  },
  '20x': {
    messagesPerWindow: 900,
    windowHours: 5,
    weeklyOpusHours: 40,
    weeklySonnetHours: 480,
    opusSwitchThreshold: 0.50,
  },
};

/**
 * Opus 4.5 token pricing (USD per 1M tokens)
 */
export const TOKEN_PRICING: TokenPricing = {
  input: 15.0,
  output: 75.0,
  cacheRead: 1.5,
  cacheCreation: 18.75,
};

/**
 * Current user's MAX plan configuration
 * Can be overridden via environment variable CLAUDE_MAX_PLAN
 */
export const CLAUDE_CODE_CONFIG = {
  maxPlan: (process.env.CLAUDE_MAX_PLAN as MaxPlanType) || '20x',
  pricing: TOKEN_PRICING,
  limits: PLAN_LIMITS,
};

/**
 * Get limits for a specific plan
 */
export function getPlanLimits(plan: MaxPlanType = CLAUDE_CODE_CONFIG.maxPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Calculate estimated cost from token counts
 */
export function calculateCost(tokens: {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}): number {
  return (
    (tokens.input * TOKEN_PRICING.input +
      tokens.output * TOKEN_PRICING.output +
      tokens.cacheRead * TOKEN_PRICING.cacheRead +
      tokens.cacheCreation * TOKEN_PRICING.cacheCreation) /
    1_000_000
  );
}

/**
 * Calculate cache savings (what you saved by using cache vs full input pricing)
 */
export function calculateCacheSavings(cacheReadTokens: number): number {
  const savingsPerToken = TOKEN_PRICING.input - TOKEN_PRICING.cacheRead;
  return (cacheReadTokens * savingsPerToken) / 1_000_000;
}

/**
 * Format token count for display (e.g., 1234567 -> "1.23M")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

/**
 * Format USD cost for display
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) {
    return '<$0.01';
  } else if (usd < 1) {
    return `$${usd.toFixed(2)}`;
  } else if (usd < 100) {
    return `$${usd.toFixed(2)}`;
  } else {
    return `$${usd.toFixed(0)}`;
  }
}
