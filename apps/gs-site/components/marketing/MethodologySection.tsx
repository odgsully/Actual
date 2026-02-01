'use client';

import { methodology } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface MethodologyStepProps {
  phase: number;
  title: string;
  duration: string;
  description: string;
  isLast: boolean;
}

function MethodologyStep({ phase, title, duration, description, isLast }: MethodologyStepProps) {
  const phaseColors = [
    'bg-amber-400 text-amber-950',
    'bg-purple-400 text-purple-950',
    'bg-teal-400 text-teal-950',
    'bg-pink-400 text-pink-950',
  ];

  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Phase number badge */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4',
          phaseColors[(phase - 1) % phaseColors.length]
        )}
      >
        {phase}
      </div>

      {/* Title and duration */}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <span className="text-sm text-muted-foreground mb-3">{duration}</span>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {description}
      </p>

      {/* Connector line (desktop only) */}
      {!isLast && (
        <div className="hidden lg:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-border" />
      )}
    </div>
  );
}

export function MethodologySection() {
  return (
    <section id="methodology" className="py-20 lg:py-32 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How We Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A proven methodology that ensures successful outcomes, every time.
          </p>
        </div>

        {/* Methodology steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {methodology.map((step, index) => (
            <MethodologyStep
              key={step.title}
              phase={step.phase}
              title={step.title}
              duration={step.duration}
              description={step.description}
              isLast={index === methodology.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
