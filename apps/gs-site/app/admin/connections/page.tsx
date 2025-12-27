'use client';

import { useState } from 'react';
import { useAllConnectionsHealth } from '@/hooks/useConnectionHealth';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { HealthCheckResult } from '@/lib/integrations/types';

type StatusFilter = 'all' | 'connected' | 'disconnected' | 'coming_soon' | 'not_configured';

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'disconnected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'coming_soon':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'not_configured':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'coming_soon':
      return 'Coming Soon';
    case 'not_configured':
      return 'Not Configured';
    case 'checking':
      return 'Checking...';
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'connected':
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    case 'disconnected':
      return 'bg-red-500/10 text-red-700 dark:text-red-400';
    case 'coming_soon':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    case 'not_configured':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function ConnectionRow({
  result,
  onTest,
  isTesting,
}: {
  result: HealthCheckResult;
  onTest: () => void;
  isTesting: boolean;
}) {
  const lastChecked = result.lastChecked
    ? new Date(result.lastChecked).toLocaleTimeString()
    : '—';

  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {getStatusIcon(result.status)}
        <div>
          <p className="font-medium">{result.service}</p>
          {result.errorMessage && (
            <p className="text-xs text-red-500">{result.errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(result.status)}`}>
          {getStatusLabel(result.status)}
        </span>

        <span className="text-xs text-muted-foreground w-20">
          {result.latencyMs ? `${result.latencyMs}ms` : '—'}
        </span>

        <span className="text-xs text-muted-foreground w-24">{lastChecked}</span>

        {result.status !== 'coming_soon' && (
          <button
            onClick={onTest}
            disabled={isTesting}
            className="px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              'Test'
            )}
          </button>
        )}

        {result.status === 'not_configured' && (
          <button className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Setup
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const { results, summary, isLoading, refetch } = useAllConnectionsHealth();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [testingService, setTestingService] = useState<string | null>(null);

  const handleTestAll = async () => {
    await refetch();
  };

  const handleTestService = async (service: string) => {
    setTestingService(service);
    await refetch();
    setTestingService(null);
  };

  const filteredResults = results.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const filterButtons: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: results.length },
    { value: 'connected', label: 'Connected', count: summary.connected.length },
    { value: 'disconnected', label: 'Disconnected', count: summary.disconnected.length },
    { value: 'coming_soon', label: 'Coming Soon', count: summary.comingSoon.length },
    { value: 'not_configured', label: 'Not Configured', count: summary.notConfigured.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">3rd Party Connections</h1>
          <p className="text-muted-foreground">
            Monitor and test connections to external services
          </p>
        </div>
        <button
          onClick={handleTestAll}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Test All
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/5">
          <p className="text-2xl font-bold text-green-600">{summary.connected.length}</p>
          <p className="text-sm text-muted-foreground">Connected</p>
        </div>
        <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/5">
          <p className="text-2xl font-bold text-red-600">{summary.disconnected.length}</p>
          <p className="text-sm text-muted-foreground">Disconnected</p>
        </div>
        <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/5">
          <p className="text-2xl font-bold text-yellow-600">{summary.comingSoon.length}</p>
          <p className="text-sm text-muted-foreground">Coming Soon</p>
        </div>
        <div className="p-4 rounded-lg border border-orange-500/50 bg-orange-500/5">
          <p className="text-2xl font-bold text-orange-600">{summary.notConfigured.length}</p>
          <p className="text-sm text-muted-foreground">Not Configured</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === btn.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {btn.label} ({btn.count})
          </button>
        ))}
      </div>

      {/* Connection List */}
      <div className="rounded-lg border border-border bg-card">
        {/* Header row */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 text-sm font-medium text-muted-foreground">
          <span className="flex-1">Service</span>
          <span className="w-28">Status</span>
          <span className="w-20">Latency</span>
          <span className="w-24">Last Check</span>
          <span className="w-20">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Checking connections...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No connections match the selected filter
          </div>
        ) : (
          filteredResults.map((result) => (
            <ConnectionRow
              key={result.service}
              result={result}
              onTest={() => handleTestService(result.service)}
              isTesting={testingService === result.service}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>Connected - Service is reachable</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-500" />
          <span>Disconnected - Service unreachable</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-yellow-500" />
          <span>Coming Soon - Integration planned</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-orange-500" />
          <span>Not Configured - Needs setup</span>
        </div>
      </div>
    </div>
  );
}
