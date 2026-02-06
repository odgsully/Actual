'use client';

import { cn } from '@/lib/utils';

interface OrbConfig {
  color: 'gold' | 'purple' | 'teal';
  className: string;
}

interface BackgroundOrbsProps {
  /** Preset configurations for different sections */
  variant?: 'hero' | 'stats' | 'cta' | 'custom';
  /** Custom orb configurations (used when variant='custom') */
  orbs?: OrbConfig[];
  className?: string;
}

/**
 * Aurora-style background orbs with radial gradients and floating animations
 * Uses clamp() for responsive sizing to prevent mobile overflow
 */
export function BackgroundOrbs({
  variant = 'hero',
  orbs,
  className,
}: BackgroundOrbsProps) {
  // Preset configurations for different sections
  const presets: Record<string, OrbConfig[]> = {
    hero: [
      { color: 'gold', className: 'w-[clamp(300px,50vw,600px)] h-[clamp(300px,50vw,600px)] -top-[10%] -right-[5%]' },
      { color: 'purple', className: 'w-[clamp(250px,42vw,500px)] h-[clamp(250px,42vw,500px)] bottom-0 -left-[8%]' },
      { color: 'teal', className: 'w-[clamp(200px,33vw,400px)] h-[clamp(200px,33vw,400px)] top-[30%] left-[40%]' },
    ],
    stats: [
      { color: 'purple', className: 'w-[clamp(250px,42vw,500px)] h-[clamp(250px,42vw,500px)] -top-[20%] left-1/2 -translate-x-1/2' },
    ],
    cta: [
      { color: 'gold', className: 'w-[clamp(250px,42vw,500px)] h-[clamp(250px,42vw,500px)] -top-[30%] left-[20%]' },
      { color: 'teal', className: 'w-[clamp(200px,33vw,400px)] h-[clamp(200px,33vw,400px)] -bottom-[30%] right-[20%]' },
    ],
    custom: [],
  };

  const orbsToRender = variant === 'custom' && orbs ? orbs : presets[variant];

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden="true"
    >
      {orbsToRender.map((orb, index) => (
        <div
          key={index}
          className={cn(
            'aurora-orb',
            `aurora-orb--${orb.color}`,
            orb.className
          )}
        />
      ))}
    </div>
  );
}
