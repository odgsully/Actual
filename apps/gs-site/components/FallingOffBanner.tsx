'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, TrendingDown, Flame } from 'lucide-react';

interface AtRiskHabit {
  name: string;
  streak: number;
  emoji?: string;
}

interface FallingOffBannerProps {
  className?: string;
}

/**
 * Falling Off Warning Banner
 *
 * Displays when the user is at risk of breaking habit streaks
 * or has a low completion rate.
 */
export function FallingOffBanner({ className }: FallingOffBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [atRiskHabits, setAtRiskHabits] = useState<AtRiskHabit[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning');
  const [appearanceId, setAppearanceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  // Check if banner should show on mount
  useEffect(() => {
    const checkBanner = async () => {
      try {
        const response = await fetch('/api/banners/falling-off/check');
        const data = await response.json();

        if (data.show) {
          setAtRiskHabits(data.atRiskHabits || []);
          setCompletionRate(data.completionRate || 0);
          setMessage(data.message || '');
          setSeverity(data.severity || 'warning');
          setAppearanceId(data.appearanceId);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking falling off banner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBanner();
  }, []);

  const handleDismiss = useCallback(async () => {
    if (isDismissing) return;

    setIsDismissing(true);

    // Always hide the banner immediately for good UX
    setIsVisible(false);

    // Record the dismissal if we have an appearanceId
    if (appearanceId) {
      try {
        await fetch('/api/banners/falling-off/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appearanceId, action: 'dismiss' }),
        });
      } catch (error) {
        console.error('Error recording banner dismissal:', error);
      }
    }

    setIsDismissing(false);
  }, [appearanceId, isDismissing]);

  // Don't render anything while loading or if not visible
  if (isLoading || !isVisible) {
    return null;
  }

  const isCritical = severity === 'critical';

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-xl
        ${isCritical
          ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-red-500/50'
          : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-yellow-500/50'
        }
        border
        shadow-lg
        ${isCritical ? 'shadow-red-500/20' : 'shadow-yellow-500/10'}
        animate-in slide-in-from-top-2 fade-in-0
        ${className ?? ''}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
              {isCritical ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>
                {isCritical ? 'Warning: Falling Off' : 'Heads Up'}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Completion Rate */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide">7-Day Rate</div>
            <div className={`text-2xl font-bold mt-1 ${completionRate < 50 ? 'text-red-400' : 'text-white'}`}>
              {completionRate}%
            </div>
          </div>
          {/* At Risk Count */}
          <div className="p-3 bg-black/30 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide">At Risk</div>
            <div className={`text-2xl font-bold mt-1 ${atRiskHabits.length >= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
              {atRiskHabits.length} habits
            </div>
          </div>
        </div>

        {/* At Risk Habits List */}
        {atRiskHabits.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Streaks at Risk</div>
            <div className="flex flex-wrap gap-2">
              {atRiskHabits.slice(0, 5).map((habit) => (
                <div
                  key={habit.name}
                  className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-lg text-sm"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-white/90">
                    {habit.emoji || '•'} {habit.name}
                  </span>
                  <span className="text-orange-400 font-medium">
                    {habit.streak}d
                  </span>
                </div>
              ))}
              {atRiskHabits.length > 5 && (
                <div className="px-2 py-1 bg-black/30 rounded-lg text-sm text-gray-400">
                  +{atRiskHabits.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="
              px-4 py-2
              bg-white/10 text-white font-medium
              rounded-lg border border-white/20
              hover:bg-white/20
              disabled:opacity-50
              transition-colors
              text-sm
            "
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

export default FallingOffBanner;
