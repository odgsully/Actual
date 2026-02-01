'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BudgetSummary,
  BudgetEntry,
  BudgetCategory,
  SummaryResponse,
  EntriesResponse,
  CategoriesResponse,
  CreateEntryPayload,
  CreateCategoryPayload,
} from '@/lib/budget/types';

const QUERY_KEY_SUMMARY = 'budget-summary';
const QUERY_KEY_ENTRIES = 'budget-entries';
const QUERY_KEY_CATEGORIES = 'budget-categories';

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Fetch budget summary
 */
async function fetchSummary(month: string): Promise<BudgetSummary> {
  const response = await fetch(`/api/budget/summary?month=${month}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch summary');
  }
  const data: SummaryResponse = await response.json();
  return data.summary;
}

/**
 * Fetch budget entries
 */
async function fetchEntries(month: string): Promise<BudgetEntry[]> {
  const response = await fetch(`/api/budget/entries?month=${month}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch entries');
  }
  const data: EntriesResponse = await response.json();
  return data.entries;
}

/**
 * Fetch budget categories
 */
async function fetchCategories(): Promise<BudgetCategory[]> {
  const response = await fetch('/api/budget/categories');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch categories');
  }
  const data: CategoriesResponse = await response.json();
  return data.categories;
}

/**
 * Create a new expense entry
 */
async function createEntry(payload: CreateEntryPayload): Promise<BudgetEntry> {
  const response = await fetch('/api/budget/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create entry');
  }
  const data = await response.json();
  return data.entry;
}

/**
 * Create a new category
 */
async function createCategory(payload: CreateCategoryPayload): Promise<BudgetCategory> {
  const response = await fetch('/api/budget/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  const data = await response.json();
  return data.category;
}

/**
 * Hook for budget summary data
 */
export function useBudgetSummary(month: string = getCurrentMonth()) {
  const query = useQuery({
    queryKey: [QUERY_KEY_SUMMARY, month],
    queryFn: () => fetchSummary(month),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for budget entries
 */
export function useBudgetEntries(month: string = getCurrentMonth()) {
  const query = useQuery({
    queryKey: [QUERY_KEY_ENTRIES, month],
    queryFn: () => fetchEntries(month),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for budget categories
 */
export function useBudgetCategories() {
  const query = useQuery({
    queryKey: [QUERY_KEY_CATEGORIES],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes (categories don't change often)
    refetchOnWindowFocus: false,
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Combined hook for all budget data with mutations
 */
export function useBudgetData(month: string = getCurrentMonth()) {
  const queryClient = useQueryClient();

  const summaryQuery = useBudgetSummary(month);
  const entriesQuery = useBudgetEntries(month);
  const categoriesQuery = useBudgetCategories();

  const addEntryMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      // Invalidate both entries and summary to refresh data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ENTRIES, month] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUMMARY, month] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_CATEGORIES] });
    },
  });

  return {
    // Summary data
    summary: summaryQuery.summary,
    isSummaryLoading: summaryQuery.isLoading,
    isSummaryError: summaryQuery.isError,

    // Entries data
    entries: entriesQuery.entries,
    isEntriesLoading: entriesQuery.isLoading,

    // Categories data
    categories: categoriesQuery.categories,
    isCategoriesLoading: categoriesQuery.isLoading,

    // Combined loading state
    isLoading: summaryQuery.isLoading || categoriesQuery.isLoading,
    isError: summaryQuery.isError || categoriesQuery.isError,

    // Mutations
    addEntry: addEntryMutation.mutate,
    addEntryAsync: addEntryMutation.mutateAsync,
    isAddingEntry: addEntryMutation.isPending,

    addCategory: addCategoryMutation.mutate,
    isAddingCategory: addCategoryMutation.isPending,

    // Refetch
    refetchAll: () => {
      summaryQuery.refetch();
      entriesQuery.refetch();
      categoriesQuery.refetch();
    },
  };
}

export default useBudgetData;
