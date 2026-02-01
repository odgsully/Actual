'use client';

import { companyInfo } from '@/lib/marketing-data';
import { AnimatedGradientButton } from './AnimatedGradientButton';
import { Calendar } from 'lucide-react';

export function CTASection() {
  return (
    <section id="contact" className="py-20 lg:py-32 bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-400/5 via-purple-500/5 to-teal-400/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-6" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Let&apos;s discuss how we can help you leverage AI and automation to unlock your next phase of growth.
          </p>

          <AnimatedGradientButton
            href={companyInfo.bookingUrl}
            variant="primary"
            size="large"
            showArrow
          >
            Schedule Your Free Consultation
          </AnimatedGradientButton>

          {/* Additional contact info */}
          <p className="mt-8 text-sm text-muted-foreground">
            Or email us directly at{' '}
            <a
              href={`mailto:${companyInfo.email}`}
              className="text-foreground hover:underline"
            >
              {companyInfo.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
