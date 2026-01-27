'use client';

import { useState } from 'react';
import {
  Cpu,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  X,
  Sparkles,
  Database,
  Wrench,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  useClaudeCodeStats,
  calculateMaxPlanUsage,
  calculateOpusBudget,
  type ClaudeCodeStatsResponse,
} from '@/hooks/useClaudeCodeStats';
import {
  formatTokens,
  formatDuration,
  formatCost,
} from '@/lib/config/claude-code';
import type { Tile } from '@/lib/types/tiles';

interface ClaudeCodeUsageTileProps {
  tile: Tile;
}

/**
 * Claude Code MAX Plan Usage Tile
 *
 * Displays Claude Code usage insights for MAX plan subscribers.
 * Shows compact view on tile, full modal on click.
 */
export function ClaudeCodeUsageTile({ tile }: ClaudeCodeUsageTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useClaudeCodeStats();

  const today = data?.aggregates.today;
  const plan = data?.plan || '20x';

  // Calculate usage percentages (use NEW tokens only, not cached)
  const weeklyNewTokens = (data?.aggregates.this_week.input_tokens || 0) +
                          (data?.aggregates.this_week.output_tokens || 0) +
                          (data?.aggregates.this_week.cache_creation_tokens || 0);
  const planUsage = calculateMaxPlanUsage(weeklyNewTokens, plan);
  const opusBudget = calculateOpusBudget(
    data?.aggregates.this_week.opus_tokens || 0,
    plan
  );

  // Status color based on usage
  const getStatusColor = () => {
    if (planUsage.status === 'critical') return 'text-red-400';
    if (planUsage.status === 'high') return 'text-amber-400';
    if (planUsage.status === 'moderate') return 'text-blue-400';
    return 'text-emerald-400';
  };

  const getStatusBg = () => {
    if (planUsage.status === 'critical') return 'bg-red-500/20';
    if (planUsage.status === 'high') return 'bg-amber-500/20';
    if (planUsage.status === 'moderate') return 'bg-blue-500/20';
    return 'bg-emerald-500/20';
  };

  return (
    <>
      {/* Compact Tile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full h-28 bg-gradient-to-br from-violet-950/50 to-purple-950/30 border border-violet-500/20 rounded-lg p-4 text-left hover:border-violet-400/40 transition-all group"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/20 rounded-md">
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs font-medium text-violet-300/80">
              MAX {plan}
            </span>
          </div>
          {!isLoading && !error && (
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBg()} ${getStatusColor()}`}>
              {Math.round(planUsage.percentage * 100)}%
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-5 w-20 bg-violet-500/20 rounded mb-1" />
            <div className="h-3 w-16 bg-violet-500/10 rounded" />
          </div>
        ) : error ? (
          <div className="text-xs text-red-400/70">No data yet</div>
        ) : (
          <>
            <div className="text-lg font-semibold text-violet-100 mb-0.5">
              {formatCost(today?.estimated_cost_usd || 0)}
              <span className="text-xs font-normal text-violet-400/60 ml-1">today</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-violet-400/60">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {formatTokens((today?.input_tokens || 0) + (today?.output_tokens || 0))} new
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {formatTokens(today?.cache_read_tokens || 0)} cached
              </span>
            </div>
          </>
        )}
      </button>

      {/* Full Modal */}
      {isModalOpen && (
        <ClaudeCodeModal
          data={data}
          isLoading={isLoading}
          error={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Full-screen modal with detailed Claude Code stats
 */
function ClaudeCodeModal({
  data,
  isLoading,
  error,
  onClose,
}: {
  data: ClaudeCodeStatsResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');

  const plan = data?.plan || '20x';
  const limits = data?.limits;

  const periodData = {
    today: data?.aggregates.today,
    week: data?.aggregates.this_week,
    all: data?.aggregates.all_time,
  };

  const current = periodData[activeTab];

  // Calculate usage metrics (use NEW tokens only, not cached)
  const weeklyNewTokens = (data?.aggregates.this_week.input_tokens || 0) +
                          (data?.aggregates.this_week.output_tokens || 0) +
                          (data?.aggregates.this_week.cache_creation_tokens || 0);
  const planUsage = calculateMaxPlanUsage(weeklyNewTokens, plan);
  const opusBudget = calculateOpusBudget(
    data?.aggregates.this_week.opus_tokens || 0,
    plan
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-violet-500/30 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-violet-100">
                Claude Code Usage
              </h2>
              <p className="text-sm text-violet-400/60">
                MAX {plan} Plan Insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-violet-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-6 mt-4 bg-zinc-800/50 rounded-lg w-fit">
          {(['today', 'week', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-violet-500/30 text-violet-200'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <AlertTriangle className="w-12 h-12 mb-4 text-amber-500/50" />
              <p>No usage data available yet</p>
              <p className="text-sm text-zinc-500 mt-2">
                Stats will appear after your first Claude Code session
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={DollarSign}
                  label="API Equiv."
                  value={formatCost(current?.estimated_cost_usd || 0)}
                  subtext={`Saved ${formatCost(current?.cache_savings_usd || 0)}`}
                  color="emerald"
                />
                <MetricCard
                  icon={Zap}
                  label="New Tokens"
                  value={formatTokens((current?.input_tokens || 0) + (current?.output_tokens || 0))}
                  subtext={`${current?.session_count || 0} sessions`}
                  color="violet"
                />
                <MetricCard
                  icon={Clock}
                  label="Time Spent"
                  value={formatDuration(current?.total_duration_seconds || 0)}
                  subtext={`${current?.user_messages || 0} prompts`}
                  color="blue"
                />
                <MetricCard
                  icon={Wrench}
                  label="Tool Calls"
                  value={(current?.tool_calls || 0).toLocaleString()}
                  subtext={`${Math.round((current?.insights.tokensPerMessage || 0) / 1000)}K tokens/prompt`}
                  color="amber"
                />
              </div>

              {/* Usage Gauges */}
              {activeTab !== 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weekly Usage Gauge */}
                  <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-zinc-300">Weekly Usage</h3>
                      <span className={`text-xs font-medium ${
                        planUsage.status === 'critical' ? 'text-red-400' :
                        planUsage.status === 'high' ? 'text-amber-400' :
                        planUsage.status === 'moderate' ? 'text-blue-400' :
                        'text-emerald-400'
                      }`}>
                        {planUsage.message}
                      </span>
                    </div>
                    <div className="relative h-3 bg-zinc-700/50 rounded-full overflow-hidden mb-3">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          planUsage.status === 'critical' ? 'bg-red-500' :
                          planUsage.status === 'high' ? 'bg-amber-500' :
                          planUsage.status === 'moderate' ? 'bg-blue-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(planUsage.percentage * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{formatTokens(weeklyNewTokens)} new tokens</span>
                      <span>{Math.round(planUsage.percentage * 100)}% of est. limit</span>
                    </div>
                  </div>

                  {/* Opus Budget Gauge */}
                  <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-zinc-300">Opus 4.5 Budget</h3>
                      {opusBudget.approachingSwitch ? (
                        <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Approaching switch
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Opus available
                        </span>
                      )}
                    </div>
                    <div className="relative h-3 bg-zinc-700/50 rounded-full overflow-hidden mb-3">
                      {/* Switch threshold marker */}
                      <div
                        className="absolute top-0 w-0.5 h-full bg-amber-500/50 z-10"
                        style={{ left: `${opusBudget.switchThreshold * 100}%` }}
                      />
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          opusBudget.approachingSwitch ? 'bg-amber-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${Math.min(opusBudget.percentage * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{opusBudget.hoursUsed}h used</span>
                      <span>
                        Switch at {opusBudget.switchThreshold * 100}% ({limits?.weeklyOpusHours}h)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Distribution */}
              <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Model Distribution</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex h-4 rounded-full overflow-hidden bg-zinc-700/50">
                      <div
                        className="bg-violet-500 transition-all"
                        style={{ width: `${(current?.insights.opusPercentage || 0) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${(current?.insights.sonnetPercentage || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                      <span className="text-zinc-400">Opus</span>
                      <span className="text-zinc-200 font-medium">
                        {Math.round((current?.insights.opusPercentage || 0) * 100)}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-zinc-400">Sonnet</span>
                      <span className="text-zinc-200 font-medium">
                        {Math.round((current?.insights.sonnetPercentage || 0) * 100)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Breakdown */}
              <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-zinc-300">Token Breakdown</h3>
                  <span className={`text-xs font-medium ${
                    (current?.insights.cacheHitRate || 0) > 0.7 ? 'text-emerald-400' :
                    (current?.insights.cacheHitRate || 0) > 0.4 ? 'text-blue-400' :
                    'text-amber-400'
                  }`}>
                    {Math.round((current?.insights.cacheHitRate || 0) * 100)}% cache hit rate
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-violet-300">
                      {formatTokens(current?.input_tokens || 0)}
                    </div>
                    <div className="text-xs text-zinc-500">New Input</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-300">
                      {formatTokens(current?.output_tokens || 0)}
                    </div>
                    <div className="text-xs text-zinc-500">Output</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-300">
                      {formatTokens(current?.cache_read_tokens || 0)}
                    </div>
                    <div className="text-xs text-zinc-500">Cached (reused)</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-emerald-300">
                      {formatCost(current?.cache_savings_usd || 0)}
                    </div>
                    <div className="text-xs text-zinc-500">Cache Savings</div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              {data?.recentSessions && data.recentSessions.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <h3 className="text-sm font-medium text-zinc-300 mb-4">Recent Sessions</h3>
                  <div className="space-y-2">
                    {data.recentSessions.slice(0, 5).map((session) => (
                      <div
                        key={session.session_id}
                        className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            session.primary_model === 'opus' ? 'bg-violet-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <div className="text-sm text-zinc-300">{session.project}</div>
                            <div className="text-xs text-zinc-500">
                              {session.user_messages} prompts · {formatDuration(session.duration_seconds)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-zinc-300">
                            {formatCost(session.estimated_cost_usd)}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatTokens(session.input_tokens + session.output_tokens)} new
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-center text-xs text-zinc-500">
          {data?.lastUpdated ? (
            <span>Last updated: {new Date(data.lastUpdated).toLocaleString()}</span>
          ) : (
            <span>Run a Claude Code session to start tracking</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Metric card component
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
  color: 'violet' | 'emerald' | 'blue' | 'amber';
}) {
  const colorClasses = {
    violet: 'bg-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div className="text-xl font-semibold text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{subtext}</div>
    </div>
  );
}

export default ClaudeCodeUsageTile;
