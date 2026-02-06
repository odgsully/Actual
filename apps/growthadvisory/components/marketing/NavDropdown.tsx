'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/lib/marketing-data';
import { cn } from '@/lib/utils';

interface NavDropdownProps {
  navLink: NavLink;
  isOpen: boolean;
  focusedIndex: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onItemKeyDown: (e: KeyboardEvent, index: number, onSelect: () => void) => void;
  onClose: () => void;
}

export function NavDropdown({
  navLink,
  isOpen,
  focusedIndex,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onKeyDown,
  onItemKeyDown,
  onClose,
}: NavDropdownProps) {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Check if current path is within this dropdown's children
  const isActive = navLink.children?.some((child) => pathname === child.href) || pathname === navLink.href;

  // Focus the item when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Click outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!navLink.hasDropdown || !navLink.children) {
    // Simple link without dropdown
    return (
      <Link
        href={navLink.href}
        className={cn(
          'relative text-sm font-medium transition-colors duration-300',
          pathname === navLink.href
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          // Underline effect
          'after:content-[""] after:absolute after:-bottom-1 after:left-0 after:h-px',
          'after:bg-[var(--gradient-rainbow-wide)] after:bg-[length:300%_300%]',
          'after:transition-[width] after:duration-300',
          pathname === navLink.href ? 'after:w-full' : 'after:w-0 hover:after:w-full'
        )}
      >
        {navLink.label}
      </Link>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Trigger button */}
      <button
        type="button"
        className={cn(
          'relative flex items-center gap-1 text-sm font-medium transition-colors duration-300',
          isActive || isOpen
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          // Underline effect
          'after:content-[""] after:absolute after:-bottom-1 after:left-0 after:h-px',
          'after:bg-[var(--gradient-rainbow-wide)] after:bg-[length:300%_300%]',
          'after:transition-[width] after:duration-300',
          isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {navLink.label}
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-3 py-2 min-w-[240px]',
            'bg-[var(--bg-card)] backdrop-blur-[12px]',
            'border border-[var(--border-subtle)] rounded-[var(--radius-lg)]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
            'dropdown-animate-in'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {navLink.children.map((child, index) => (
            <Link
              key={child.href}
              ref={(el) => { itemRefs.current[index] = el; }}
              href={child.href}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              className={cn(
                'group flex flex-col gap-0.5 px-4 py-3 mx-2 rounded-[var(--radius-md)]',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-inset',
                pathname === child.href
                  ? 'bg-[var(--bg-card-hover)]'
                  : 'hover:bg-[var(--bg-card-hover)]'
              )}
              onClick={onClose}
              onKeyDown={(e) => onItemKeyDown(e, index, () => {})}
            >
              {/* Label with gradient hover effect */}
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  pathname === child.href
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                )}
              >
                {child.label}
              </span>
              {/* Description */}
              {child.description && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {child.description}
                </span>
              )}
              {/* Gradient border accent on hover */}
              <span
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 rounded-full',
                  'bg-gradient-to-b from-[var(--gold)] via-[var(--purple)] to-[var(--teal)]',
                  'transition-all duration-300',
                  'group-hover:h-6',
                  pathname === child.href && 'h-6'
                )}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
