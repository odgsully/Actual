'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LIFXLight, LIFXPresetColor, LIFX_PRESET_COLORS } from '@/lib/lifx/client';

// Query keys
const LIFX_QUERY_KEYS = {
  lights: ['lifx', 'lights'] as const,
  light: (id: string) => ['lifx', 'lights', id] as const,
  scheduleStatus: ['lifx', 'schedule', 'status'] as const,
};

// Schedule status response
interface ScheduleStatus {
  isLocked: boolean;
  lockReason: string | null;
  lockMessage: string | null;
  morningFormSubmitted: boolean;
  eveningFormSubmitted: boolean;
  sunriseActive: boolean;
  sunriseBrightness: number;
}

// Fetch schedule lock status
async function fetchScheduleStatus(): Promise<ScheduleStatus> {
  const response = await fetch('/api/lifx/schedule/status');
  const data = await response.json();
  return data;
}

// API response types
interface LightsResponse {
  success: boolean;
  lights: LIFXLight[];
  count: number;
  error?: string;
}

interface ActionResponse {
  success: boolean;
  results?: Array<{ id: string; label: string; status: string }>;
  error?: string;
}

// Fetch lights from API
async function fetchLights(selector: string = 'all'): Promise<LIFXLight[]> {
  const response = await fetch(`/api/lifx/lights?selector=${encodeURIComponent(selector)}`);
  const data: LightsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch lights');
  }

  return data.lights;
}

// Set state on lights
async function setLightState(params: {
  selector?: string;
  power?: 'on' | 'off';
  brightness?: number;
  color?: string;
  duration?: number;
}): Promise<ActionResponse> {
  const response = await fetch('/api/lifx/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

// Toggle lights
async function toggleLights(params: {
  selector?: string;
  duration?: number;
}): Promise<ActionResponse> {
  const response = await fetch('/api/lifx/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

// Run effects
async function runEffect(params: {
  selector?: string;
  effect: 'breathe' | 'pulse' | 'off';
  color?: string;
  period?: number;
  cycles?: number;
}): Promise<ActionResponse> {
  const response = await fetch('/api/lifx/effects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

/**
 * Hook to fetch all LIFX lights
 */
export function useLIFXLights(selector: string = 'all') {
  return useQuery({
    queryKey: [...LIFX_QUERY_KEYS.lights, selector],
    queryFn: () => fetchLights(selector),
    staleTime: 30 * 1000, // 30 seconds - lights change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

/**
 * Hook to toggle lights on/off
 */
export function useLIFXToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLights,
    onSuccess: () => {
      // Invalidate lights query to refetch current state
      queryClient.invalidateQueries({ queryKey: LIFX_QUERY_KEYS.lights });
    },
  });
}

/**
 * Hook to set light state (power, brightness, color)
 */
export function useLIFXSetState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setLightState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIFX_QUERY_KEYS.lights });
    },
  });
}

/**
 * Hook to run effects (breathe, pulse)
 */
export function useLIFXEffect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runEffect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIFX_QUERY_KEYS.lights });
    },
  });
}

/**
 * Hook to fetch schedule lock status
 */
export function useLIFXScheduleStatus() {
  return useQuery({
    queryKey: LIFX_QUERY_KEYS.scheduleStatus,
    queryFn: fetchScheduleStatus,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: 1,
  });
}

/**
 * Combined hook for full LIFX control
 */
export function useLIFXController(selector: string = 'all') {
  const queryClient = useQueryClient();

  const lightsQuery = useLIFXLights(selector);
  const scheduleStatus = useLIFXScheduleStatus();
  const toggleMutation = useLIFXToggle();
  const setStateMutation = useLIFXSetState();
  const effectMutation = useLIFXEffect();

  // Derived state
  const lights = lightsQuery.data || [];
  const isConnected = lightsQuery.isSuccess && lights.length > 0;
  const isLoading = lightsQuery.isLoading;
  const error = lightsQuery.error?.message;

  // Schedule lock status
  const schedule = scheduleStatus.data;
  const isLocked = schedule?.isLocked ?? false;
  const lockReason = schedule?.lockReason ?? null;
  const lockMessage = schedule?.lockMessage ?? null;

  // Check if any light is on
  const anyOn = lights.some((light) => light.power === 'on');

  // Get average brightness across all on lights
  const avgBrightness =
    lights.filter((l) => l.power === 'on').reduce((sum, l) => sum + l.brightness, 0) /
      Math.max(lights.filter((l) => l.power === 'on').length, 1) || 0;

  // Control functions (with lock checking)
  const toggle = (duration?: number) => {
    // If locked and lights are on, block toggle (would turn off)
    if (isLocked && anyOn) {
      console.warn('LIFX toggle blocked:', lockMessage);
      return { blocked: true, reason: lockMessage };
    }
    toggleMutation.mutate({ selector, duration });
    return { blocked: false };
  };

  const turnOn = (selectorOverride?: string, duration?: number) => {
    // Turn on is always allowed
    setStateMutation.mutate({ selector: selectorOverride || selector, power: 'on', duration });
    return { blocked: false };
  };

  const turnOff = (selectorOverride?: string, duration?: number) => {
    // Block turn off if locked
    if (isLocked) {
      console.warn('LIFX turnOff blocked:', lockMessage);
      return { blocked: true, reason: lockMessage };
    }
    setStateMutation.mutate({ selector: selectorOverride || selector, power: 'off', duration });
    return { blocked: false };
  };

  const setBrightness = (brightness: number, duration?: number) => {
    setStateMutation.mutate({ selector, brightness, duration });
  };

  const setColor = (color: string, duration?: number) => {
    setStateMutation.mutate({ selector, color, duration });
  };

  const setPreset = (preset: LIFXPresetColor, duration?: number) => {
    const color = LIFX_PRESET_COLORS[preset];
    setStateMutation.mutate({ selector, color, duration });
  };

  const setTemperature = (kelvin: number, duration?: number) => {
    setStateMutation.mutate({ selector, color: `kelvin:${kelvin}`, duration });
  };

  const breathe = (color: string, cycles?: number, period?: number) => {
    effectMutation.mutate({ selector, effect: 'breathe', color, cycles, period });
  };

  const pulse = (color: string, cycles?: number, period?: number) => {
    effectMutation.mutate({ selector, effect: 'pulse', color, cycles, period });
  };

  const stopEffects = () => {
    effectMutation.mutate({ selector, effect: 'off' });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: LIFX_QUERY_KEYS.lights });
  };

  // Is any action in progress
  const isActing =
    toggleMutation.isPending || setStateMutation.isPending || effectMutation.isPending;

  return {
    // State
    lights,
    isConnected,
    isLoading,
    isActing,
    error,
    anyOn,
    avgBrightness,

    // Schedule lock state
    isLocked,
    lockReason,
    lockMessage,
    schedule,

    // Actions
    toggle,
    turnOn,
    turnOff,
    setBrightness,
    setColor,
    setPreset,
    setTemperature,
    breathe,
    pulse,
    stopEffects,
    refresh,

    // Presets
    presets: LIFX_PRESET_COLORS,
  };
}

// Re-export preset colors for use in components
export { LIFX_PRESET_COLORS };
export type { LIFXLight, LIFXPresetColor, ScheduleStatus };
