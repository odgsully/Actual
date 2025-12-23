'use client';

import { useState } from 'react';
import { useAllConnectionsHealth } from '@/hooks/useConnectionHealth';
import {
  Heart,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';

export default function SystemHealthPage() {
  const { results, summary, isLoading, refetch } = useAllConnectionsHealth();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  // Calculate health score (connected / total checkable)
  const checkableCount = summary.connected.length + summary.disconnected.length;
  const healthScore = checkableCount > 0
    ? Math.round((summary.connected.length / checkableCount) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor overall system health and service status
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Health Score Card */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              healthScore >= 80
                ? 'bg-green-500/10'
                : healthScore >= 50
                ? 'bg-yellow-500/10'
                : 'bg-red-500/10'
            }`}
          >
            <Heart
              className={`w-8 h-8 ${
                healthScore >= 80
                  ? 'text-green-500'
                  : healthScore >= 50
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            />
          </div>
          <div>
            <p className="text-4xl font-bold">{healthScore}%</p>
            <p className="text-muted-foreground">System Health Score</p>
          </div>
          <div className="ml-auto text-right text-sm text-muted-foreground">
            <p>
              {summary.connected.length} of {checkableCount} services connected
            </p>
            {lastRefresh && (
              <p>Last checked: {lastRefresh.toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Healthy</span>
          </div>
          <p className="text-2xl font-bold">{summary.connected.length}</p>
        </div>

        <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Issues</span>
          </div>
          <p className="text-2xl font-bold">{summary.disconnected.length}</p>
        </div>

        <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold">{summary.comingSoon.length}</p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{results.length}</p>
        </div>
      </div>

      {/* Services List */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Service Status</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Checking services...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((result) => (
              <div
                key={result.service}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      result.status === 'connected'
                        ? 'bg-green-500'
                        : result.status === 'disconnected'
                        ? 'bg-red-500'
                        : result.status === 'coming_soon'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-medium">{result.service}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {result.latencyMs && (
                    <span className="text-muted-foreground">
                      {result.latencyMs}ms
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      result.status === 'connected'
                        ? 'bg-green-500/10 text-green-600'
                        : result.status === 'disconnected'
                        ? 'bg-red-500/10 text-red-600'
                        : result.status === 'coming_soon'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {result.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h2 className="font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Environment</p>
            <p className="font-medium">{process.env.NODE_ENV || 'development'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Health Check Interval</p>
            <p className="font-medium">30 seconds</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cache TTL</p>
            <p className="font-medium">30 seconds</p>
          </div>
          <div>
            <p className="text-muted-foreground">Retry Strategy</p>
            <p className="font-medium">Exponential backoff (max 3)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
