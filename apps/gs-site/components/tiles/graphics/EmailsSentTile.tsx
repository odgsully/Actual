'use client';

import { Mail, AlertCircle, RefreshCw, Link2, TrendingUp } from 'lucide-react';
import { useGmailStats, useConnectGmail } from '@/hooks/useGmailStats';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface EmailsSentTileProps {
  tile: Tile;
  className?: string;
}

/**
 * EmailsSentTile - Displays Gmail sent email statistics
 *
 * Shows:
 * - Emails sent today
 * - Emails sent this week
 * - Gmail connection status
 * - Connect button if not linked
 *
 * Data comes from Gmail API via useGmailStats hook.
 * Requires OAuth connection to user's Gmail account.
 */
export function EmailsSentTile({ tile, className }: EmailsSentTileProps) {
  const {
    data: gmailData,
    isLoading,
    error,
    refetch,
  } = useGmailStats();

  const { connect } = useConnectGmail();

  const isConnected = gmailData?.connected ?? false;
  const stats = gmailData?.stats;

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[7rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${!isConnected ? 'cursor-pointer' : ''}
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const handleClick = () => {
    if (!isConnected) {
      connect('/admin/connections');
    }
  };

  return (
    <WarningBorderTrail
      active={tile.actionWarning || !isConnected}
      hoverMessage={!isConnected ? 'Click to connect Gmail' : tile.actionDesc}
    >
      <div
        className={baseClasses}
        onClick={handleClick}
        role={!isConnected ? 'button' : undefined}
        tabIndex={!isConnected ? 0 : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Mail className={`w-4 h-4 ${isConnected ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-foreground truncate">
              Emails Sent
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
          {isConnected && gmailData?.email && (
            <span className="text-[9px] text-muted-foreground truncate max-w-[80px]" title={gmailData.email}>
              {gmailData.email.split('@')[0]}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-2 w-24 bg-muted rounded" />
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Connection error</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refetch();
                }}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && !isConnected && (
            <div className="text-center">
              <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Gmail not connected</p>
              <p className="text-[10px] text-primary mt-1">Click to connect</p>
            </div>
          )}

          {!isLoading && !error && isConnected && stats && (
            <>
              {/* Today's count - prominent */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-foreground">
                  {stats.sentToday}
                </span>
                <span className="text-xs text-muted-foreground">today</span>
              </div>

              {/* Week stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stats.sentThisWeek} this week</span>
                </div>
              </div>

              {/* Last sent */}
              {stats.lastSentAt && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Last: {formatTimeAgo(stats.lastSentAt)}
                </div>
              )}
            </>
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
      </div>
    </WarningBorderTrail>
  );
}

/**
 * Format a timestamp into a human-readable "time ago" string
 */
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString();
}

export default EmailsSentTile;
