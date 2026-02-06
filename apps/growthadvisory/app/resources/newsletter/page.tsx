'use client';

import { useState } from 'react';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { cn } from '@/lib/utils';

const benefits = [
  {
    title: 'Weekly AI Tool Reviews',
    description: 'Honest breakdowns of the latest AI tools. What works, what doesn\'t, and what\'s worth your time.',
  },
  {
    title: 'Operations Playbooks',
    description: 'Step-by-step guides for common operational challenges. Steal our frameworks.',
  },
  {
    title: 'Industry Trends',
    description: 'What\'s coming next in AI and automation — and how to prepare your business.',
  },
  {
    title: 'Client Insights',
    description: 'Anonymous lessons from real engagements. Learn from others\' wins and mistakes.',
  },
];

const testimonials = [
  {
    quote: 'The only newsletter I actually read every week. Practical, no fluff.',
    author: 'Operations Manager, SaaS Startup',
  },
  {
    quote: 'Saved us from a bad tool purchase based on one of their reviews. Worth it.',
    author: 'CTO, E-commerce Company',
  },
];

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service (ConvertKit, Mailchimp, etc.)
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
          The Growth <span className="gradient-text-static">Newsletter</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Weekly insights on AI, automation, and scaling your business — delivered straight to your inbox.
        </p>
      </section>

      {/* Signup Form */}
      <section className="mb-24">
        <div className="glass-card p-8 md:p-12 max-w-2xl mx-auto">
          {!isSubmitted ? (
            <>
              <h2 className="font-display text-2xl font-medium text-center mb-6">
                Join 1,000+ operators getting smarter every week
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Garrett"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'bg-[var(--bg-card)] border border-[var(--border-subtle)]',
                        'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                        'focus:outline-none focus:border-[var(--border-medium)]',
                        'transition-colors duration-200'
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Email Address <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="garrett@company.com"
                      required
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'bg-[var(--bg-card)] border border-[var(--border-subtle)]',
                        'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                        'focus:outline-none focus:border-[var(--border-medium)]',
                        'transition-colors duration-200'
                      )}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-gradient w-full justify-center">
                  Subscribe — It&apos;s Free
                </button>
                <p className="text-xs text-center text-[var(--text-tertiary)]">
                  No spam. Unsubscribe anytime. We respect your inbox.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--teal)]/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-medium text-[var(--text-primary)] mb-2">
                You&apos;re subscribed!
              </h3>
              <p className="text-[var(--text-secondary)]">
                Check your inbox for a welcome email. See you next week.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* What You Get */}
      <section className="mb-24">
        <h3 className="font-display text-2xl font-medium text-center mb-8">
          What you&apos;ll get every week
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="glass-card p-6">
              <h4 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {benefit.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="glass-card p-6">
              <p className="font-display text-lg italic text-[var(--text-secondary)] mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Preview */}
      <section className="mb-24">
        <div className="glass-card p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--border-subtle)]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--purple)]" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">The Growth Newsletter</p>
              <p className="text-sm text-[var(--text-tertiary)]">Issue #47 — This Week in AI Tools</p>
            </div>
          </div>
          <div className="space-y-4 text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Hey there,</p>
            <p>
              This week we tested 5 new AI writing tools that claim to be &ldquo;better than ChatGPT.&rdquo;
              Spoiler: only one came close. Here&apos;s the full breakdown...
            </p>
            <p className="text-sm text-[var(--text-tertiary)] italic">
              [Preview truncated — subscribe to read the full issue]
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 px-8 glass-card">
        <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
          Ready for more than a newsletter?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          If you&apos;re ready to transform your operations, let&apos;s talk about how we can help.
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
