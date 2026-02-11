'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FormIntegrationResult {
  success: boolean;
  lightsAction: 'turned_off' | 'unlocked' | 'none';
  error?: string;
}

/**
 * Handle morning form submission - turns off lights
 *
 * Fires the LIFX off command and Supabase state update in parallel
 * to close the race window with the sunrise cron tick (runs every minute).
 * Previously the sequential order (state update THEN light off) left a gap
 * where the cron could read stale state and turn the light back on.
 */
async function handleMorningFormSubmit(): Promise<FormIntegrationResult> {
  try {
    const [stateResult, lifxResponse] = await Promise.all([
      // Update schedule state (so cron skips on next tick)
      fetch('/api/lifx/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          morning_form_submitted: true,
          morning_form_submitted_at: new Date().toISOString(),
          morning_lights_off: true,
        }),
      }).catch((err) => {
        console.error('LIFX schedule state update failed:', err);
        return null; // Don't block light-off on state failure
      }),
      // Turn off lights immediately
      fetch('/api/lifx/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: 'all',
          power: 'off',
          duration: 1,
        }),
      }),
    ]);

    if (stateResult && !stateResult.ok) {
      console.error('LIFX schedule state update returned:', stateResult.status);
    }

    if (!lifxResponse.ok) {
      const errText = await lifxResponse.text().catch(() => 'unknown');
      console.error('LIFX turn-off failed:', lifxResponse.status, errText);
      return {
        success: false,
        lightsAction: 'none',
        error: `LIFX API returned ${lifxResponse.status}`,
      };
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
 *
 * Same parallel pattern as morning: fires the LIFX off command and
 * Supabase state update simultaneously to avoid the race with the
 * evening-lock cron. The LIFX state API does not check lock status,
 * so the light turns off regardless of controller_locked state.
 */
async function handleEveningFormSubmit(): Promise<FormIntegrationResult> {
  try {
    const [stateResult, lifxResponse] = await Promise.all([
      // Update schedule state - unlock controller
      fetch('/api/lifx/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evening_form_submitted: true,
          evening_form_submitted_at: new Date().toISOString(),
          evening_lights_off: true,
          controller_locked: false,
          lock_reason: null,
        }),
      }).catch((err) => {
        console.error('LIFX schedule state update failed:', err);
        return null; // Don't block light-off on state failure
      }),
      // Turn off lights immediately
      fetch('/api/lifx/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: 'all',
          power: 'off',
          duration: 2,
        }),
      }),
    ]);

    if (stateResult && !stateResult.ok) {
      console.error('LIFX schedule state update returned:', stateResult.status);
    }

    if (!lifxResponse.ok) {
      const errText = await lifxResponse.text().catch(() => 'unknown');
      console.error('LIFX turn-off failed:', lifxResponse.status, errText);
      return {
        success: false,
        lightsAction: 'none',
        error: `LIFX API returned ${lifxResponse.status}`,
      };
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
 *
 * Uses direct fetch calls instead of React Query mutations so that
 * LIFX API calls survive component unmount (modal close).
 */
export function useLIFXFormIntegration() {
  const queryClient = useQueryClient();

  const onMorningFormComplete = useCallback(() => {
    handleMorningFormSubmit()
      .then(() => queryClient.invalidateQueries({ queryKey: ['lifx'] }))
      .catch((err) => console.error('Morning LIFX integration failed:', err));
  }, [queryClient]);

  const onEveningFormComplete = useCallback(() => {
    handleEveningFormSubmit()
      .then(() => queryClient.invalidateQueries({ queryKey: ['lifx'] }))
      .catch((err) => console.error('Evening LIFX integration failed:', err));
  }, [queryClient]);

  return {
    onMorningFormComplete,
    onEveningFormComplete,
  };
}
