'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';

/**
 * Schedule configuration for LIFX and form timing
 */
export interface LIFXScheduleConfig {
  id?: string;
  // Sunrise simulation timing (LIFX lights)
  morning_start_hour: number;
  morning_start_minute: number;
  morning_end_hour: number;
  morning_end_minute: number;
  morning_color: string;
  morning_enabled: boolean;

  // Evening lock timing (LIFX lights)
  evening_lock_hour: number;
  evening_lock_minute: number;
  evening_lock_color: string;
  evening_lock_brightness: number;
  evening_enabled: boolean;

  // Morning form opacity timing
  morning_form_start_hour: number;
  morning_form_start_minute: number;
  morning_form_end_hour: number;
  morning_form_end_minute: number;

  // Evening form opacity timing
  evening_form_start_hour: number;
  evening_form_start_minute: number;
  evening_form_end_hour: number;
  evening_form_end_minute: number;

  // General
  lifx_selector: string;
}

const DEFAULT_CONFIG: LIFXScheduleConfig = {
  // LIFX sunrise
  morning_start_hour: 6,
  morning_start_minute: 0,
  morning_end_hour: 8,
  morning_end_minute: 0,
  morning_color: 'kelvin:3000',
  morning_enabled: true,

  // LIFX evening lock
  evening_lock_hour: 20,
  evening_lock_minute: 30,
  evening_lock_color: 'purple',
  evening_lock_brightness: 0.7,
  evening_enabled: true,

  // Morning form opacity (5am start fading in, 8am fully visible)
  morning_form_start_hour: 5,
  morning_form_start_minute: 0,
  morning_form_end_hour: 8,
  morning_form_end_minute: 0,

  // Evening form opacity (6pm start fading in, 9pm fully visible)
  evening_form_start_hour: 18,
  evening_form_start_minute: 0,
  evening_form_end_hour: 21,
  evening_form_end_minute: 0,

  lifx_selector: 'all',
};

const STORAGE_KEY = 'lifx-schedule-config';

/**
 * Fetch schedule config from localStorage
 */
async function fetchConfig(): Promise<LIFXScheduleConfig> {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load schedule config:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Save schedule config to localStorage
 */
async function saveConfig(config: Partial<LIFXScheduleConfig>): Promise<LIFXScheduleConfig> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CONFIG, ...config };
  }

  try {
    // Get existing config
    const existing = await fetchConfig();
    const updated = { ...existing, ...config };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save schedule config:', error);
    throw new Error('Failed to save schedule config');
  }
}

/**
 * Convert hour and minute to minutes since midnight
 */
export function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Convert minutes since midnight to hour and minute
 */
export function fromMinutes(minutes: number): { hour: number; minute: number } {
  return {
    hour: Math.floor(minutes / 60),
    minute: minutes % 60,
  };
}

/**
 * Format time for display (e.g., "6:00 AM")
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Calculate opacity based on current time and start/end range
 * Returns 0-1 where 0 = not visible, 1 = fully visible
 */
export function calculateOpacity(
  currentHour: number,
  currentMinute: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): number {
  const current = toMinutes(currentHour, currentMinute);
  const start = toMinutes(startHour, startMinute);
  const end = toMinutes(endHour, endMinute);

  // Before start time
  if (current < start) {
    return 0;
  }

  // After end time
  if (current >= end) {
    return 1;
  }

  // Between start and end - linear interpolation
  const range = end - start;
  const elapsed = current - start;
  return elapsed / range;
}

/**
 * Hook for fetching and updating LIFX schedule configuration
 * Includes debouncing and optimistic updates to prevent UI freezing
 */
export function useLIFXScheduleConfig() {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<LIFXScheduleConfig>>({});

  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lifx', 'schedule', 'config'],
    queryFn: fetchConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: saveConfig,
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lifx', 'schedule', 'config'] });

      // Snapshot the previous value
      const previousConfig = queryClient.getQueryData<LIFXScheduleConfig>(['lifx', 'schedule', 'config']);

      // Optimistically update to the new value
      queryClient.setQueryData(['lifx', 'schedule', 'config'], (old: LIFXScheduleConfig | undefined) =>
        old ? { ...old, ...updates } : { ...DEFAULT_CONFIG, ...updates }
      );

      return { previousConfig };
    },
    onError: (err, updates, context) => {
      // Rollback to previous value on error
      if (context?.previousConfig) {
        queryClient.setQueryData(['lifx', 'schedule', 'config'], context.previousConfig);
      }
      console.error('Failed to save schedule config:', err);
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['lifx', 'schedule', 'config'], newConfig);
    },
    onSettled: () => {
      // Clear pending updates after mutation completes
      pendingUpdatesRef.current = {};
    },
  });

  // Debounced update function - collects updates and saves after 800ms of inactivity
  const updateConfig = useCallback((updates: Partial<LIFXScheduleConfig>) => {
    // Merge with any pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Immediately update the UI (optimistic)
    queryClient.setQueryData(['lifx', 'schedule', 'config'], (old: LIFXScheduleConfig | undefined) =>
      old ? { ...old, ...updates } : { ...DEFAULT_CONFIG, ...updates }
    );

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to actually save
    debounceTimeoutRef.current = setTimeout(() => {
      // Only mutate if we have pending updates and no mutation in progress
      if (Object.keys(pendingUpdatesRef.current).length > 0 && !mutation.isPending) {
        mutation.mutate(pendingUpdatesRef.current);
      }
    }, 800); // 800ms debounce
  }, [queryClient, mutation]);

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    isSaving: mutation.isPending,
    error: error?.message || mutation.error?.message,
    updateConfig,
    refetch,
  };
}

/**
 * Hook to get current form opacity based on time
 */
export function useFormOpacity(phase: 'morning' | 'evening') {
  const { config } = useLIFXScheduleConfig();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (phase === 'morning') {
    return calculateOpacity(
      currentHour,
      currentMinute,
      config.morning_form_start_hour,
      config.morning_form_start_minute,
      config.morning_form_end_hour,
      config.morning_form_end_minute
    );
  } else {
    return calculateOpacity(
      currentHour,
      currentMinute,
      config.evening_form_start_hour,
      config.evening_form_start_minute,
      config.evening_form_end_hour,
      config.evening_form_end_minute
    );
  }
}
