'use client';

import { useQuery } from '@tanstack/react-query';
import type { MaxPlanType, PlanLimits } from '@/lib/config/claude-code';

/**
 * Session stats from the Claude Code stats collector
 */
export interface ClaudeCodeSession {
  session_id: string;
  project: string;
  project_path: string;
  recorded_at: string;
  max_plan: MaxPlanType;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  total_tokens: number;
  opus_input_tokens: number;
  opus_output_tokens: number;
  sonnet_input_tokens: number;
  sonnet_output_tokens: number;
  user_messages: number;
  assistant_messages: number;
  tool_calls: number;
  tool_breakdown: Record<string, number>;
  models_used: string[];
  primary_model: string | null;
  duration_seconds: number;
  cache_hit_rate: number;
  estimated_cost_usd: number;
  cache_savings_usd: number;
}

/**
 * Period aggregates (today, this_week, all_time)
 */
export interface PeriodAggregates {
  date: string;
  session_count: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  opus_tokens: number;
  sonnet_tokens: number;
  user_messages: number;
  tool_calls: number;
  total_duration_seconds: number;
  estimated_cost_usd: number;
  cache_savings_usd: number;
}

/**
 * Calculated insights for a period
 */
export interface PeriodInsights {
  cacheHitRate: number;
  avgSessionDuration: number;
  opusPercentage: number;
  sonnetPercentage: number;
  tokensPerMessage: number;
  costPerSession: number;
}

/**
 * Full stats response from the API
 */
export interface ClaudeCodeStatsResponse {
  success: boolean;
  plan: MaxPlanType;
  limits: PlanLimits;
  aggregates: {
    today: PeriodAggregates & { insights: PeriodInsights };
    this_week: PeriodAggregates & { insights: PeriodInsights };
    all_time: PeriodAggregates & { insights: PeriodInsights };
  };
  recentSessions: ClaudeCodeSession[];
  lastUpdated: string | null;
}

/**
 * Fetch Claude Code stats from API
 */
async function fetchClaudeCodeStats(sessionsLimit = 5): Promise<ClaudeCodeStatsResponse> {
  const response = await fetch(`/api/claude-code/stats?sessions=${sessionsLimit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || 'Failed to fetch Claude Code stats');
  }

  return response.json();
}

/**
 * Hook to fetch Claude Code usage statistics
 *
 * Returns:
 * - Plan type and limits
 * - Aggregates for today, this week, all time
 * - Recent session details
 * - Calculated insights (cache efficiency, model usage, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useClaudeCodeStats();
 *
 * if (data) {
 *   console.log(`Today: ${data.aggregates.today.total_tokens} tokens`);
 *   console.log(`Cache efficiency: ${data.aggregates.today.insights.cacheHitRate * 100}%`);
 *   console.log(`Opus usage: ${data.aggregates.today.insights.opusPercentage * 100}%`);
 * }
 * ```
 */
export function useClaudeCodeStats(sessionsLimit = 5) {
  return useQuery({
    queryKey: ['claude-code', 'stats', sessionsLimit],
    queryFn: () => fetchClaudeCodeStats(sessionsLimit),
    staleTime: 2 * 60 * 1000, // 2 minutes (stats update on session end)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Hook specifically for today's stats (common use case)
 */
export function useTodayClaudeCodeStats() {
  const query = useClaudeCodeStats(3);

  return {
    ...query,
    today: query.data?.aggregates.today,
    insights: query.data?.aggregates.today.insights,
    plan: query.data?.plan,
    limits: query.data?.limits,
  };
}

/**
 * Hook for weekly stats (for trend visualization)
 */
export function useWeeklyClaudeCodeStats() {
  const query = useClaudeCodeStats(10);

  return {
    ...query,
    week: query.data?.aggregates.this_week,
    insights: query.data?.aggregates.this_week.insights,
    sessions: query.data?.recentSessions,
  };
}

/**
 * Calculate MAX plan usage percentage
 *
 * This is an estimate based on weekly token usage vs estimated limits.
 * Actual limits vary based on many factors.
 */
export function calculateMaxPlanUsage(
  weeklyTokens: number,
  plan: MaxPlanType
): {
  percentage: number;
  status: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
} {
  // Rough estimates for weekly token limits (these vary significantly)
  const estimatedWeeklyLimits: Record<MaxPlanType, number> = {
    '5x': 50_000_000, // ~50M tokens/week
    '20x': 200_000_000, // ~200M tokens/week
  };

  const limit = estimatedWeeklyLimits[plan];
  const percentage = Math.min(weeklyTokens / limit, 1);

  let status: 'low' | 'moderate' | 'high' | 'critical';
  let message: string;

  if (percentage < 0.25) {
    status = 'low';
    message = 'Plenty of capacity remaining';
  } else if (percentage < 0.50) {
    status = 'moderate';
    message = 'On track for the week';
  } else if (percentage < 0.75) {
    status = 'high';
    message = 'Consider pacing usage';
  } else {
    status = 'critical';
    message = 'Approaching weekly limit';
  }

  return { percentage, status, message };
}

/**
 * Calculate Opus budget usage
 *
 * MAX 5x switches Opus → Sonnet at 20% usage
 * MAX 20x switches Opus → Sonnet at 50% usage
 */
export function calculateOpusBudget(
  opusTokens: number,
  plan: MaxPlanType
): {
  percentage: number;
  hoursUsed: number;
  hoursRemaining: number;
  switchThreshold: number;
  approachingSwitch: boolean;
} {
  // Rough estimate: ~100K tokens per hour of Opus usage
  const TOKENS_PER_HOUR = 100_000;

  const weeklyOpusHours: Record<MaxPlanType, number> = {
    '5x': 10,
    '20x': 40,
  };

  const switchThresholds: Record<MaxPlanType, number> = {
    '5x': 0.20,
    '20x': 0.50,
  };

  const totalHours = weeklyOpusHours[plan];
  const hoursUsed = opusTokens / TOKENS_PER_HOUR;
  const percentage = Math.min(hoursUsed / totalHours, 1);
  const hoursRemaining = Math.max(0, totalHours - hoursUsed);
  const switchThreshold = switchThresholds[plan];
  const approachingSwitch = percentage >= switchThreshold * 0.8;

  return {
    percentage,
    hoursUsed: Math.round(hoursUsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    switchThreshold,
    approachingSwitch,
  };
}
