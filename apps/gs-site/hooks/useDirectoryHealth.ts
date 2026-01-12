/**
 * useDirectoryHealth Hook
 *
 * Fetches directory health status from the API.
 * Uses React Query for caching and background refetching.
 */

import { useQuery } from '@tanstack/react-query';

export interface DirectoryResult {
  key: string;
  name: string;
  path: string;
  unexpected: string[];
  count: number;
  success: boolean;
  error?: string;
  skipped: boolean;
}

export interface DirectoryHealthData {
  timestamp: string;
  totalUnexpected: number;
  directories: DirectoryResult[];
  status: 'clean' | 'warning' | 'error';
  error?: string;
}

async function fetchDirectoryHealth(): Promise<DirectoryHealthData> {
  const response = await fetch('/api/directory-health');

  if (!response.ok) {
    throw new Error(`Failed to fetch directory health: ${response.status}`);
  }

  return response.json();
}

export function useDirectoryHealth() {
  return useQuery<DirectoryHealthData, Error>({
    queryKey: ['directory-health'],
    queryFn: fetchDirectoryHealth,
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Keep data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Retry once on failure
    retry: 1,
  });
}
