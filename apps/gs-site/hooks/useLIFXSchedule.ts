'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ScheduleState {
  date: string;
  morning_sunrise_started: boolean;
  morning_form_submitted: boolean;
  morning_lights_off: boolean;
  evening_lock_started: boolean;
  evening_form_submitted: boolean;
  evening_lights_off: boolean;
  controller_locked: boolean;
  lock_reason: string | null;
}

interface ScheduleStatus {
  success: boolean;
  isLocked: boolean;
  lockReason: string | null;
  unlockAction: string | null;
  sunriseBrightness: number | null;
  isSunriseActive: boolean;
  state: ScheduleState | null;
  config: ScheduleConfig | null;
}

interface ScheduleConfig {
  morning_start_hour: number;
  morning_start_minute: number;
  morning_end_hour: number;
  morning_end_minute: number;
  morning_color: string;
  evening_lock_hour: number;
  evening_lock_minute: number;
  evening_lock_color: string;
  evening_lock_brightness: number;
  lifx_selector: string;
  morning_enabled: boolean;
  evening_enabled: boolean;
}

const SCHEDULE_QUERY_KEY = ['lifx', 'schedule', 'status'] as const;

async function fetchScheduleStatus(): Promise<ScheduleStatus> {
  const response = await fetch('/api/lifx/schedule/status');
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function updateScheduleState(
  updates: Partial<ScheduleState>
): Promise<ScheduleState> {
  const response = await fetch('/api/lifx/schedule', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.state;
}

/**
 * Hook for LIFX schedule state and lock status
 */
export function useLIFXSchedule() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: fetchScheduleStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: updateScheduleState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });

  const status = statusQuery.data;

  return {
    // State
    isLocked: status?.isLocked ?? false,
    lockReason: status?.lockReason ?? null,
    unlockAction: status?.unlockAction ?? null,
    sunriseBrightness: status?.sunriseBrightness ?? null,
    isSunriseActive: status?.isSunriseActive ?? false,
    scheduleState: status?.state ?? null,
    config: status?.config ?? null,

    // Loading states
    isLoading: statusQuery.isLoading,
    isUpdating: updateMutation.isPending,
    error: statusQuery.error?.message ?? updateMutation.error?.message ?? null,

    // Actions
    updateState: updateMutation.mutate,
    refresh: () => queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY }),
  };
}

export type { ScheduleState, ScheduleStatus, ScheduleConfig };
