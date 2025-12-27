'use client';

import { useState } from 'react';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

interface WarningBorderTrailProps {
  active: boolean;
  children: React.ReactNode;
  hoverMessage?: string | null;
  className?: string;
}

/**
 * Wraps children with an animated red border trail when `active` is true.
 * Shows a hover tooltip with the warning message (from Action desc column).
 *
 * Uses Motion-Primitives Border Trail with:
 * - Longer tail (size=120)
 * - Red gradient animation
 * - 4-second loop duration
 */
export function WarningBorderTrail({
  active,
  children,
  hoverMessage,
  className,
}: WarningBorderTrailProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ''}`}
      onMouseEnter={() => active && hoverMessage && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {active && (
        <BorderTrail
          className="bg-gradient-to-l from-red-300 via-red-500 to-red-300"
          size={120}
          transition={{
            duration: 4,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      )}

      {/* Hover tooltip with warning message */}
      {active && showTooltip && hoverMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="px-3 py-2 bg-red-900/95 text-red-100 text-xs rounded-md shadow-lg border border-red-700/50 whitespace-nowrap max-w-xs text-center">
            {hoverMessage}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-red-900/95" />
          </div>
        </div>
      )}
    </div>
  );
}

export default WarningBorderTrail;
