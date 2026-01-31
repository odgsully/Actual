'use client';

import { heroContent } from '@/lib/marketing-data';
import { AnimatedGradientButton } from './AnimatedGradientButton';
import { BackgroundOrbs } from './BackgroundOrbs';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      <BackgroundOrbs />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
          {heroContent.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {heroContent.subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <AnimatedGradientButton
            href={heroContent.primaryCta.href}
            variant="primary"
            size="large"
            showArrow
          >
            {heroContent.primaryCta.text}
          </AnimatedGradientButton>

          <AnimatedGradientButton
            href={heroContent.secondaryCta.href}
            variant="secondary"
            size="large"
          >
            {heroContent.secondaryCta.text}
          </AnimatedGradientButton>
        </div>

        {/* Optional: Quick stats or social proof */}
        <div className="mt-16 pt-10 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by forward-thinking businesses
          </p>
          <div className="flex justify-center gap-8 text-muted-foreground/60">
            {/* Placeholder for future client logos */}
            <span className="text-xs uppercase tracking-wider">Client Logo</span>
            <span className="text-xs uppercase tracking-wider">Client Logo</span>
            <span className="text-xs uppercase tracking-wider">Client Logo</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
}
