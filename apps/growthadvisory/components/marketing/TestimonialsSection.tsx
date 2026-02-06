'use client';

import { testimonials } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  quote: string;
  name: string;
  initials: string;
  company: string;
  role: string;
  index: number;
}

function TestimonialCard({ quote, name, initials, company, role, index }: TestimonialCardProps) {
  return (
    <div className={cn('reveal glass-card p-8', `reveal-delay-${index + 1}`)}>
      {/* Quote with large decorative quote mark */}
      <p className="font-display text-[17px] font-normal italic leading-[1.75] text-[var(--text-secondary)] mb-7">
        <span
          className="font-display text-[44px] font-normal not-italic leading-none relative top-3.5 mr-1"
          style={{
            background: 'var(--gradient-rainbow-wide)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient-shift 6s ease infinite',
          }}
        >
          &ldquo;
        </span>
        {quote}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar with gradient background */}
        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-semibold text-sm text-[var(--bg-primary)]"
          style={{
            background: 'linear-gradient(135deg, var(--gold), var(--purple))',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 6s ease infinite',
          }}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--text-primary)]">{name}</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="clients" className="relative py-24 px-8 max-w-[1400px] mx-auto">
      {/* Section header */}
      <div className="text-center mb-14">
        <p className="reveal text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4 block">
          Client Stories
        </p>
        <h2 className="reveal reveal-delay-1 font-display text-[clamp(32px,5vw,52px)] font-medium tracking-[-0.03em] leading-[1.15] mx-auto">
          Trusted by teams that <span className="accent-text-purple">refuse to settle</span>
        </h2>
      </div>

      {/* Testimonials grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.name}
            quote={testimonial.quote}
            name={testimonial.name}
            initials={testimonial.initials}
            company={testimonial.company}
            role={testimonial.role}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
