'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface WordOfMonthData {
  org: string;
  real_estate: string;
  software: string;
  content: string;
  health: string;
  learn: string;
  all: string;
}

export interface WordOfMonthResponse {
  success: boolean;
  monthYear: string;
  words: WordOfMonthData;
  updatedAt?: string;
  error?: string;
}

export type WordCategory = keyof WordOfMonthData;

export const CATEGORY_LABELS: Record<WordCategory, string> = {
  org: 'Org',
  real_estate: 'Real Estate',
  software: 'Software',
  content: 'Content',
  health: 'Health',
  learn: 'Learn',
  all: 'ALL',
};

export const CATEGORY_ORDER: WordCategory[] = [
  'org',
  'real_estate',
  'software',
  'content',
  'health',
  'learn',
  'all',
];

async function fetchWordsForMonth(monthYear: string): Promise<WordOfMonthResponse> {
  const response = await fetch(`/api/word-of-month?month=${monthYear}`);
  if (!response.ok) {
    throw new Error('Failed to fetch words');
  }
  return response.json();
}

async function updateWord(
  monthYear: string,
  category: WordCategory,
  word: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/word-of-month', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthYear, category, word }),
  });
  return response.json();
}

interface UseWordOfMonthOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and manage Word of the Month data for a specific month.
 *
 * @param monthYear - Format: "2025-12" for December 2025
 * @param options - Query options
 */
export function useWordOfMonth(monthYear: string, options: UseWordOfMonthOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const queryKey = ['wordOfMonth', monthYear];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchWordsForMonth(monthYear),
    enabled: enabled && !!monthYear,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const mutation = useMutation({
    mutationFn: ({ category, word }: { category: WordCategory; word: string }) =>
      updateWord(monthYear, category, word),
    onMutate: async ({ category, word }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<WordOfMonthResponse>(queryKey);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<WordOfMonthResponse>(queryKey, {
          ...previousData,
          words: {
            ...previousData.words,
            [category]: word,
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const saveWord = useCallback(
    (category: WordCategory, word: string) => {
      mutation.mutate({ category, word });
    },
    [mutation]
  );

  return {
    words: query.data?.words ?? getEmptyWords(),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.data?.updatedAt,
    saveWord,
    isSaving: mutation.isPending,
    saveError: mutation.error,
    refetch: query.refetch,
  };
}

function getEmptyWords(): WordOfMonthData {
  return {
    org: '',
    real_estate: '',
    software: '',
    content: '',
    health: '',
    learn: '',
    all: '',
  };
}

/**
 * Get the current month in YYYY-MM format.
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate array of months from Dec 2025 to Dec 2026.
 */
export function getMonthRange(): Array<{ monthYear: string; label: string; shortLabel: string }> {
  const months: Array<{ monthYear: string; label: string; shortLabel: string }> = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Start: Dec 2025 (month index 11)
  // End: Dec 2026 (month index 11)
  let year = 2025;
  let month = 11; // December

  for (let i = 0; i < 13; i++) {
    const monthYear = `${year}-${String(month + 1).padStart(2, '0')}`;
    months.push({
      monthYear,
      label: `${fullMonthNames[month]} ${year}`,
      shortLabel: `${monthNames[month]} '${String(year).slice(2)}`,
    });

    // Advance to next month
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return months;
}

export default useWordOfMonth;
