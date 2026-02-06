'use client';

import { heroContent } from '@/lib/marketing-data';
import { BackgroundOrbs } from './BackgroundOrbs';
import { useScrollRevealAll } from '@/hooks/useScrollReveal';

export function HeroSection() {
  // Initialize scroll reveal for all .reveal elements
  useScrollRevealAll();

  // Split headline to insert gradient text for "intelligent"
  const headlineParts = heroContent.headline.split(heroContent.highlightWord);

  return (
    <section className="relative min-h-[85vh] flex items-center pt-20 pb-10 overflow-hidden">
      {/* Aurora background */}
      <BackgroundOrbs variant="hero" />

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8">
        {/* Eyebrow pill */}
        <div className="reveal inline-flex items-center gap-2 py-2 px-5 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-xs font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-glow" />
          {heroContent.eyebrow}
        </div>

        {/* Title */}
        <h1 className="reveal reveal-delay-1 font-display text-[clamp(42px,7vw,76px)] font-normal tracking-[-0.04em] leading-[1.08] mb-5 max-w-[900px]">
          {headlineParts[0]}
          <em className="gradient-text italic">{heroContent.highlightWord}</em>
          {headlineParts[1]}
        </h1>

        {/* Subtitle */}
        <p className="reveal reveal-delay-2 text-[clamp(16px,2vw,19px)] font-normal text-[var(--text-secondary)] leading-[1.7] max-w-[650px] mb-10">
          {heroContent.subheadline}
        </p>

        {/* CTAs */}
        <div className="reveal reveal-delay-3 flex items-center gap-4 flex-wrap">
          <a
            href={heroContent.primaryCta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient group"
          >
            {heroContent.primaryCta.text}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
          <a href={heroContent.secondaryCta.href} className="btn-ghost">
            {heroContent.secondaryCta.text}
          </a>
        </div>
      </div>
    </section>
  );
}
