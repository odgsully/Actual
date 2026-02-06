'use client';

import { cn } from '@/lib/utils';

interface GradientBorderCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  animate?: boolean;
}

/**
 * Card with animated gradient border
 * Matches design-remix-v10 gradient-border-card styling
 */
export function GradientBorderCard({
  children,
  className,
  innerClassName,
  animate = true,
}: GradientBorderCardProps) {
  return (
    <div
      className={cn(
        'gradient-border-card',
        !animate && 'animation-paused',
        className
      )}
    >
      <div className={cn('gradient-border-card__inner', innerClassName)}>
        {children}
      </div>
    </div>
  );
}
