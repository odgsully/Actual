'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface MobileNavAccordionProps {
  navLinks: NavLink[];
  onLinkClick: () => void;
}

interface AccordionItemProps {
  navLink: NavLink;
  isExpanded: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
}

function AccordionItem({ navLink, isExpanded, onToggle, onLinkClick }: AccordionItemProps) {
  const pathname = usePathname();

  // Check if current path is within this item's children
  const isActive = navLink.children?.some((child) => pathname === child.href) || pathname === navLink.href;

  if (!navLink.hasDropdown || !navLink.children) {
    // Simple link
    return (
      <Link
        href={navLink.href}
        className={cn(
          'font-display text-[28px] font-medium transition-colors duration-300',
          isActive
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        )}
        onClick={onLinkClick}
      >
        {navLink.label}
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Accordion trigger */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 font-display text-[28px] font-medium transition-colors duration-300',
          isActive || isExpanded
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)]'
        )}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {navLink.label}
        {/* Chevron */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className={cn(
            'transition-transform duration-300 ease-out',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Accordion content with CSS grid animation */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pt-4 pl-4">
            {navLink.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex flex-col gap-0.5 py-2 transition-colors duration-200',
                  pathname === child.href
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                onClick={onLinkClick}
              >
                <span className="font-display text-[20px] font-medium">
                  {child.label}
                </span>
                {child.description && (
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {child.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileNavAccordion({ navLinks, onLinkClick }: MobileNavAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <nav className="flex flex-col items-center gap-6">
      {navLinks.map((navLink) => (
        <AccordionItem
          key={navLink.label}
          navLink={navLink}
          isExpanded={expandedItems.includes(navLink.label)}
          onToggle={() => toggleItem(navLink.label)}
          onLinkClick={onLinkClick}
        />
      ))}
    </nav>
  );
}
