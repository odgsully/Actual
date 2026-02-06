'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Map of paths to readable labels
const pathLabels: Record<string, string> = {
  services: 'Services',
  'growth-academy': 'Growth Academy',
  'human-context-suites': 'Human Context Suites',
  'custom-scaffolding': 'Custom Scaffolding',
  'implementation-audit': 'Implementation Audit',
  'referral-wall': 'Referral Wall',
  resources: 'Resources',
  'case-studies': 'Case Studies',
  podcast: 'Podcast',
  newsletter: 'Newsletter',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Skip rendering on homepage
  if (pathname === '/') return null;

  // Generate breadcrumb items from path
  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', isLast: false },
    ...pathSegments.map((segment, index) => ({
      label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + pathSegments.slice(0, index + 1).join('/'),
      isLast: index === pathSegments.length - 1,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-[var(--text-tertiary)]" aria-hidden="true">
                /
              </span>
            )}
            {crumb.isLast ? (
              <span className="text-[var(--text-secondary)]" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-[var(--text-tertiary)] transition-colors duration-200',
                  'hover:text-[var(--text-secondary)]'
                )}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
