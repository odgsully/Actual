'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Phone,
  Percent,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { Tile } from '@/lib/types/tiles';
import { useGSRealtyStats } from '@/hooks/useGSRealtyStats';
import { getDeepLinkUrl } from '@/lib/wabbit/client';

interface CRMStatsTileProps {
  tile: Tile;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const METRICS = [
  { key: 'totalContacts', label: 'Total Contacts', icon: Users, color: 'text-blue-400' },
  { key: 'contactsThisMonth', label: 'New This Month', icon: UserPlus, color: 'text-green-400' },
  { key: 'activeDeals', label: 'Active Deals', icon: TrendingUp, color: 'text-purple-400' },
  { key: 'pipelineRevenue', label: 'Pipeline Revenue', icon: DollarSign, color: 'text-yellow-400' },
  { key: 'callsThisMonth', label: 'Calls This Month', icon: Phone, color: 'text-orange-400' },
  { key: 'conversionRate', label: 'Conversion Rate', icon: Percent, color: 'text-cyan-400' },
] as const;

function formatMetricValue(key: string, value: number): string {
  if (key === 'pipelineRevenue') return formatCurrency(value);
  if (key === 'conversionRate') return `${value}%`;
  return value.toLocaleString();
}

function CRMStatsModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError } = useGSRealtyStats();
  const crmUrl = getDeepLinkUrl('gsrealty-admin') || '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">GS-CRM Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-300"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          )}

          {isError && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm mb-4">Unable to load CRM data</p>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-white/60">{label}</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {formatMetricValue(key, data[key as keyof typeof data])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex justify-end">
          <a
            href={crmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm rounded-xl transition-all duration-700 hover:scale-[1.02]"
          >
            Open GS-CRM
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function CRMStatsTile({ tile, className }: CRMStatsTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useGSRealtyStats({ enabled: true });

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          group relative w-full h-28
          rounded-lg border border-border
          bg-card hover:bg-accent
          hover:border-muted-foreground/30
          transition-all duration-150
          flex flex-col p-4 text-left
          cursor-pointer
          ${className || ''}
        `}
      >
        {/* Header row: Icon */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5" />
          </span>
        </div>

        {/* Content: Title + inline stats */}
        <div className="flex-1 flex flex-col justify-end">
          <h3 className="text-sm font-medium text-foreground leading-tight">
            GS-CRM
          </h3>
          {data ? (
            <p className="text-xs text-muted-foreground mt-1 tracking-wide truncate">
              {data.totalContacts} contacts · {data.activeDeals} deals · {formatCurrency(data.pipelineRevenue)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">
              View CRM metrics
            </p>
          )}
        </div>
      </button>

      {isModalOpen && <CRMStatsModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
