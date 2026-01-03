'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

/**
 * Fetch schedule config from API
 */
async function fetchConfig(): Promise<LIFXScheduleConfig> {
  const response = await fetch('/api/lifx/schedule/config');
  if (!response.ok) {
    throw new Error('Failed to fetch schedule config');
  }
  const data = await response.json();
  return { ...DEFAULT_CONFIG, ...data.config };
}

/**
 * Save schedule config to API
 */
async function saveConfig(config: Partial<LIFXScheduleConfig>): Promise<LIFXScheduleConfig> {
  const response = await fetch('/api/lifx/schedule/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error('Failed to save schedule config');
  }
  const data = await response.json();
  return data.config;
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
 */
export function useLIFXScheduleConfig() {
  const queryClient = useQueryClient();

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
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['lifx', 'schedule', 'config'], newConfig);
    },
  });

  const updateConfig = (updates: Partial<LIFXScheduleConfig>) => {
    mutation.mutate(updates);
  };

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
