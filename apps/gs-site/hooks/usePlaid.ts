'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlaidItemWithAccounts, PlaidSyncResult } from '@/lib/plaid/types';

const QUERY_KEY_PLAID_ACCOUNTS = 'plaid-accounts';

interface PlaidAccountsResponse {
  items: PlaidItemWithAccounts[];
}

/**
 * Hook to manage Plaid-connected accounts
 */
export function usePlaidAccounts() {
  const queryClient = useQueryClient();

  const query = useQuery<PlaidAccountsResponse>({
    queryKey: [QUERY_KEY_PLAID_ACCOUNTS],
    queryFn: async () => {
      const res = await fetch('/api/plaid/accounts');
      if (!res.ok) throw new Error('Failed to fetch Plaid accounts');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch('/api/plaid/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unlink');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAID_ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: ['budget-accounts'] });
    },
  });

  const syncMutation = useMutation<{ success: boolean; result?: PlaidSyncResult }, Error, string>({
    mutationFn: async (itemId: string) => {
      const res = await fetch('/api/plaid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Sync failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAID_ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['budget-entries'] });
    },
  });

  return {
    items: query.data?.items || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,

    unlink: unlinkMutation.mutateAsync,
    isUnlinking: unlinkMutation.isPending,

    sync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncResult: syncMutation.data,
  };
}

/**
 * Hook for Plaid Link flow (create token + exchange)
 */
export function usePlaidLink() {
  const queryClient = useQueryClient();

  const createLinkTokenMutation = useMutation<{ linkToken: string }, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create link token');
      }
      return res.json();
    },
  });

  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Token exchange failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAID_ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: ['budget-accounts'] });
    },
  });

  return {
    createLinkToken: createLinkTokenMutation.mutateAsync,
    isCreatingToken: createLinkTokenMutation.isPending,

    exchangeToken: exchangeTokenMutation.mutateAsync,
    isExchanging: exchangeTokenMutation.isPending,
  };
}
