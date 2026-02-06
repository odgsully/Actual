import { Metadata } from 'next';
import Link from 'next/link';
import { SubpageLayout } from '@/components/marketing/SubpageLayout';
import { GradientBorderCard } from '@/components/marketing/GradientBorderCard';
import { companyInfo } from '@/lib/marketing-data';

export const metadata: Metadata = {
  title: 'Growth Academy | Training & Enablement | Growth Advisory',
  description:
    'AI and automation training programs for teams. Maximize ROI on your existing tools through hands-on workshops and enablement programs.',
  openGraph: {
    title: 'Growth Academy | Growth Advisory',
    description: 'AI and automation training programs for teams.',
    url: 'https://growthadvisory.ai/services/growth-academy',
  },
  alternates: {
    canonical: 'https://growthadvisory.ai/services/growth-academy',
  },
};

const features = [
  {
    title: 'Tool Mastery Workshops',
    description:
      'Hands-on sessions that take your team from basic users to power users. CRM, automation platforms, AI tools — we cover it all.',
    icon: '01',
  },
  {
    title: 'AI Prompt Engineering',
    description:
      'Learn to write prompts that get results. From ChatGPT to Claude to internal tools, we teach the principles that transfer across platforms.',
    icon: '02',
  },
  {
    title: 'Custom Playbooks',
    description:
      'Walk away with documented workflows tailored to your team. Standard operating procedures that stick.',
    icon: '03',
  },
  {
    title: 'Ongoing Office Hours',
    description:
      'Monthly group sessions where your team can ask questions, troubleshoot issues, and learn new techniques.',
    icon: '04',
  },
];

const processSteps = [
  {
    phase: 'Assessment',
    duration: 'Week 1',
    description: 'We audit your current tool stack and team capabilities to identify the biggest opportunities.',
  },
  {
    phase: 'Curriculum Design',
    duration: 'Week 2',
    description: 'Build a custom training program based on your tools, workflows, and skill gaps.',
  },
  {
    phase: 'Delivery',
    duration: 'Weeks 3-6',
    description: 'Interactive workshops with hands-on exercises using your actual data and processes.',
  },
  {
    phase: 'Reinforcement',
    duration: 'Ongoing',
    description: 'Office hours, Slack support, and refresher sessions to ensure the training sticks.',
  },
];

const idealClients = [
  'Teams using less than 30% of their software capabilities',
  'Companies that have invested in tools but haven\'t seen ROI',
  'Leaders who want their team to work smarter, not harder',
  'Organizations transitioning to AI-assisted workflows',
];

export default function GrowthAcademyPage() {
  return (
    <SubpageLayout>
      {/* Hero Section */}
      <section className="mb-24">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-4">
          Training & Enablement
        </p>
        <h1 className="font-display text-[clamp(40px,6vw,64px)] font-medium tracking-[-0.03em] leading-[1.1] mb-6">
          Unlock the full potential of{' '}
          <span className="gradient-text-static">your tech stack</span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          Your team has powerful tools — but are they using them to their full potential?
          Growth Academy closes the gap between software investment and real-world results.
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
          <Link href="#process" className="btn-ghost">
            See the Process
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-6">
              The <span className="accent-text-gold">hidden cost</span> of untapped potential
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Most teams utilize only 15-20% of their software capabilities. That means
              80% of your tech investment is sitting unused while your team works harder
              than they need to.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The problem isn&apos;t the tools — it&apos;s the training. Generic onboarding
              videos don&apos;t cut it. Your team needs hands-on guidance tailored to how
              <em> you</em> work.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">15-20%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Average software utilization</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">4x</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Productivity gain with proper training</p>
              </div>
              <div className="h-px bg-[var(--border-subtle)]" />
              <div>
                <span className="text-4xl font-display font-medium gradient-text-static">90%</span>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Of teams see ROI within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            What you&apos;ll <span className="accent-text-purple">master</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Our training programs are designed around your specific tools, workflows, and business goals.
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

      {/* Process Section */}
      <section id="process" className="mb-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-medium tracking-[-0.02em] leading-[1.2] mb-4">
            How it <span className="accent-text-teal">works</span>
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
              Is this <span className="accent-text-gold">for you?</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Growth Academy is designed for teams that are ready to stop leaving value on the table.
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
          Ready to unlock your team&apos;s potential?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Schedule a free discovery call to discuss your training needs and see if Growth Academy is right for you.
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
          <Link href="/services/human-context-suites" className="btn-ghost">
            Explore Human Context Suites
          </Link>
        </div>
      </section>
    </SubpageLayout>
  );
}
