'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Home,
  Users,
  ListTodo,
  PlusCircle,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { Tile } from '@/lib/types/tiles';
import { useWabbitAppHealth } from '@/hooks/useWabbitStats';
import {
  WabbitAppKey,
  WABBIT_APPS,
  DEEP_LINKS,
  getAppUrl,
  getDeepLinkUrl,
} from '@/lib/wabbit/client';

interface WabbitLinkTileProps {
  tile: Tile;
}

/**
 * Map tile names to their deep link keys
 */
const TILE_DEEP_LINK_MAP: Record<string, string> = {
  'Jump to Wab: Task List Value': 'wabbit-tasks',
  'GS-clients Admin Dash page': 'gsrealty-admin',
  'New GS Wab': 'wabbit-new',
  'Go to my Wabbit': 'wabbit-re-home',
  'Wab: Task Tile': 'wabbit-tasks',
  CRM: 'gsrealty-clients',
};

/**
 * Map tile names to target apps for health checks
 */
const TILE_APP_MAP: Record<string, WabbitAppKey> = {
  'Jump to Wab: Task List Value': 'wabbit',
  'GS-clients Admin Dash page': 'gsrealty',
  'New GS Wab': 'wabbit',
  'Go to my Wabbit': 'wabbit-re',
  'Wab: Task Tile': 'wabbit',
  CRM: 'gsrealty',
};

/**
 * Icons for different app types
 */
const APP_ICONS: Record<WabbitAppKey, typeof Home> = {
  'wabbit-re': Home,
  gsrealty: Users,
  wabbit: ListTodo,
};

/**
 * Get icon based on tile type/name
 */
function getTileIcon(tileName: string, app: WabbitAppKey) {
  if (tileName.toLowerCase().includes('new')) return PlusCircle;
  if (tileName.toLowerCase().includes('admin')) return LayoutDashboard;
  if (tileName.toLowerCase().includes('task')) return ListTodo;
  if (tileName.toLowerCase().includes('crm') || tileName.toLowerCase().includes('client'))
    return Users;
  return APP_ICONS[app] || ExternalLink;
}

/**
 * WabbitLinkTile - Cross-app navigation tile with health status
 *
 * Displays links to other Wabbit apps with real-time health checking:
 * - Shows connection status indicator
 * - Opens link in new tab
 * - Gracefully handles disconnected apps
 */
export function WabbitLinkTile({ tile }: WabbitLinkTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine target app and link
  const deepLinkKey = TILE_DEEP_LINK_MAP[tile.name];
  const targetApp = TILE_APP_MAP[tile.name] || 'wabbit';
  const deepLink = deepLinkKey ? DEEP_LINKS[deepLinkKey] : null;

  // Get URL - from deep link config or default to app root
  const url = deepLink ? getDeepLinkUrl(deepLinkKey) : getAppUrl(targetApp);

  // Health check for the target app
  const { data: health, isLoading: healthLoading } = useWabbitAppHealth(targetApp);

  const isConnected = health?.healthy ?? false;
  const Icon = getTileIcon(tile.name, targetApp);
  const appConfig = WABBIT_APPS[targetApp];

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full h-full min-h-[120px]
        rounded-xl border transition-all duration-300
        flex flex-col p-4
        ${
          isConnected
            ? 'border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
            : 'border-border/50 hover:border-yellow-500/50'
        }
        ${isHovered ? 'scale-[1.02]' : ''}
        bg-card
        text-left
      `}
    >
      {/* Connection Status Indicator */}
      <div className="absolute top-3 right-3">
        {healthLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : isConnected ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
      </div>

      {/* Icon */}
      <div
        className={`
        w-10 h-10 rounded-lg flex items-center justify-center mb-3
        ${isConnected ? 'bg-primary/10 text-primary' : 'bg-yellow-500/10 text-yellow-600'}
      `}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium line-clamp-2 mb-1">{tile.name}</h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
        {tile.desc || deepLink?.description || `Open in ${appConfig.name}`}
      </p>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{appConfig.name}</span>
        <ExternalLink className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Disconnected Warning */}
      {!isConnected && !healthLoading && (
        <div className="absolute inset-x-0 bottom-0 px-4 py-2 bg-yellow-500/10 rounded-b-xl">
          <p className="text-[10px] text-yellow-600 text-center">
            App may be offline - click to try anyway
          </p>
        </div>
      )}
    </button>
  );
}

export default WabbitLinkTile;
