import { Metadata } from 'next';
import Link from 'next/link';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { GradientBorderCard } from '@/components/marketing/GradientBorderCard';
import { companyInfo } from '@/lib/marketing-data';

export const metadata: Metadata = {
  title: 'Human Context Suites | AI + Human Workflows | Growth Advisory',
  description:
    'AI workflow integration that keeps humans in the loop. Custom prompt libraries, review workflows, and intelligent automation with human oversight.',
  openGraph: {
    title: 'Human Context Suites | Growth Advisory',
    description: 'AI workflow integration that keeps humans in the loop.',
    url: 'https://growthadvisory.ai/services/human-context-suites',
  },
  alternates: {
    canonical: 'https://growthadvisory.ai/services/human-context-suites',
  },
};

const features = [
  {
    title: 'Custom Prompt Libraries',
    description:
      'Pre-built prompts tailored to your business context. Your team gets consistent, high-quality AI outputs without starting from scratch every time.',
    icon: '01',
  },
  {
    title: 'Human Review Workflows',
    description:
      'AI handles the heavy lifting, but humans make the final call. Approval flows, quality checkpoints, and override mechanisms built in.',
    icon: '02',
  },
  {
    title: 'Context Preservation',
    description:
      'Your AI tools understand your business. We embed company knowledge, brand voice, and domain expertise into every interaction.',
    icon: '03',
  },
  {
    title: 'Escalation Protocols',
    description:
      'When AI isn\'t confident or hits edge cases, it knows to escalate to humans. No more silent failures.',
    icon: '04',
  },
];

const useCases = [
  {
    title: 'Content Generation',
    description: 'AI drafts, humans refine. Marketing copy, emails, reports — all in your brand voice.',
  },
  {
    title: 'Customer Support',
    description: 'AI handles routine queries, escalates complex issues. Customers get fast answers, agents focus on what matters.',
  },
  {
    title: 'Data Analysis',
    description: 'AI surfaces insights, humans interpret and act. Turn raw data into decisions faster.',
  },
  {
    title: 'Document Processing',
    description: 'AI extracts and organizes, humans verify and approve. Contracts, invoices, applications — processed in minutes.',
  },
];

const processSteps = [
  {
    phase: 'Discovery',
    duration: 'Week 1',
    description: 'Map your current workflows and identify where AI can add value while preserving human oversight.',
  },
  {
    phase: 'Design',
    duration: 'Week 2-3',
    description: 'Architect the human-AI collaboration model. Define handoff points, approval flows, and escalation triggers.',
  },
  {
    phase: 'Build',
    duration: 'Weeks 4-8',
    description: 'Develop custom prompts, integrate tools, and build review interfaces tailored to your team.',
  },
  {
    phase: 'Calibrate',
    duration: 'Ongoing',
    description: 'Monitor AI outputs, refine prompts, and optimize the human-AI balance based on real-world performance.',
  },
];

const idealClients = [
  'Teams processing high volumes of repetitive content',
  'Organizations that can\'t fully automate due to quality requirements',
  'Leaders who want AI efficiency without sacrificing human judgment',
  'Companies in regulated industries needing human accountability',
];

export default function HumanContextSuitesPage() {
  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="mb-24">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          AI + Human Workflows
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          AI that amplifies humans,{' '}
          <span className="gradient-text-static">not replaces them</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          The best AI implementations keep humans in the loop. Human Context Suites
          combine AI efficiency with human judgment for workflows that actually work.
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
          <Link href="#use-cases" className="btn-ghost">
            See Use Cases
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-6">
              The <span className="accent-text-gold">AI dilemma</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Full automation sounds great until AI makes a mistake that costs you a client.
              Full manual work sounds safe until you realize you can&apos;t scale.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The answer isn&apos;t choosing between AI and humans — it&apos;s designing workflows
              where each does what they do best. AI handles speed and scale. Humans handle judgment
              and nuance.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">80%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Work handled by AI</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">20%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Requires human judgment</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">100%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Accountability retained</p>
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
            Every Human Context Suite is custom-designed for your specific workflows and requirements.
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

      {/* Use Cases Section */}
      <section id="use-cases" className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            Common <span className="accent-text-teal">applications</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="glass-card p-6">
              <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            How we <span className="accent-text-gold">build it</span>
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
              Is this <span className="accent-text-purple">for you?</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Human Context Suites work best for teams that need to scale without sacrificing quality.
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
          Ready to build your Human Context Suite?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Let&apos;s discuss how AI and human collaboration can transform your workflows.
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
          <Link href="/services/custom-scaffolding" className="btn-ghost">
            Explore Custom Scaffolding
          </Link>
        </div>
      </section>
    </SubpageLayout>
  );
}
