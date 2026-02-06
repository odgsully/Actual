'use client';

import { painPoints } from '@/lib/marketing-data';
import { BackgroundOrbs } from './BackgroundOrbs';
import { GradientBorderCard } from './GradientBorderCard';
import { cn } from '@/lib/utils';

interface StatCardProps {
  stat: string;
  title: string;
  description: string;
  isLarge?: boolean;
  delay?: number;
}

function StatCard({ stat, title, description, isLarge, delay = 1 }: StatCardProps) {
  return (
    <GradientBorderCard
      className={cn(
        'reveal',
        `reveal-delay-${delay}`,
        isLarge && 'md:col-span-2'
      )}
    >
      <div className="gradient-text font-display text-[clamp(44px,5vw,68px)] font-light tracking-[-0.03em] leading-none mb-3.5">
        {stat}
      </div>
      <div className="font-display text-xl font-medium text-[var(--text-primary)] mb-2.5">
        {title}
      </div>
      <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7]">
        {description}
      </p>
    </GradientBorderCard>
  );
}

export function StatsSection() {
  return (
    <section id="stats" className="relative py-24 px-8 max-w-[1400px] mx-auto overflow-hidden">
      {/* Aurora background */}
      <BackgroundOrbs variant="stats" />

      {/* Section header */}
      <div className="relative z-10 mb-14">
        <p className="reveal text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          The Problem
        </p>
        <h2 className="reveal reveal-delay-1 font-display text-[clamp(32px,5vw,52px)] font-medium tracking-[-0.03em] leading-[1.15] mb-5">
          Why businesses are <span className="accent-text-gold">leaving money</span> on the table
        </h2>
        <p className="reveal reveal-delay-2 text-[17px] font-normal text-[var(--text-secondary)] leading-[1.75] max-w-[560px]">
          Most SMBs don&apos;t have a technology problem. They have a technology utilization problem.
        </p>
      </div>

      {/* Bento grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {painPoints.map((point, index) => (
          <StatCard
            key={point.title}
            stat={point.stat}
            title={point.title}
            description={point.description}
            isLarge={point.isLarge}
            delay={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

// Re-export as PainPointsSection for backwards compatibility
export { StatsSection as PainPointsSection };
