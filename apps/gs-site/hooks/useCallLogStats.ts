/**
 * React Query hooks for Call Log data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CallLogStatsResponse,
  CallLogUploadResponse,
  CallLogWeeklyFormatted,
  CallEntryFormatted,
} from '@/lib/calllog/types';
import { getWeekStart } from '@/lib/calllog/types';

// ============================================================
// API Functions
// ============================================================

async function fetchCallLogStats(weeks: number = 4): Promise<CallLogStatsResponse> {
  const response = await fetch(`/api/calllog/stats?weeks=${weeks}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch call log stats');
  }

  return data;
}

async function uploadCallLogScreenshot(files: File[], periodStart?: string): Promise<CallLogUploadResponse> {
  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });

  if (periodStart) {
    formData.append('periodStart', periodStart);
  }

  const response = await fetch('/api/calllog/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload screenshot');
  }

  return data;
}

async function checkProcessingStatus(periodStart: string) {
  const response = await fetch(`/api/calllog/process?periodStart=${periodStart}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check processing status');
  }

  return data;
}

// ============================================================
// Query Keys
// ============================================================

export const callLogKeys = {
  all: ['calllog'] as const,
  stats: (weeks: number) => [...callLogKeys.all, 'stats', weeks] as const,
  week: (weekStart: string) => [...callLogKeys.all, 'week', weekStart] as const,
  processingStatus: (periodStart: string) =>
    [...callLogKeys.all, 'processing', periodStart] as const,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Fetch call log statistics for multiple weeks
 */
export function useCallLogStats(weeks: number = 4) {
  return useQuery({
    queryKey: callLogKeys.stats(weeks),
    queryFn: () => fetchCallLogStats(weeks),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Get current week's call log data
 */
export function useCurrentWeekCallLog() {
  const query = useCallLogStats(4);

  return {
    ...query,
    currentWeek: query.data?.currentWeek as CallLogWeeklyFormatted | undefined,
    previousWeeks: query.data?.previousWeeks as CallLogWeeklyFormatted[] | undefined,
    recentCalls: query.data?.recentCalls as CallEntryFormatted[] | undefined,
    hasData: query.data?.currentWeek?.hasData || false,
  };
}

/**
 * Upload screenshot mutation
 */
export function useCallLogUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, periodStart }: { files: File[]; periodStart?: string }) =>
      uploadCallLogScreenshot(files, periodStart),
    onSuccess: () => {
      // Invalidate stats to trigger refetch after processing completes
      queryClient.invalidateQueries({ queryKey: callLogKeys.all });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}

/**
 * Check processing status (useful for polling)
 */
export function useCallLogProcessingStatus(periodStart: string = getWeekStart()) {
  return useQuery({
    queryKey: callLogKeys.processingStatus(periodStart),
    queryFn: () => checkProcessingStatus(periodStart),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: (query) => {
      // Poll every 5 seconds if there are unprocessed uploads
      const data = query.state.data as { status?: { unprocessed?: number } } | undefined;
      if (data?.status?.unprocessed && data.status.unprocessed > 0) {
        return 5000;
      }
      return false; // Stop polling
    },
  });
}

/**
 * Combined hook for Call Log tile
 * Returns all data needed for display + upload functionality
 */
export function useCallLog() {
  const statsQuery = useCurrentWeekCallLog();
  const uploadMutation = useCallLogUpload();
  const queryClient = useQueryClient();

  return {
    // Data
    currentWeek: statsQuery.currentWeek,
    previousWeeks: statsQuery.previousWeeks,
    recentCalls: statsQuery.recentCalls,
    hasData: statsQuery.hasData,

    // Loading states
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,
    error: statsQuery.error,

    // Upload
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    // Actions
    refetch: statsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: callLogKeys.all }),
  };
}

export default useCallLog;
