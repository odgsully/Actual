'use client';

import { useState, useCallback } from 'react';

interface GmailStats {
  sentToday: number;
  sentThisWeek: number;
  lastSentAt?: string;
}

interface GmailData {
  connected: boolean;
  email?: string;
  stats?: GmailStats;
}

interface UseGmailStatsResult {
  data: GmailData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching Gmail sent email statistics
 * TODO: Implement actual Gmail API integration
 */
export function useGmailStats(): UseGmailStatsResult {
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Stub: Return disconnected state until Gmail OAuth is implemented
  const data: GmailData = {
    connected: false,
  };

  const refetch = useCallback(() => {
    // TODO: Implement refetch when Gmail API is connected
    console.log('Gmail refetch requested - not yet implemented');
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

interface UseConnectGmailResult {
  connect: (returnUrl?: string) => void;
}

/**
 * Hook for initiating Gmail OAuth connection
 * TODO: Implement actual OAuth flow
 */
export function useConnectGmail(): UseConnectGmailResult {
  const connect = useCallback((returnUrl?: string) => {
    // TODO: Implement Gmail OAuth flow
    console.log('Gmail connect requested - not yet implemented', { returnUrl });
    alert('Gmail integration coming soon!');
  }, []);

  return { connect };
}
