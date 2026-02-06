'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { cn } from '@/lib/utils';

export default function CaseStudiesPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service
    setIsSubmitted(true);
  };

  const upcomingCaseStudies = [
    {
      title: 'TechStart: 20 Hours Saved Weekly',
      category: 'AI Solutions',
      teaser: 'How we automated repetitive workflows and gave the team their time back.',
    },
    {
      title: 'ScaleUp: 40% Forecasting Improvement',
      category: 'AI Solutions',
      teaser: 'Building predictive models that transformed sales planning.',
    },
    {
      title: 'Nexus Solutions: CRM Overhaul',
      category: 'Operations',
      teaser: 'From data chaos to pipeline clarity in 8 weeks.',
    },
    {
      title: 'Evergreen Retail: $50K Savings Found',
      category: 'Implementation Audit',
      teaser: 'The diagnostic that paid for itself 10x over.',
    },
  ];

  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="text-center mb-16">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          Resources
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          Case <span className="gradient-text-static">Studies</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Detailed breakdowns of how we&apos;ve helped clients transform their operations.
        </p>
      </section>

      {/* Coming Soon Section */}
      <section className="mb-16">
        <div className="glass-card p-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-sm font-medium text-[var(--gold)] mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </div>
          <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            In-depth case studies launching Q1 2026
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
            We&apos;re putting the finishing touches on detailed breakdowns of our most impactful projects.
            Be the first to know when they&apos;re ready.
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl',
                  'bg-[var(--bg-card)] border border-[var(--border-subtle)]',
                  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--border-medium)]',
                  'transition-colors duration-200'
                )}
              />
              <button type="submit" className="btn-gradient whitespace-nowrap">
                Notify Me
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[var(--teal)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">You&apos;re on the list! We&apos;ll email you when case studies launch.</span>
            </div>
          )}
        </div>
      </section>

      {/* Preview Grid */}
      <section className="mb-24">
        <h3 className="font-display text-2xl font-medium text-center mb-8">
          What&apos;s coming
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {upcomingCaseStudies.map((study) => (
            <div key={study.title} className="glass-card p-6 opacity-75">
              <span className="text-xs font-medium text-[var(--purple)] mb-2 block">
                {study.category}
              </span>
              <h4 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {study.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {study.teaser}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 px-8 glass-card">
        <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
          Want to be featured?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          We&apos;re always looking for great projects to showcase. If you&apos;re interested in working together,
          let&apos;s talk.
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
