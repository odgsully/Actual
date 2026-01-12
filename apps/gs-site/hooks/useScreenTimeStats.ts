/**
 * React Query hooks for Screen Time data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ScreenTimeStatsResponse,
  ScreenTimeUploadResponse,
  ScreenTimeWeeklyFormatted,
} from '@/lib/screentime/types';
import { getWeekStart } from '@/lib/screentime/types';

// ============================================================
// API Functions
// ============================================================

async function fetchScreenTimeStats(weeks: number = 4): Promise<ScreenTimeStatsResponse> {
  const response = await fetch(`/api/screentime/stats?weeks=${weeks}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch screen time stats');
  }

  return data;
}

async function uploadScreenshots(files: File[], weekStart?: string): Promise<ScreenTimeUploadResponse> {
  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });

  if (weekStart) {
    formData.append('weekStart', weekStart);
  }

  const response = await fetch('/api/screentime/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload screenshots');
  }

  return data;
}

async function checkProcessingStatus(weekStart: string) {
  const response = await fetch(`/api/screentime/process?weekStart=${weekStart}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check processing status');
  }

  return data;
}

// ============================================================
// Query Keys
// ============================================================

export const screenTimeKeys = {
  all: ['screentime'] as const,
  stats: (weeks: number) => [...screenTimeKeys.all, 'stats', weeks] as const,
  week: (weekStart: string) => [...screenTimeKeys.all, 'week', weekStart] as const,
  processingStatus: (weekStart: string) =>
    [...screenTimeKeys.all, 'processing', weekStart] as const,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Fetch screen time statistics for multiple weeks
 */
export function useScreenTimeStats(weeks: number = 4) {
  return useQuery({
    queryKey: screenTimeKeys.stats(weeks),
    queryFn: () => fetchScreenTimeStats(weeks),
    staleTime: 30 * 1000, // 30 seconds - allow quick refetches after upload
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Get current week's screen time data
 */
export function useCurrentWeekScreenTime() {
  const query = useScreenTimeStats(4);

  return {
    ...query,
    currentWeek: query.data?.currentWeek as ScreenTimeWeeklyFormatted | undefined,
    previousWeeks: query.data?.previousWeeks as ScreenTimeWeeklyFormatted[] | undefined,
    pendingUploads: (query.data as { pendingUploads?: number })?.pendingUploads || 0,
    hasData: query.data?.currentWeek?.hasData || false,
  };
}

/**
 * Upload screenshots mutation
 */
export function useScreenTimeUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, weekStart }: { files: File[]; weekStart?: string }) =>
      uploadScreenshots(files, weekStart),
    onSuccess: () => {
      // Invalidate stats to trigger refetch after processing completes
      queryClient.invalidateQueries({ queryKey: screenTimeKeys.all });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}

/**
 * Check processing status (useful for polling)
 */
export function useProcessingStatus(weekStart: string = getWeekStart()) {
  return useQuery({
    queryKey: screenTimeKeys.processingStatus(weekStart),
    queryFn: () => checkProcessingStatus(weekStart),
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
 * Combined hook for Screen Time tile
 * Returns all data needed for display + upload functionality
 */
export function useScreenTime() {
  const statsQuery = useCurrentWeekScreenTime();
  const uploadMutation = useScreenTimeUpload();
  const queryClient = useQueryClient();

  return {
    // Data
    currentWeek: statsQuery.currentWeek,
    previousWeeks: statsQuery.previousWeeks,
    pendingUploads: statsQuery.pendingUploads,
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
    invalidate: () => queryClient.invalidateQueries({ queryKey: screenTimeKeys.all }),
  };
}

export default useScreenTime;
