'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BudgetAccount,
  AccountsResponse,
  CreateAccountPayload,
  ImportPreviewResponse,
  ImportConfirmPayload,
  ImportConfirmResponse,
} from '@/lib/budget/types';

/**
 * Hook to manage budget accounts
 */
export function useBudgetAccounts() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AccountsResponse>({
    queryKey: ['budget-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/budget/accounts');
      if (!res.ok) {
        throw new Error('Failed to fetch accounts');
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const addAccountMutation = useMutation({
    mutationFn: async (payload: CreateAccountPayload) => {
      const res = await fetch('/api/budget/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-accounts'] });
    },
  });

  return {
    accounts: data?.accounts || [],
    isLoading,
    isError,
    error,
    refetch,
    addAccount: addAccountMutation.mutateAsync,
    isAddingAccount: addAccountMutation.isPending,
  };
}

/**
 * Hook to handle statement import
 */
export function useBudgetImport() {
  const queryClient = useQueryClient();

  const previewMutation = useMutation<ImportPreviewResponse, Error, { file: File; accountId?: string }>({
    mutationFn: async ({ file, accountId }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (accountId) {
        formData.append('accountId', accountId);
      }

      const res = await fetch('/api/budget/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to parse statement');
      }

      return res.json();
    },
  });

  const confirmMutation = useMutation<ImportConfirmResponse, Error, ImportConfirmPayload>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/budget/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to import transactions');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate all budget queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['budget-entries'] });
    },
  });

  return {
    preview: previewMutation.mutateAsync,
    isPreviewing: previewMutation.isPending,
    previewResult: previewMutation.data,
    previewError: previewMutation.error,
    resetPreview: previewMutation.reset,

    confirm: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    confirmResult: confirmMutation.data,
    confirmError: confirmMutation.error,
    resetConfirm: confirmMutation.reset,
  };
}
