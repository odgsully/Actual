'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FormIntegrationResult {
  success: boolean;
  lightsAction: 'turned_off' | 'unlocked' | 'none';
  error?: string;
}

/**
 * Handle morning form submission - turns off lights
 */
async function handleMorningFormSubmit(): Promise<FormIntegrationResult> {
  try {
    // 1. Update schedule state
    const stateResponse = await fetch('/api/lifx/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        morning_form_submitted: true,
        morning_form_submitted_at: new Date().toISOString(),
        morning_lights_off: true,
      }),
    });

    if (!stateResponse.ok) {
      throw new Error('Failed to update schedule state');
    }

    // 2. Turn off lights immediately
    const lifxResponse = await fetch('/api/lifx/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selector: 'all',
        power: 'off',
        duration: 1,
      }),
    });

    if (!lifxResponse.ok) {
      console.warn('Failed to turn off lights, but state was updated');
    }

    return {
      success: true,
      lightsAction: 'turned_off',
    };
  } catch (error) {
    console.error('Morning form LIFX integration error:', error);
    return {
      success: false,
      lightsAction: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle evening form submission - unlocks controller and turns off lights
 */
async function handleEveningFormSubmit(): Promise<FormIntegrationResult> {
  try {
    // 1. Update schedule state - unlock controller
    const stateResponse = await fetch('/api/lifx/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evening_form_submitted: true,
        evening_form_submitted_at: new Date().toISOString(),
        evening_lights_off: true,
        controller_locked: false,
        lock_reason: null,
      }),
    });

    if (!stateResponse.ok) {
      throw new Error('Failed to update schedule state');
    }

    // 2. Turn off lights (now that lock is released)
    const lifxResponse = await fetch('/api/lifx/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selector: 'all',
        power: 'off',
        duration: 2,
      }),
    });

    if (!lifxResponse.ok) {
      console.warn('Failed to turn off lights, but state was updated');
    }

    return {
      success: true,
      lightsAction: 'unlocked',
    };
  } catch (error) {
    console.error('Evening form LIFX integration error:', error);
    return {
      success: false,
      lightsAction: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Hook for LIFX integration with form submissions
 */
export function useLIFXFormIntegration() {
  const queryClient = useQueryClient();

  const morningMutation = useMutation({
    mutationFn: handleMorningFormSubmit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifx'] });
    },
  });

  const eveningMutation = useMutation({
    mutationFn: handleEveningFormSubmit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifx'] });
    },
  });

  const onMorningFormComplete = useCallback(() => {
    morningMutation.mutate();
  }, [morningMutation]);

  const onEveningFormComplete = useCallback(() => {
    eveningMutation.mutate();
  }, [eveningMutation]);

  return {
    onMorningFormComplete,
    onEveningFormComplete,
    isMorningPending: morningMutation.isPending,
    isEveningPending: eveningMutation.isPending,
    morningResult: morningMutation.data,
    eveningResult: eveningMutation.data,
  };
}
