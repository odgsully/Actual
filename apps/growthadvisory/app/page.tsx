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
