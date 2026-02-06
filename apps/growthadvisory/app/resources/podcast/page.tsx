'use client';

import { useState } from 'react';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { cn } from '@/lib/utils';

const upcomingTopics = [
  {
    title: 'AI Tools That Actually Work',
    description: 'Cutting through the hype to find tools that deliver real value for SMBs.',
  },
  {
    title: 'The CRM Setup Nobody Teaches',
    description: 'Why most CRM implementations fail and how to avoid the common pitfalls.',
  },
  {
    title: 'Automation Without the Chaos',
    description: 'Building systems that scale without creating technical debt.',
  },
  {
    title: 'From Data Mess to Data Gold',
    description: 'Practical strategies for cleaning up years of bad data.',
  },
  {
    title: 'When to Build vs. Buy',
    description: 'Framework for deciding between custom solutions and off-the-shelf tools.',
  },
  {
    title: 'RevOps for the Rest of Us',
    description: 'Revenue operations strategies that work without a dedicated team.',
  },
];

export default function PodcastPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service
    setIsSubmitted(true);
  };

  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="text-center mb-16">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          Resources
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          The Growth <span className="gradient-text-static">Podcast</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Actionable insights on AI, operations, and scaling your business — delivered weekly.
        </p>
      </section>

      {/* Coming Soon Section */}
      <section className="mb-16">
        <div className="glass-card p-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 border border-[var(--purple)]/20 text-sm font-medium text-[var(--purple)] mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Launching Q2 2026
          </div>
          <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            We&apos;re warming up the mics
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
            Subscribe now to get notified when we launch — plus early access to the first episodes
            before they go public.
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
                Get Early Access
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[var(--teal)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">You&apos;re in! We&apos;ll send you early access when we launch.</span>
            </div>
          )}
        </div>
      </section>

      {/* Topics Preview */}
      <section className="mb-24">
        <h3 className="font-display text-2xl font-medium text-center mb-8">
          Topics we&apos;ll cover
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingTopics.map((topic) => (
            <div key={topic.title} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">Coming Soon</span>
              </div>
              <h4 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {topic.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {topic.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Host Section */}
      <section className="mb-24">
        <div className="glass-card p-8 md:p-12 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-display font-medium text-[var(--background)]"
              style={{
                background: 'linear-gradient(135deg, var(--gold), var(--purple))',
              }}
            >
              GS
            </div>
            <div>
              <h3 className="font-display text-xl font-medium text-[var(--text-primary)] mb-2">
                Your Host
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Garrett Sullivan is the founder of Growth Advisory and has spent a decade helping
                SMBs build intelligent systems. Each episode features practical insights from real
                client engagements — no fluff, just actionable strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 px-8 glass-card">
        <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
          Can&apos;t wait for the podcast?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Get personalized insights for your business right now.
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
