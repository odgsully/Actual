'use client';

import { useAllConnectionsHealth } from '@/hooks/useConnectionHealth';
import { useTiles } from '@/hooks/useTiles';
import type { Tile } from '@/lib/types/tiles';
import {
  Plug,
  Grid3X3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}

function StatCard({ title, value, icon, href, status = 'neutral' }: StatCardProps) {
  const statusColors = {
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    error: 'border-red-500/50 bg-red-500/5',
    neutral: 'border-border bg-card',
  };

  const content = (
    <div
      className={`
        p-4 rounded-lg border ${statusColors[status]}
        ${href ? 'hover:border-primary/50 transition-colors cursor-pointer' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground">{icon}</span>
        {status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
        {status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {status === 'warning' && <Clock className="w-4 h-4 text-yellow-500" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function AdminOverviewPage() {
  const { summary, isLoading: healthLoading } = useAllConnectionsHealth();
  const { tiles, isLoading: tilesLoading } = useTiles();

  const isLoading = healthLoading || tilesLoading;

  // Calculate tile stats
  const totalTiles = tiles?.length ?? 0;
  const tilesWithWarnings = tiles?.filter((t: Tile) => t.actionWarning).length ?? 0;
  const configurableTiles = 9; // From docs/GO-PLAN.md

  // Tiles by status
  const tilesByStatus = {
    done: tiles?.filter((t: Tile) => t.status === 'Done').length ?? 0,
    inProgress: tiles?.filter((t: Tile) => t.status === 'In progress').length ?? 0,
    notStarted: tiles?.filter((t: Tile) => t.status === 'Not started').length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">
          Manage tile settings and monitor 3rd party connections
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Connected Services"
          value={isLoading ? '...' : summary.connected.length}
          icon={<Plug className="w-5 h-5" />}
          href="/admin/connections"
          status={summary.disconnected.length > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Disconnected"
          value={isLoading ? '...' : summary.disconnected.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          href="/admin/connections"
          status={summary.disconnected.length > 0 ? 'error' : 'neutral'}
        />
        <StatCard
          title="Total Tiles"
          value={isLoading ? '...' : totalTiles}
          icon={<Grid3X3 className="w-5 h-5" />}
          href="/admin/tiles"
        />
        <StatCard
          title="Configurable Tiles"
          value={configurableTiles}
          icon={<Settings className="w-5 h-5" />}
          href="/admin/tiles"
        />
      </div>

      {/* Connection Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connections */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Connection Status</h2>
            <Link
              href="/admin/connections"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Connected */}
              {summary.connected.slice(0, 3).map((result) => (
                <div
                  key={result.service}
                  className="flex items-center justify-between py-2 px-3 rounded bg-green-500/10"
                >
                  <span className="text-sm">{result.service}</span>
                  <span className="text-xs text-green-600">Connected</span>
                </div>
              ))}

              {/* Disconnected */}
              {summary.disconnected.map((result) => (
                <div
                  key={result.service}
                  className="flex items-center justify-between py-2 px-3 rounded bg-red-500/10"
                >
                  <span className="text-sm">{result.service}</span>
                  <span className="text-xs text-red-600">Disconnected</span>
                </div>
              ))}

              {/* Coming Soon (show first 2) */}
              {summary.comingSoon.slice(0, 2).map((result) => (
                <div
                  key={result.service}
                  className="flex items-center justify-between py-2 px-3 rounded bg-yellow-500/10"
                >
                  <span className="text-sm">{result.service}</span>
                  <span className="text-xs text-yellow-600">Coming Soon</span>
                </div>
              ))}

              {summary.comingSoon.length > 2 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{summary.comingSoon.length - 2} more coming soon
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tile Status Summary */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tile Implementation</h2>
            <Link
              href="/admin/tiles"
              className="text-sm text-primary hover:underline"
            >
              Configure
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Implementation Progress</span>
                  <span>
                    {tilesByStatus.done}/{totalTiles}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(tilesByStatus.done / totalTiles) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-green-500/10">
                  <p className="text-lg font-bold text-green-600">
                    {tilesByStatus.done}
                  </p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="p-2 rounded bg-blue-500/10">
                  <p className="text-lg font-bold text-blue-600">
                    {tilesByStatus.inProgress}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-lg font-bold">{tilesByStatus.notStarted}</p>
                  <p className="text-xs text-muted-foreground">Not Started</p>
                </div>
              </div>

              {/* Warning tiles */}
              {tilesWithWarnings > 0 && (
                <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">
                    {tilesWithWarnings} tiles have action warnings
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/connections"
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Test All Connections
          </Link>
          <Link
            href="/admin/tiles"
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Configure Tiles
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Developer Resources */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h2 className="font-semibold mb-4">Developer Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/ui-libraries/cult-ui"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">CultUI Component Library</p>
              <p className="text-xs text-muted-foreground">49 beautiful components</p>
            </div>
          </Link>
          <Link
            href="/ui-libraries/motion-primitives"
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Motion-Primitives Library</p>
              <p className="text-xs text-muted-foreground">34 animation components</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
