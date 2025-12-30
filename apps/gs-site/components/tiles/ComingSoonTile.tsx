'use client';

import { Clock, Sparkles, Zap } from 'lucide-react';
import type { Tile, ThirdPartyIntegration } from '@/lib/types/tiles';

interface ComingSoonTileProps {
  tile: Tile;
}

/**
 * Service-specific icons and colors
 */
const SERVICE_CONFIG: Record<
  ThirdPartyIntegration,
  {
    icon: typeof Clock;
    gradient: string;
    description: string;
  }
> = {
  Whoop: {
    icon: Zap,
    gradient: 'from-green-500/20 to-emerald-500/20',
    description: 'Health & recovery tracking',
  },
  Apple: {
    icon: Sparkles,
    gradient: 'from-gray-400/20 to-gray-600/20',
    description: 'iCloud & Contacts integration',
  },
  'Brother Printer': {
    icon: Clock,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    description: 'Physical printing automation',
  },
  'YouTube 3rd P': {
    icon: Clock,
    gradient: 'from-red-500/20 to-pink-500/20',
    description: 'Video tracking & analysis',
  },
  'Scheduler 3rd P': {
    icon: Clock,
    gradient: 'from-purple-500/20 to-violet-500/20',
    description: 'Social media scheduling',
  },
  Datadog: {
    icon: Clock,
    gradient: 'from-orange-500/20 to-amber-500/20',
    description: 'Performance monitoring',
  },
  // Default for services that might not have specific config
  Notion: {
    icon: Clock,
    gradient: 'from-gray-500/20 to-slate-500/20',
    description: 'Coming soon',
  },
  GitHub: {
    icon: Clock,
    gradient: 'from-gray-500/20 to-slate-500/20',
    description: 'Coming soon',
  },
  Google: {
    icon: Clock,
    gradient: 'from-blue-500/20 to-red-500/20',
    description: 'Google services integration',
  },
  Twilio: {
    icon: Clock,
    gradient: 'from-red-500/20 to-rose-500/20',
    description: 'SMS notifications',
  },
  Wabbit: {
    icon: Clock,
    gradient: 'from-indigo-500/20 to-purple-500/20',
    description: 'Cross-app integration',
  },
  'GS Site Realty': {
    icon: Clock,
    gradient: 'from-teal-500/20 to-cyan-500/20',
    description: 'Real estate CRM',
  },
  Logic: {
    icon: Clock,
    gradient: 'from-gray-500/20 to-slate-500/20',
    description: 'Coming soon',
  },
  'EXTRA LOGIC': {
    icon: Clock,
    gradient: 'from-gray-500/20 to-slate-500/20',
    description: 'Coming soon',
  },
  InBody: {
    icon: Zap,
    gradient: 'from-teal-500/20 to-cyan-500/20',
    description: 'Body composition tracking',
  },
};

/**
 * ComingSoonTile - Displays a placeholder for integrations not yet implemented
 *
 * Used for tiles that require 3rd party services that are still in development:
 * - Whoop API (health tracking)
 * - Apple (contacts, iCloud)
 * - Brother Printer (physical printing)
 * - YouTube 3rd P (video analysis)
 * - Scheduler 3rd P (social scheduling)
 * - Datadog (monitoring)
 */
export function ComingSoonTile({ tile }: ComingSoonTileProps) {
  // thirdParty is an array, get the first one or default to Notion
  const service = tile.thirdParty?.[0] || 'Notion';
  const config = SERVICE_CONFIG[service] || SERVICE_CONFIG.Notion;
  const Icon = config.icon;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-border/50
        bg-gradient-to-br ${config.gradient}
        p-4 h-full min-h-[120px]
        flex flex-col justify-between
        transition-all duration-300
        hover:border-border hover:shadow-md
      `}
    >
      {/* Coming Soon Badge */}
      <div className="absolute top-2 right-2">
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted/80 text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium line-clamp-2 mb-1">{tile.name}</h3>

        {/* Service Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {tile.desc || config.description}
        </p>
      </div>

      {/* Service Badge */}
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-1.5 py-0.5 rounded bg-background/50 font-mono text-[10px]">
            {service}
          </span>
          <span className="opacity-60">integration</span>
        </div>
      </div>

      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    </div>
  );
}

export default ComingSoonTile;
