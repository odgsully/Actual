import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  CLAUDE_CODE_CONFIG,
  getPlanLimits,
  type MaxPlanType,
} from '@/lib/config/claude-code';

/**
 * Session stats structure from stats_collector.py
 */
interface SessionStats {
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
 * Aggregates structure
 */
interface PeriodAggregates {
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

interface AggregatesFile {
  today: PeriodAggregates;
  this_week: PeriodAggregates;
  all_time: PeriodAggregates;
  last_updated: string;
  max_plan: MaxPlanType;
}

/**
 * Response structure for the API
 */
interface StatsResponse {
  success: boolean;
  plan: MaxPlanType;
  limits: ReturnType<typeof getPlanLimits>;
  aggregates: {
    today: PeriodAggregates & { insights: PeriodInsights };
    this_week: PeriodAggregates & { insights: PeriodInsights };
    all_time: PeriodAggregates & { insights: PeriodInsights };
  };
  recentSessions: SessionStats[];
  lastUpdated: string | null;
}

interface PeriodInsights {
  cacheHitRate: number;
  avgSessionDuration: number;
  opusPercentage: number;
  sonnetPercentage: number;
  tokensPerMessage: number;
  costPerSession: number;
}

/**
 * Calculate insights for a period
 */
function calculateInsights(agg: PeriodAggregates): PeriodInsights {
  const totalModelTokens = agg.opus_tokens + agg.sonnet_tokens;
  const totalInputContext = agg.input_tokens + agg.cache_read_tokens;

  return {
    cacheHitRate: totalInputContext > 0 ? agg.cache_read_tokens / totalInputContext : 0,
    avgSessionDuration:
      agg.session_count > 0 ? Math.round(agg.total_duration_seconds / agg.session_count) : 0,
    opusPercentage: totalModelTokens > 0 ? agg.opus_tokens / totalModelTokens : 0,
    sonnetPercentage: totalModelTokens > 0 ? agg.sonnet_tokens / totalModelTokens : 0,
    tokensPerMessage: agg.user_messages > 0 ? Math.round(agg.total_tokens / agg.user_messages) : 0,
    costPerSession:
      agg.session_count > 0 ? Math.round((agg.estimated_cost_usd / agg.session_count) * 100) / 100 : 0,
  };
}

/**
 * Create empty aggregates for when no data exists
 */
function createEmptyAggregates(): PeriodAggregates {
  return {
    date: new Date().toISOString().split('T')[0],
    session_count: 0,
    total_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    opus_tokens: 0,
    sonnet_tokens: 0,
    user_messages: 0,
    tool_calls: 0,
    total_duration_seconds: 0,
    estimated_cost_usd: 0,
    cache_savings_usd: 0,
  };
}

/**
 * GET /api/claude-code/stats
 *
 * Returns Claude Code usage statistics for the MAX plan dashboard tile.
 *
 * Query params:
 * - sessions: number of recent sessions to include (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionsLimit = parseInt(searchParams.get('sessions') || '5', 10);

    // Data directory (relative to project root)
    const dataDir = path.join(process.cwd(), 'data', 'claude-stats');

    // Read aggregates file
    let aggregates: AggregatesFile | null = null;
    const aggregatesPath = path.join(dataDir, 'aggregates.json');

    try {
      const aggregatesContent = await fs.readFile(aggregatesPath, 'utf-8');
      aggregates = JSON.parse(aggregatesContent);
    } catch {
      // No aggregates yet - return empty state
    }

    // Read today's sessions for recent activity
    const today = new Date().toISOString().split('T')[0];
    const todaySessionsPath = path.join(dataDir, `sessions-${today}.json`);
    let recentSessions: SessionStats[] = [];

    try {
      const sessionsContent = await fs.readFile(todaySessionsPath, 'utf-8');
      const allSessions: SessionStats[] = JSON.parse(sessionsContent);
      // Get most recent sessions
      recentSessions = allSessions.slice(-sessionsLimit).reverse();
    } catch {
      // No sessions today yet
    }

    // Build response
    const plan = aggregates?.max_plan || CLAUDE_CODE_CONFIG.maxPlan;
    const limits = getPlanLimits(plan);

    const emptyAgg = createEmptyAggregates();
    const todayAgg = aggregates?.today || emptyAgg;
    const weekAgg = aggregates?.this_week || emptyAgg;
    const allTimeAgg = aggregates?.all_time || emptyAgg;

    const response: StatsResponse = {
      success: true,
      plan,
      limits,
      aggregates: {
        today: {
          ...todayAgg,
          insights: calculateInsights(todayAgg),
        },
        this_week: {
          ...weekAgg,
          insights: calculateInsights(weekAgg),
        },
        all_time: {
          ...allTimeAgg,
          insights: calculateInsights(allTimeAgg),
        },
      },
      recentSessions,
      lastUpdated: aggregates?.last_updated || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Claude Code stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load Claude Code stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
