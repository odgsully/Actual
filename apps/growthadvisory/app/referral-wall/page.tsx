'use client';

import { useState } from 'react';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { testimonials, Testimonial } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | 'ai' | 'operations' | 'development';

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'All',
  ai: 'AI Solutions',
  operations: 'Operations',
  development: 'Development',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'text-[var(--gold)]' : 'text-[var(--text-tertiary)]'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, size }: { testimonial: Testimonial; size: 'normal' | 'featured' }) {
  return (
    <div
      className={cn(
        'glass-card p-6 transition-all duration-300 hover:bg-[var(--bg-card-hover)]',
        size === 'featured' && 'md:col-span-2'
      )}
    >
      {/* Rating */}
      {testimonial.rating && (
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>
      )}

      {/* Quote */}
      <p className="font-display text-[17px] font-normal italic leading-[1.75] text-[var(--text-secondary)] mb-6">
        <span
          className="font-display text-[32px] font-normal not-italic leading-none relative top-2 mr-1"
          style={{
            background: 'var(--gradient-rainbow-wide)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          &ldquo;
        </span>
        {testimonial.quote}
      </p>

      {/* Outcome badge */}
      {testimonial.outcome && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--teal)]/10 border border-[var(--teal)]/20 text-xs font-medium text-[var(--teal)]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {testimonial.outcome}
          </span>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar with gradient background */}
        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-semibold text-sm text-[var(--background)]"
          style={{
            background: 'linear-gradient(135deg, var(--gold), var(--purple))',
          }}
        >
          {testimonial.initials}
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--text-primary)]">{testimonial.name}</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReferralWallPage() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  const filteredTestimonials = testimonials.filter(
    (t) => activeFilter === 'all' || t.category === activeFilter
  );

  // Separate featured and regular testimonials for masonry effect
  const featuredTestimonials = filteredTestimonials.filter((t) => t.featured);
  const regularTestimonials = filteredTestimonials.filter((t) => !t.featured);

  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="text-center mb-16">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          Client Stories
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          Wall of <span className="gradient-text-static">Love</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Don&apos;t take our word for it. Here&apos;s what our clients have to say about working with Growth Advisory.
        </p>
      </section>

      {/* Filter Tabs */}
      <section className="mb-12">
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(categoryLabels) as CategoryFilter[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                activeFilter === category
                  ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-medium)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-subtle)]'
              )}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      {/* Testimonials Masonry Grid */}
      <section className="mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured testimonials span 2 columns */}
          {featuredTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} size="featured" />
          ))}
          {/* Regular testimonials */}
          {regularTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} size="normal" />
          ))}
        </div>

        {filteredTestimonials.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)]">No testimonials in this category yet.</p>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center">
            <span className="text-4xl font-display font-medium gradient-text-static">50+</span>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Projects Completed</p>
          </div>
          <div className="glass-card p-6 text-center">
            <span className="text-4xl font-display font-medium gradient-text-static">100%</span>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Client Satisfaction</p>
          </div>
          <div className="glass-card p-6 text-center">
            <span className="text-4xl font-display font-medium gradient-text-static">4.9</span>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Average Rating</p>
          </div>
          <div className="glass-card p-6 text-center">
            <span className="text-4xl font-display font-medium gradient-text-static">85%</span>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Referral Rate</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 px-8 glass-card">
        <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
          Ready to become our next success story?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Join the companies that have transformed their operations with Growth Advisory.
        </p>
        <a
          href="https://calendar.notion.so/meet/gbsullivan/meet"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient"
        >
          Book a Discovery Call
        </a>
      </section>
    </SubpageLayout>
  );
}
