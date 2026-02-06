'use client';

import { methodology } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface MethodologyStepProps {
  phase: number;
  title: string;
  duration: string;
  description: string;
  index: number;
}

function MethodologyStep({ phase, title, duration, description, index }: MethodologyStepProps) {
  return (
    <div className={cn('reveal relative z-10 text-center p-8 px-4', `reveal-delay-${index + 1}`)}>
      <div className="glass-card p-8 px-5">
        {/* Step number with gradient border */}
        <div className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-5">
          {/* Gradient border using pseudo-element via CSS mask */}
          <div
            className="absolute inset-[-1px] rounded-full p-px"
            style={{
              background: 'linear-gradient(135deg, var(--gold), var(--purple), var(--teal))',
              backgroundSize: '300% 300%',
              animation: 'gradient-shift 6s ease infinite',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          <span className="relative z-10 font-display font-medium text-lg">
            {String(phase).padStart(2, '0')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[22px] font-medium mb-1.5">
          {title}
        </h3>

        {/* Duration */}
        <p className="text-[13px] text-[var(--text-tertiary)] font-medium tracking-[0.02em] mb-3">
          {duration}
        </p>

        {/* Description */}
        <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] text-center">
          {description}
        </p>
      </div>
    </div>
  );
}

export function MethodologySection() {
  return (
    <section id="process" className="relative py-24 px-8 max-w-[1400px] mx-auto">
      {/* Section header */}
      <div className="text-center mb-16">
        <p className="reveal text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4 block">
          Our Process
        </p>
        <h2 className="reveal reveal-delay-1 font-display text-[clamp(32px,5vw,52px)] font-medium tracking-[-0.03em] leading-[1.15] mb-5 mx-auto">
          From discovery to <span className="accent-text-purple">continuous improvement</span>
        </h2>
        <p className="reveal reveal-delay-2 text-[17px] font-normal text-[var(--text-secondary)] leading-[1.75] max-w-[560px] mx-auto">
          A structured yet flexible methodology that adapts to your business tempo.
        </p>
      </div>

      {/* Process grid with connecting line */}
      <div className="relative">
        {/* Gradient connecting line (desktop only) */}
        <div
          className="hidden lg:block absolute top-1/2 left-[5%] right-[5%] h-0.5 -translate-y-1/2 z-0 opacity-40"
          style={{
            background: 'linear-gradient(90deg, var(--gold), var(--purple), var(--teal))',
            backgroundSize: '300% 300%',
            animation: 'gradient-shift 6s ease infinite',
          }}
        />

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-4">
          {methodology.map((step, index) => (
            <MethodologyStep
              key={step.title}
              phase={step.phase}
              title={step.title}
              duration={step.duration}
              description={step.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
