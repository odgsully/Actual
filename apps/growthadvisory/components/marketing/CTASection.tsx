'use client';

import { companyInfo } from '@/lib/marketing-data';
import { BackgroundOrbs } from './BackgroundOrbs';

export function CTASection() {
  return (
    <section id="contact" className="relative py-24 px-8 max-w-[1400px] mx-auto text-center overflow-hidden">
      {/* Aurora background */}
      <BackgroundOrbs variant="cta" />

      {/* Content */}
      <div className="relative z-10">
        <p className="reveal text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4 block text-center">
          Let&apos;s Talk
        </p>

        <h2 className="reveal reveal-delay-1 font-display text-[clamp(34px,5vw,56px)] font-normal tracking-[-0.03em] leading-[1.12] mb-6 max-w-[620px] mx-auto">
          Ready to build your <span className="gradient-text-static">unfair advantage</span>?
        </h2>

        <p className="reveal reveal-delay-2 text-[17px] font-normal text-[var(--text-secondary)] leading-[1.75] max-w-[560px] mx-auto mb-10 text-center">
          Book a free discovery call. No pitch decks, no pressure — just an honest conversation about what&apos;s possible.
        </p>

        <div className="reveal reveal-delay-3 flex justify-center">
          <a
            href={companyInfo.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient group"
          >
            Book a Discovery Call
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>

        <p className="reveal reveal-delay-4 text-[15px] text-[var(--text-tertiary)] mt-6">
          Or reach out at{' '}
          <a
            href={`mailto:${companyInfo.email}`}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
          >
            {companyInfo.email}
          </a>
        </p>
      </div>
    </section>
  );
}
