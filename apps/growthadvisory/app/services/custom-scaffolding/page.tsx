import { Metadata } from 'next';
import Link from 'next/link';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { GradientBorderCard } from '@/components/marketing/GradientBorderCard';
import { companyInfo } from '@/lib/marketing-data';

export const metadata: Metadata = {
  title: 'Custom Scaffolding | System Architecture | Growth Advisory',
  description:
    'Tailored system architecture and infrastructure for growing businesses. CRM setup, data pipelines, API integrations, and custom tools built for scale.',
  openGraph: {
    title: 'Custom Scaffolding | Growth Advisory',
    description: 'Tailored system architecture for growing businesses.',
    url: 'https://growthadvisory.ai/services/custom-scaffolding',
  },
  alternates: {
    canonical: 'https://growthadvisory.ai/services/custom-scaffolding',
  },
};

const features = [
  {
    title: 'CRM Architecture',
    description:
      'Clean data models, custom fields, automation rules, and integrations that turn your CRM from a contact list into a revenue engine.',
    icon: '01',
  },
  {
    title: 'Data Pipelines',
    description:
      'Connect your tools and let data flow. No more manual exports or copy-paste between systems. Real-time sync across your stack.',
    icon: '02',
  },
  {
    title: 'API Integrations',
    description:
      'Custom integrations between any tools in your ecosystem. If it has an API, we can connect it.',
    icon: '03',
  },
  {
    title: 'Internal Tools',
    description:
      'Sometimes off-the-shelf software doesn\'t cut it. We build custom dashboards, admin panels, and utilities tailored to your needs.',
    icon: '04',
  },
];

const deliverables = [
  {
    title: 'Architecture Documentation',
    description: 'Complete technical specs and system diagrams. Your team can understand and maintain what we build.',
  },
  {
    title: 'Staging Environment',
    description: 'Test everything before it touches production. Safe space to iterate and validate.',
  },
  {
    title: 'Migration Scripts',
    description: 'Moving from legacy systems? We handle data migration with zero downtime.',
  },
  {
    title: 'Monitoring & Alerts',
    description: 'Know when something breaks before your customers do. Proactive observability built in.',
  },
];

const processSteps = [
  {
    phase: 'Audit',
    duration: 'Week 1',
    description: 'Deep dive into your current infrastructure. What\'s working, what\'s broken, what\'s missing.',
  },
  {
    phase: 'Architecture',
    duration: 'Week 2-3',
    description: 'Design the target state. System diagrams, data flows, and technical specifications.',
  },
  {
    phase: 'Build',
    duration: 'Weeks 4-12',
    description: 'Iterative development with weekly deployments. You see progress in real-time.',
  },
  {
    phase: 'Stabilize',
    duration: 'Ongoing',
    description: 'Monitor, optimize, and maintain. Continuous improvement as your business evolves.',
  },
];

const techStack = [
  'Salesforce / HubSpot / Pipedrive',
  'Zapier / Make / n8n',
  'Supabase / Firebase / PostgreSQL',
  'Next.js / React / TypeScript',
  'Vercel / AWS / GCP',
  'OpenAI / Claude / Langchain',
];

const idealClients = [
  'Companies outgrowing their current systems',
  'Teams with data scattered across 5+ tools',
  'Organizations planning for 2-3x growth',
  'Leaders tired of duct-tape solutions that keep breaking',
];

export default function CustomScaffoldingPage() {
  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="mb-24">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          System Architecture
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          Infrastructure that{' '}
          <span className="gradient-text-static">scales with you</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          Stop building on top of systems that weren&apos;t designed for your growth.
          Custom Scaffolding creates the foundation your business needs to scale.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={companyInfo.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient"
          >
            Book a Discovery Call
          </a>
          <Link href="#deliverables" className="btn-ghost">
            See Deliverables
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-6">
              The <span className="accent-text-gold">cost of fragmentation</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Every growing business hits the same wall: tools that don&apos;t talk to each other,
              data that lives in silos, and manual processes that eat hours every week.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The quick fixes that got you here — spreadsheet exports, manual data entry,
              &quot;we&apos;ll fix it later&quot; workarounds — are now slowing you down.
              It&apos;s time for infrastructure that actually works.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">30%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Revenue lost to fragmented systems</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">15h</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Avg. weekly hours wasted on manual work</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">6mo</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Time to see ROI on proper infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            What we <span className="accent-text-purple">build</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Every project is scoped to your specific needs. Here&apos;s what we commonly deliver.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <GradientBorderCard key={feature.title}>
              <div className="flex gap-4">
                <span className="text-2xl font-display font-medium text-[var(--text-tertiary)]">
                  {feature.icon}
                </span>
                <div>
                  <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GradientBorderCard>
          ))}
        </div>
      </section>

      {/* Deliverables Section */}
      <section id="deliverables" className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            What you <span className="accent-text-teal">get</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {deliverables.map((item) => (
            <div key={item.title} className="glass-card p-6">
              <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            Technologies we <span className="accent-text-gold">work with</span>
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((tech) => (
            <span key={tech} className="tag">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            How we <span className="accent-text-purple">work</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {processSteps.map((step, index) => (
            <div key={step.phase} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-card-hover)] text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">{step.duration}</span>
              </div>
              <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {step.phase}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ideal Client Section */}
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-6">
              Is this <span className="accent-text-teal">for you?</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Custom Scaffolding is built for teams ready to invest in infrastructure that pays dividends for years.
            </p>
          </div>
          <div className="glass-card p-8">
            <ul className="space-y-4">
              {idealClients.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--teal)] flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 px-8 glass-card">
        <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
          Ready to build infrastructure that scales?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Let&apos;s discuss your current systems and design the foundation for your next phase of growth.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={companyInfo.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient"
          >
            Book a Discovery Call
          </a>
          <Link href="/services/implementation-audit" className="btn-ghost">
            Start with an Audit
          </Link>
        </div>
      </section>
    </SubpageLayout>
  );
}
