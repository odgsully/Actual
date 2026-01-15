import { Metadata } from 'next';
import {
  MarketingNav,
  HeroSection,
  PainPointsSection,
  ServicesSection,
  MethodologySection,
  TestimonialsSection,
  CTASection,
  MarketingFooter,
} from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Growth Advisory | AI-Driven Growth for SMBs',
  description:
    'Provide SMBs with bleeding edge tooling insights, as well as development of custom solutions for their edge cases to facilitate growth, empowering operator\'s domain expertise with AI.',
  openGraph: {
    title: 'Growth Advisory | AI-Driven Growth for SMBs',
    description:
      'Custom AI solutions, operations automation, and full-stack development for growing businesses.',
    type: 'website',
    url: 'https://growthadvisory.ai',
    siteName: 'Growth Advisory',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Growth Advisory | AI-Driven Growth for SMBs',
    description:
      'Custom AI solutions, operations automation, and full-stack development for growing businesses.',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <HeroSection />
        <PainPointsSection />
        <ServicesSection />
        <MethodologySection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
