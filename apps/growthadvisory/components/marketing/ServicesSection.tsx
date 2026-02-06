'use client';

import { services } from '@/lib/marketing-data';
import { GradientBorderCard } from './GradientBorderCard';
import { cn } from '@/lib/utils';

// Custom SVG icons with unique gradient IDs to prevent conflicts
const ServiceIcon = ({ type, gradientId }: { type: string; gradientId: string }) => {
  const icons: Record<string, React.ReactNode> = {
    ai: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24"/>
            <stop offset="50%" stopColor="#A78BFA"/>
            <stop offset="100%" stopColor="#22D3EE"/>
          </linearGradient>
        </defs>
        <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22"/>
        <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"/>
        <path d="M8.56 13.68C5.27 14.67 3 16.65 3 19h18c0-2.35-2.27-4.33-5.56-5.32"/>
      </svg>
    ),
    workflow: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA"/>
            <stop offset="50%" stopColor="#22D3EE"/>
            <stop offset="100%" stopColor="#FBBF24"/>
          </linearGradient>
        </defs>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <path d="M7 8h2m4 0h4M7 12h10"/>
      </svg>
    ),
    code: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE"/>
            <stop offset="50%" stopColor="#FBBF24"/>
            <stop offset="100%" stopColor="#A78BFA"/>
          </linearGradient>
        </defs>
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        <line x1="14" y1="4" x2="10" y2="20"/>
      </svg>
    ),
  };

  return icons[type] || icons.ai;
};

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  index: number;
}

function ServiceCard({ icon, title, description, features, index }: ServiceCardProps) {
  const gradientId = `grad-${icon}-${index}`;

  return (
    <GradientBorderCard className={cn('reveal', `reveal-delay-${index + 1}`)}>
      {/* Icon */}
      <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center mb-6 border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]">
        <ServiceIcon type={icon} gradientId={gradientId} />
      </div>

      {/* Title */}
      <h3 className="font-display text-2xl font-medium tracking-[-0.02em] mb-4">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] mb-5">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {features.map((feature) => (
          <span key={feature} className="tag">
            {feature}
          </span>
        ))}
      </div>
    </GradientBorderCard>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="relative py-24 px-8 max-w-[1400px] mx-auto">
      {/* Section header */}
      <div className="mb-14">
        <p className="reveal text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          What We Do
        </p>
        <h2 className="reveal reveal-delay-1 font-display text-[clamp(32px,5vw,52px)] font-medium tracking-[-0.03em] leading-[1.15] mb-5">
          Services built for <span className="gradient-text-static">compounding impact</span>
        </h2>
        <p className="reveal reveal-delay-2 text-[17px] font-normal text-[var(--text-secondary)] leading-[1.75] max-w-[560px]">
          End-to-end solutions that integrate AI, operations, and custom development into a cohesive growth engine.
        </p>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <ServiceCard
            key={service.title}
            icon={service.icon}
            title={service.title}
            description={service.description}
            features={service.features}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
