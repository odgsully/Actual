'use client';

import Link from 'next/link';
import Image from 'next/image';
import { footerLinks, companyInfo } from '@/lib/marketing-data';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-subtle)] py-[60px] px-8 relative">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 lg:gap-12">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/assets/ga-logo-white.png"
              alt="Growth Advisory"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-display font-medium text-lg tracking-[-0.02em]">
              {companyInfo.name}
            </span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] max-w-[300px] leading-[1.7]">
            {companyInfo.tagline}
          </p>
        </div>

        {/* Services column */}
        <div>
          <h4 className="font-semibold text-[13px] tracking-[0.02em] text-[var(--text-secondary)] mb-4">
            Services
          </h4>
          <ul className="space-y-2.5 list-none">
            {footerLinks.services.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company column */}
        <div>
          <h4 className="font-semibold text-[13px] tracking-[0.02em] text-[var(--text-secondary)] mb-4">
            Company
          </h4>
          <ul className="space-y-2.5 list-none">
            {footerLinks.company.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[var(--text-tertiary)]">
        <span>&copy; {currentYear} {companyInfo.name}. All rights reserved.</span>
        <span>Built with intention.</span>
      </div>
    </footer>
  );
}
