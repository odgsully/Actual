import { Metadata } from 'next';
import Link from 'next/link';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { GradientBorderCard } from '@/components/marketing/GradientBorderCard';
import { companyInfo } from '@/lib/marketing-data';

export const metadata: Metadata = {
  title: 'Implementation Audit | Diagnostic Review | Growth Advisory',
  description:
    'Comprehensive diagnostic review of your tech stack. Gap analysis, performance audit, and actionable recommendations for optimization.',
  openGraph: {
    title: 'Implementation Audit | Growth Advisory',
    description: 'Comprehensive diagnostic review of your tech stack.',
    url: 'https://growthadvisory.ai/services/implementation-audit',
  },
  alternates: {
    canonical: 'https://growthadvisory.ai/services/implementation-audit',
  },
};

const auditAreas = [
  {
    title: 'Tool Utilization',
    description:
      'Are you getting value from your software investments? We measure actual usage against capabilities and identify waste.',
    icon: '01',
  },
  {
    title: 'Data Quality',
    description:
      'Bad data costs more than you think. We audit data integrity, identify duplicates, and find gaps in your records.',
    icon: '02',
  },
  {
    title: 'Process Efficiency',
    description:
      'Map your workflows and find the bottlenecks. Where are tasks getting stuck? What manual work could be automated?',
    icon: '03',
  },
  {
    title: 'Integration Health',
    description:
      'Your tools should work together. We test every integration, identify sync failures, and map data flows.',
    icon: '04',
  },
];

const deliverables = [
  {
    title: 'Executive Summary',
    description: 'One-page overview for leadership. Key findings, risk areas, and recommended priorities.',
  },
  {
    title: 'Technical Report',
    description: 'Detailed findings with evidence. Screenshots, data analysis, and specific examples.',
  },
  {
    title: 'Opportunity Matrix',
    description: 'Every issue ranked by impact and effort. Know exactly where to focus first.',
  },
  {
    title: 'Roadmap Options',
    description: 'Three paths forward: quick wins, medium-term improvements, and long-term transformation.',
  },
];

const processSteps = [
  {
    phase: 'Kickoff',
    duration: 'Day 1',
    description: 'Align on scope and grant system access. We define exactly what we\'re auditing.',
  },
  {
    phase: 'Discovery',
    duration: 'Days 2-5',
    description: 'Deep dive into your systems. Tool inventory, data analysis, workflow mapping.',
  },
  {
    phase: 'Analysis',
    duration: 'Days 6-8',
    description: 'Process findings and develop recommendations. Build the opportunity matrix.',
  },
  {
    phase: 'Delivery',
    duration: 'Day 9-10',
    description: 'Present findings to your team. Walk through the report and answer questions.',
  },
];

const commonFindings = [
  'Unused features in existing tools',
  'Data sync failures causing discrepancies',
  'Manual processes that should be automated',
  'Security gaps and permission issues',
  'Duplicate records and data quality issues',
  'Bottlenecks in approval workflows',
];

const idealClients = [
  'Companies that have inherited legacy systems',
  'Teams that haven\'t audited their stack in 12+ months',
  'Leaders who suspect they\'re not getting full value from their tools',
  'Organizations preparing for a major system change',
];

export default function ImplementationAuditPage() {
  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="mb-24">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          Diagnostic Review
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          Know exactly where{' '}
          <span className="gradient-text-static">you&apos;re losing value</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          Before you build anything new, understand what you have. The Implementation Audit
          reveals hidden costs, missed opportunities, and the fastest paths to improvement.
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
              The <span className="accent-text-gold">unknown unknowns</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Most teams know something isn&apos;t working, but they don&apos;t know exactly what —
              or how much it&apos;s costing them. They see symptoms: slow processes, frustrated
              users, data that doesn&apos;t match up.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              An audit turns gut feelings into evidence. You&apos;ll know exactly what&apos;s broken,
              what it&apos;s costing you, and what to fix first.
            </p>
          </div>
          <div className="glass-card p-8">
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-4">
              Common findings
            </h3>
            <ul className="space-y-3">
              {commonFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-sm text-[var(--text-secondary)]">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Audit Areas Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            What we <span className="accent-text-purple">audit</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Every audit covers these core areas, plus any specific concerns you want us to investigate.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {auditAreas.map((area) => (
            <GradientBorderCard key={area.title}>
              <div className="flex gap-4">
                <span className="text-2xl font-display font-medium text-[var(--text-tertiary)]">
                  {area.icon}
                </span>
                <div>
                  <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                    {area.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {area.description}
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
            What you <span className="accent-text-teal">receive</span>
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

      {/* Process Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            10-day <span className="accent-text-gold">turnaround</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            From kickoff to final presentation, the audit takes 10 business days.
          </p>
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
              Is this <span className="accent-text-purple">for you?</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              The Implementation Audit is the perfect starting point if you&apos;re not sure where to begin.
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
          Ready to see what you&apos;re missing?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Book a free discovery call to scope your audit and discuss what we&apos;ll examine.
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
          <Link href="/services/growth-academy" className="btn-ghost">
            Explore Growth Academy
          </Link>
        </div>
      </section>
    </SubpageLayout>
  );
}
