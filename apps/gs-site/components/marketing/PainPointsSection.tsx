'use client';

import { painPoints } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface PainPointCardProps {
  stat: string;
  title: string;
  description: string;
  index: number;
}

function PainPointCard({ stat, title, description, index }: PainPointCardProps) {
  const gradientColors = [
    'from-amber-400 to-orange-500',
    'from-purple-400 to-pink-500',
    'from-teal-400 to-cyan-500',
  ];

  return (
    <div
      className={cn(
        'relative p-6 rounded-lg border border-border bg-card/50',
        'hover:bg-card/80 transition-all duration-300',
        'hover:border-border/80 hover:-translate-y-1'
      )}
    >
      {/* Stat */}
      <div
        className={cn(
          'text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-4',
          gradientColors[index % gradientColors.length]
        )}
      >
        {stat}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function PainPointsSection() {
  return (
    <section className="py-20 lg:py-32 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            The Problem We Solve
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most businesses struggle with operational chaos that costs time, money, and growth opportunities.
          </p>
        </div>

        {/* Pain points grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <PainPointCard
              key={point.title}
              stat={point.stat}
              title={point.title}
              description={point.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
