'use client';

import { services } from '@/lib/marketing-data';
import { Brain, Workflow, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  brain: Brain,
  workflow: Workflow,
  code: Code,
};

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  index: number;
}

function ServiceCard({ icon, title, description, features, index }: ServiceCardProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Brain;

  const accentColors = [
    'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'text-teal-400 bg-teal-400/10 border-teal-400/20',
  ];

  return (
    <div
      className={cn(
        'relative p-6 rounded-lg border border-border bg-card/30',
        'hover:bg-card/60 transition-all duration-300',
        'hover:border-border/80 hover:-translate-y-1',
        'flex flex-col h-full'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4 border',
          accentColors[index % accentColors.length]
        )}
      >
        <IconComponent className="w-6 h-6" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>

      {/* Features */}
      <ul className="mt-auto space-y-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="text-foreground mt-1">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What We Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We combine deep technical expertise with business acumen to deliver solutions that actually work.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </section>
  );
}
