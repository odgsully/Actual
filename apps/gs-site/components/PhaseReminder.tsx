'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sunrise, X, Moon } from 'lucide-react';
import {
  useLIFXScheduleConfig,
  calculateOpacity,
  toMinutes,
} from '@/hooks/useLIFXScheduleConfig';

type Phase = 'morning' | 'evening' | null;

interface PhaseReminderProps {
  onCompleteClick?: (phase: Phase) => void;
}

/**
 * Soft reminder component for Morning/Evening phase completion.
 * Shows a dismissible banner when in phase window and form not completed.
 * Opacity fades in based on schedule config timing.
 */
export function PhaseReminder({ onCompleteClick }: PhaseReminderProps) {
  const [dismissed, setDismissed] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Get schedule config for timing
  const { config } = useLIFXScheduleConfig();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Determine current phase and opacity based on config
  const { currentPhase, opacity } = useMemo(() => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentMinutes = toMinutes(hour, minute);

    // Morning phase window
    const morningStart = toMinutes(config.morning_form_start_hour, config.morning_form_start_minute);
    const morningEnd = toMinutes(config.morning_form_end_hour, config.morning_form_end_minute);
    // Extend end window by 2 hours after full visibility
    const morningWindowEnd = morningEnd + 120;

    // Evening phase window
    const eveningStart = toMinutes(config.evening_form_start_hour, config.evening_form_start_minute);
    const eveningEnd = toMinutes(config.evening_form_end_hour, config.evening_form_end_minute);
    // Extend end window by 2 hours after full visibility
    const eveningWindowEnd = eveningEnd + 120;

    // Check if in morning window
    if (currentMinutes >= morningStart && currentMinutes < morningWindowEnd) {
      const opacity = calculateOpacity(
        hour,
        minute,
        config.morning_form_start_hour,
        config.morning_form_start_minute,
        config.morning_form_end_hour,
        config.morning_form_end_minute
      );
      return { currentPhase: 'morning' as Phase, opacity };
    }

    // Check if in evening window
    if (currentMinutes >= eveningStart && currentMinutes < eveningWindowEnd) {
      const opacity = calculateOpacity(
        hour,
        minute,
        config.evening_form_start_hour,
        config.evening_form_start_minute,
        config.evening_form_end_hour,
        config.evening_form_end_minute
      );
      return { currentPhase: 'evening' as Phase, opacity };
    }

    return { currentPhase: null, opacity: 0 };
  }, [currentTime, config]);

  useEffect(() => {
    // Check if today's phase form is completed by querying LIFX schedule state
    const checkPhaseCompletion = async () => {
      if (!currentPhase) return;

      try {
        const response = await fetch('/api/lifx/schedule');
        if (!response.ok) return;

        const { state } = await response.json();

        if (currentPhase === 'morning' && state?.morning_form_submitted) {
          setPhaseComplete(true);
        } else if (currentPhase === 'evening' && state?.evening_form_submitted) {
          setPhaseComplete(true);
        } else {
          setPhaseComplete(false);
        }
      } catch (error) {
        console.error('Error checking phase completion:', error);
        // Don't show banner on error - fail silently
        setPhaseComplete(false);
      }
    };

    checkPhaseCompletion();
  }, [currentPhase]);

  // Don't show if no active phase, already completed, dismissed, or opacity is 0
  if (!currentPhase || phaseComplete || dismissed || opacity === 0) {
    return null;
  }

  const isMorning = currentPhase === 'morning';
  const Icon = isMorning ? Sunrise : Moon;
  const phaseName = isMorning ? 'Morning Form' : 'Evening Check-in';
  const phaseDesc = isMorning
    ? 'Complete your AM check-in for full tracking'
    : 'Complete your evening review';
  const bgColor = isMorning ? 'bg-amber-500/10' : 'bg-indigo-500/10';
  const borderColor = isMorning ? 'border-amber-500/30' : 'border-indigo-500/30';
  const iconColor = isMorning ? 'text-amber-500' : 'text-indigo-400';
  const textColor = isMorning ? 'text-amber-200' : 'text-indigo-200';
  const textMuted = isMorning ? 'text-amber-400/70' : 'text-indigo-400/70';
  const buttonBg = isMorning ? 'bg-amber-500 hover:bg-amber-400' : 'bg-indigo-500 hover:bg-indigo-400';

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 mx-6 mt-4 flex items-center justify-between transition-opacity duration-500`}
      style={{ opacity }}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <div>
          <p className={`text-sm font-medium ${textColor}`}>
            {phaseName} Incomplete
          </p>
          <p className={`text-xs ${textMuted}`}>{phaseDesc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 text-xs ${buttonBg} text-black rounded-md font-medium transition-colors`}
          onClick={() => onCompleteClick?.(currentPhase)}
        >
          Complete Now
        </button>
        <button
          className={`p-1 ${textMuted} hover:${iconColor} transition-colors`}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PhaseReminder;
