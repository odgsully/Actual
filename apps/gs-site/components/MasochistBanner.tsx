'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Flame, Check, AlertTriangle } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MasochistBannerProps {
  className?: string;
}

/**
 * Masochist Moment Banner
 *
 * A surprise challenge banner that appears randomly during work hours.
 * Challenges are designed to push comfort zones and build mental toughness.
 */
export function MasochistBanner({ className }: MasochistBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [appearanceId, setAppearanceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  // Check if banner should show on mount
  useEffect(() => {
    const checkBanner = async () => {
      try {
        const response = await fetch('/api/banners/masochist/check');
        const data = await response.json();

        if (data.show && data.challenge) {
          setChallenge(data.challenge);
          setAppearanceId(data.appearanceId);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking masochist banner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBanner();
  }, []);

  const handleDismiss = useCallback(async () => {
    if (!appearanceId || isActioning) return;

    setIsActioning(true);
    try {
      await fetch('/api/banners/masochist/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId, action: 'dismiss' }),
      });
    } catch (error) {
      console.error('Error dismissing banner:', error);
    } finally {
      setIsVisible(false);
      setIsActioning(false);
    }
  }, [appearanceId, isActioning]);

  const handleComplete = useCallback(async () => {
    if (!appearanceId || isActioning) return;

    setIsActioning(true);
    try {
      await fetch('/api/banners/masochist/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId, action: 'complete' }),
      });
    } catch (error) {
      console.error('Error completing banner:', error);
    } finally {
      setIsVisible(false);
      setIsActioning(false);
    }
  }, [appearanceId, isActioning]);

  // Don't render anything while loading or if not visible
  if (isLoading || !isVisible || !challenge) {
    return null;
  }

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400',
  };

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-xl
        bg-gradient-to-r from-red-600/90 via-orange-500/90 to-red-600/90
        border border-red-400/50
        shadow-lg shadow-red-500/20
        animate-in slide-in-from-top-2 fade-in-0
        ${className ?? ''}
      `}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Masochist Moment
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 ${difficultyColors[challenge.difficulty]}`}>
                  {challenge.difficulty.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white/80 mt-0.5">
                Time to push your limits
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isActioning}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge */}
        <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            {challenge.title}
          </h4>
          <p className="mt-2 text-white/90">
            {challenge.description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleComplete}
            disabled={isActioning}
            className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-2.5
              bg-white text-red-600 font-semibold
              rounded-lg
              hover:bg-white/90
              disabled:opacity-50
              transition-colors
            "
          >
            <Check className="w-5 h-5" />
            I Accept
          </button>
          <button
            onClick={handleDismiss}
            disabled={isActioning}
            className="
              px-4 py-2.5
              bg-black/20 text-white/80 font-medium
              rounded-lg border border-white/20
              hover:bg-black/30 hover:text-white
              disabled:opacity-50
              transition-colors
            "
          >
            Not Today
          </button>
        </div>

        {/* Motivational footer */}
        <p className="mt-3 text-xs text-white/60 text-center italic">
          "The obstacle is the way."
        </p>
      </div>
    </div>
  );
}

export default MasochistBanner;
