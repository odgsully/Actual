'use client';

import { useState, useEffect } from 'react';
import { Sunrise, X, Moon } from 'lucide-react';

type Phase = 'morning' | 'evening' | null;

function getCurrentPhase(): Phase {
  const hour = new Date().getHours();

  // Morning: 5am - 10am
  if (hour >= 5 && hour < 10) {
    return 'morning';
  }
  // Evening: 6pm - 11pm
  if (hour >= 18 && hour < 23) {
    return 'evening';
  }

  return null;
}

interface PhaseReminderProps {
  onCompleteClick?: (phase: Phase) => void;
}

/**
 * Soft reminder component for Morning/Evening phase completion.
 * Shows a dismissible banner when in phase window and form not completed.
 *
 * Phase times:
 * - Morning: 5am - 10am
 * - Evening: 6pm - 11pm
 */
export function PhaseReminder({ onCompleteClick }: PhaseReminderProps) {
  const [dismissed, setDismissed] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>(null);

  useEffect(() => {
    // Check current phase on mount and every minute
    const checkPhase = () => {
      setCurrentPhase(getCurrentPhase());
    };

    checkPhase();
    const interval = setInterval(checkPhase, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // TODO: Check if today's phase form is completed
    // This would query Notion/Supabase for today's form submission
    const checkPhaseCompletion = async () => {
      // Placeholder - will integrate with actual data source
      setPhaseComplete(false);
    };

    if (currentPhase) {
      checkPhaseCompletion();
    }
  }, [currentPhase]);

  // Don't show if no active phase, already completed, or dismissed
  if (!currentPhase || phaseComplete || dismissed) {
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
      className={`${bgColor} border ${borderColor} rounded-lg p-4 mx-6 mt-4 flex items-center justify-between`}
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
