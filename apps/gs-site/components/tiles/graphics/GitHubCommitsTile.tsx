'use client';

import { GitCommit, AlertCircle, RefreshCw, Calendar, User, Bot } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useOdgsullyAnnualCommits } from '@/hooks/useGitHubData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface GitHubCommitsTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Format month string (YYYY-MM) to abbreviated month (Jan, Feb, etc.)
 */
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Short username display for legend
 */
function getShortUsername(username: string): string {
  if (username === 'odgsully') return 'Me';
  if (username === 'odgsully-agents') return 'Agents';
  return username;
}

/**
 * GitHubCommitsTile - Annual commits stacked bar chart
 *
 * Shows monthly commit counts for odgsully + odgsully-agents accounts
 * with a stacked bar visualization.
 *
 * Features:
 * - Stacked bar chart with per-user breakdown
 * - odgsully (green) as base, odgsully-agents (purple) stacked on top
 * - YTD total prominently displayed
 * - Mini legend showing both accounts
 * - Last commit date indicator
 * - Cache: 1 hour (expensive query)
 *
 * Data comes from GitHub API via useOdgsullyAnnualCommits hook.
 */
export function GitHubCommitsTile({ tile, className }: GitHubCommitsTileProps) {
  const currentYear = new Date().getFullYear();
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useOdgsullyAnnualCommits(currentYear);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[10rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  // Transform data for stacked chart
  // Merge all users' monthly data into single chart data points
  const chartData = (() => {
    if (!stats?.byUser || stats.byUser.length === 0) return [];

    // Get all unique months across all users
    const allMonths = new Set<string>();
    stats.byUser.forEach((user) => {
      user.monthlyBreakdown.forEach((m) => allMonths.add(m.month));
    });

    // Sort months and create data points
    return Array.from(allMonths)
      .sort()
      .map((month) => {
        const dataPoint: Record<string, string | number> = {
          month: formatMonth(month),
          fullMonth: month,
        };

        // Add each user's commits for this month
        stats.byUser.forEach((user) => {
          const monthData = user.monthlyBreakdown.find((m) => m.month === month);
          dataPoint[user.username] = monthData?.commits ?? 0;
        });

        return dataPoint;
      });
  })();

  // Get per-user totals for the legend
  const userTotals = stats?.byUser?.map((user) => ({
    username: user.username,
    shortName: getShortUsername(user.username),
    total: user.totalCommits,
  })) ?? [];

  // Color mapping for users
  const userColors: Record<string, string> = {
    odgsully: 'hsl(142, 76%, 36%)', // Green
    'odgsully-agents': 'hsl(262, 83%, 58%)', // Purple
  };

  return (
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-foreground">
              {currentYear} Commits
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="space-y-2 animate-pulse w-full">
                <div className="h-4 w-16 bg-muted rounded mx-auto" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
              <p className="text-xs text-muted-foreground mb-2">Data unavailable</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success state */}
          {!isLoading && !error && stats && (
            <>
              {/* Total commits with per-user breakdown */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-foreground">
                  {stats.totalCommits.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  commits YTD
                </span>
              </div>

              {/* Mini legend showing per-user totals */}
              {userTotals.length > 1 && (
                <div className="flex items-center gap-3 mb-2 text-[10px]">
                  {userTotals.map((user) => (
                    <div key={user.username} className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: userColors[user.username] || 'hsl(var(--primary))' }}
                      />
                      <span className="text-muted-foreground">
                        {user.shortName}: {user.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stacked bar chart */}
              {chartData.length > 0 && (
                <div className="flex-1 min-h-[3rem]">
                  <ResponsiveContainer width="100%" height={52}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 8 }}
                        axisLine={false}
                        tickLine={false}
                        interval={1}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '10px',
                          padding: '6px 8px',
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          getShortUsername(name),
                        ]}
                        labelFormatter={(label) => label}
                      />
                      {/* Render bars for each user - stacked */}
                      {stats.byUser.map((user, index) => (
                        <Bar
                          key={user.username}
                          dataKey={user.username}
                          stackId="commits"
                          fill={userColors[user.username] || `hsl(${index * 60}, 70%, 50%)`}
                          radius={index === stats.byUser.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Last commit indicator */}
              {stats.lastCommitDate && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Last: {new Date(stats.lastCommitDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </>
          )}

          {/* No data state */}
          {!isLoading && !error && !stats && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <GitCommit className="w-6 h-6 text-muted-foreground/40 mb-1" />
              <p className="text-xs text-muted-foreground">No commit data</p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}

        {/* 3rd Party indicator */}
        <div className="absolute bottom-2 right-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
            title="Data from: GitHub"
          />
        </div>
      </div>
    </WarningBorderTrail>
  );
}

export default GitHubCommitsTile;
