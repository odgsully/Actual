'use client';

import { ReactNode } from 'react';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';
import { BackgroundOrbs } from './BackgroundOrbs';
import { Breadcrumbs } from './Breadcrumbs';

interface SubpageLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function SubpageLayout({ children, showBreadcrumbs = true }: SubpageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <BackgroundOrbs />

      {/* Navigation */}
      <MarketingNav />

      {/* Main content */}
      <main className="relative pt-32 pb-24">
        <div className="max-w-[1400px] mx-auto px-8">
          {showBreadcrumbs && <Breadcrumbs />}
          {children}
        </div>
      </main>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
