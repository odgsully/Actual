import {
  MarketingNav,
  HeroSection,
  LogoCarousel,
  StatsSection,
  SectionDivider,
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
        <LogoCarousel />
        <StatsSection />
        <SectionDivider />
        <ServicesSection />
        <SectionDivider />
        <MethodologySection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
