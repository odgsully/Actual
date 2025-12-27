'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContactWithTier, ContactTier, GroupedContacts } from '@/lib/contacts/types';

/**
 * Contact tier management hooks for React Query
 *
 * These hooks manage contact tier assignments for accountability reports.
 *
 * Cache Strategy:
 * - Contacts: Invalidate on tier update
 * - Stats: 5 min cache
 */

// ============================================================
// Types
// ============================================================

export interface TierStats {
  none: number;
  tier1: number;
  tier2: number;
  total: number;
}

export interface ImportResult {
  success: boolean;
  isReimport: boolean;
  parsed: number;
  imported: number;
  skipped: number;
  errors?: string[];
}

export interface UpdateTiersParams {
  contactIds: string[];
  tier: ContactTier;
}

// ============================================================
// Fetch Functions
// ============================================================

/**
 * Fetch all contacts from API
 */
async function fetchContacts(): Promise<ContactWithTier[]> {
  const response = await fetch('/api/contacts/tiers');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch contacts' }));
    throw new Error(error.error || 'Failed to fetch contacts');
  }

  const data = await response.json();
  return data.contacts;
}

/**
 * Fetch tier statistics
 */
async function fetchTierStats(): Promise<TierStats> {
  const response = await fetch('/api/contacts/tiers?stats=true');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || 'Failed to fetch stats');
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Update tiers for contacts
 */
async function updateTiers(params: UpdateTiersParams): Promise<ContactWithTier[]> {
  const response = await fetch('/api/contacts/tiers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update tiers' }));
    throw new Error(error.error || 'Failed to update tiers');
  }

  const data = await response.json();
  return data.contacts;
}

/**
 * Check if contacts have been imported
 */
async function checkImportStatus(): Promise<boolean> {
  const response = await fetch('/api/contacts/import');

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.imported;
}

/**
 * Import contacts from VCF file
 */
async function importContacts(): Promise<ImportResult> {
  const response = await fetch('/api/contacts/import', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to import contacts' }));
    throw new Error(error.error || 'Failed to import contacts');
  }

  return response.json();
}

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch all contacts
 *
 * @example
 * ```tsx
 * const { data: contacts, isLoading } = useContacts();
 * ```
 */
export function useContacts() {
  return useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch contacts grouped by tier
 *
 * @example
 * ```tsx
 * const { data: grouped, isLoading } = useContactsGrouped();
 * // grouped.none, grouped.tier1, grouped.tier2
 * ```
 */
export function useContactsGrouped() {
  const { data: contacts, ...rest } = useContacts();

  const grouped: GroupedContacts | undefined = contacts
    ? {
        none: contacts.filter((c) => c.tier === 'none'),
        tier1: contacts.filter((c) => c.tier === 'tier1'),
        tier2: contacts.filter((c) => c.tier === 'tier2'),
      }
    : undefined;

  return {
    data: grouped,
    ...rest,
  };
}

/**
 * Hook to fetch tier statistics
 *
 * @example
 * ```tsx
 * const { data: stats } = useTierStats();
 * // stats.tier1 = 10, stats.tier2 = 25, stats.none = 1137
 * ```
 */
export function useTierStats() {
  return useQuery({
    queryKey: ['contacts', 'stats'],
    queryFn: fetchTierStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check import status
 *
 * @example
 * ```tsx
 * const { data: hasImported } = useImportStatus();
 * if (!hasImported) { // show import button }
 * ```
 */
export function useImportStatus() {
  return useQuery({
    queryKey: ['contacts', 'import-status'],
    queryFn: checkImportStatus,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update contact tiers
 *
 * Automatically invalidates contacts cache on success.
 *
 * @example
 * ```tsx
 * const { mutate: updateTiers, isPending } = useUpdateTiers();
 * updateTiers({ contactIds: ['id1', 'id2'], tier: 'tier1' });
 * ```
 */
export function useUpdateTiers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTiers,
    onSuccess: () => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

/**
 * Hook to import contacts from VCF
 *
 * Automatically invalidates contacts cache on success.
 *
 * @example
 * ```tsx
 * const { mutate: runImport, isPending } = useImportContacts();
 * runImport();
 * ```
 */
export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importContacts,
    onSuccess: () => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

/**
 * Hook to update a single contact's tier
 *
 * Convenience wrapper around useUpdateTiers for single contact updates.
 *
 * @example
 * ```tsx
 * const { mutate: setTier } = useSetContactTier();
 * setTier({ contactId: 'abc', tier: 'tier1' });
 * ```
 */
export function useSetContactTier() {
  const updateTiersMutation = useUpdateTiers();

  return {
    ...updateTiersMutation,
    mutate: ({ contactId, tier }: { contactId: string; tier: ContactTier }) => {
      updateTiersMutation.mutate({ contactIds: [contactId], tier });
    },
    mutateAsync: async ({ contactId, tier }: { contactId: string; tier: ContactTier }) => {
      return updateTiersMutation.mutateAsync({ contactIds: [contactId], tier });
    },
  };
}
