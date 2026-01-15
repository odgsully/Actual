'use client';

import Link from 'next/link';
import { footerLinks, companyInfo } from '@/lib/marketing-data';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company info */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-foreground mb-4">{companyInfo.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {companyInfo.tagline}
            </p>
            <a
              href={`mailto:${companyInfo.email}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {companyInfo.email}
            </a>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} {companyInfo.name}. All rights reserved.
            </p>

            {/* Dashboard link (subtle) */}
            <Link
              href="/private/gs-site"
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
