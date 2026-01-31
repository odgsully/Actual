'use client';

import { testimonials } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';
import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  company: string;
  role: string;
  index: number;
}

function TestimonialCard({ quote, name, company, role, index }: TestimonialCardProps) {
  const accentColors = [
    'border-l-amber-400',
    'border-l-purple-400',
    'border-l-teal-400',
  ];

  return (
    <div
      className={cn(
        'relative p-6 rounded-lg border border-border bg-card/30',
        'border-l-4',
        accentColors[index % accentColors.length]
      )}
    >
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-muted-foreground/30 mb-4" />

      {/* Quote text */}
      <p className="text-foreground leading-relaxed mb-6 italic">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Author info */}
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            {name.charAt(0)}
          </span>
        </div>

        <div>
          <p className="font-medium text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="about" className="py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What Clients Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real feedback from businesses we&apos;ve helped transform.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              quote={testimonial.quote}
              name={testimonial.name}
              company={testimonial.company}
              role={testimonial.role}
              index={index}
            />
          ))}
        </div>

        {/* Note about placeholders */}
        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          * Testimonials shown are representative examples
        </p>
      </div>
    </section>
  );
}
