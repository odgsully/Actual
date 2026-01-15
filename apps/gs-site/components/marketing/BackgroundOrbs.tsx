'use client';

import { cn } from '@/lib/utils';

interface OrbProps {
  className?: string;
  color: 'gold' | 'purple' | 'teal';
  size: 'sm' | 'md' | 'lg' | 'xl';
  delay?: number;
}

function Orb({ className, color, size, delay = 0 }: OrbProps) {
  const colorMap = {
    gold: 'bg-amber-400/20',
    purple: 'bg-purple-500/20',
    teal: 'bg-teal-400/20',
  };

  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96',
  };

  return (
    <div
      className={cn(
        'absolute rounded-full blur-3xl animate-float animate-pulse-glow',
        colorMap[color],
        sizeMap[size],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left gold orb */}
      <Orb
        color="gold"
        size="lg"
        className="top-20 -left-32"
        delay={0}
      />

      {/* Top right purple orb */}
      <Orb
        color="purple"
        size="xl"
        className="top-40 -right-48"
        delay={2}
      />

      {/* Center teal orb */}
      <Orb
        color="teal"
        size="md"
        className="top-1/2 left-1/4 -translate-y-1/2"
        delay={1}
      />

      {/* Bottom purple orb */}
      <Orb
        color="purple"
        size="lg"
        className="bottom-20 left-1/3"
        delay={3}
      />

      {/* Bottom right gold orb */}
      <Orb
        color="gold"
        size="md"
        className="bottom-40 -right-20"
        delay={1.5}
      />
    </div>
  );
}
