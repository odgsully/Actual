'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { navLinks, companyInfo } from '@/lib/marketing-data';
import { useDropdownNav } from '@/hooks/useDropdownNav';
import { NavDropdown } from './NavDropdown';
import { MobileNavAccordion } from './MobileNavAccordion';
import { cn } from '@/lib/utils';

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const {
    isOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    handleItemKeyDown,
    closeAll,
    focusedIndex,
  } = useDropdownNav({ closeDelay: 150 });

  // Handle scroll for backdrop blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on link click
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    document.body.style.overflow = newState ? 'hidden' : '';
  };

  // Close dropdowns when scrolling on mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      closeAll();
    }
  }, [mobileMenuOpen, closeAll]);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-[1000] py-4 transition-all duration-400',
          scrolled && 'bg-[rgba(10,10,15,0.80)] backdrop-blur-[16px] border-b border-[var(--border-subtle)] py-3'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Image
              src="/assets/ga-logo-white.png"
              alt="Growth Advisory"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-display font-medium text-lg tracking-[-0.02em]">
              {companyInfo.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            {navLinks.map((navLink) => (
              <li key={navLink.label}>
                <NavDropdown
                  navLink={navLink}
                  isOpen={isOpen(navLink.label)}
                  focusedIndex={focusedIndex}
                  onMouseEnter={() => handleMouseEnter(navLink.label)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(navLink.label)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, navLink.label, navLink.children?.length || 0)
                  }
                  onItemKeyDown={(e, index, onSelect) =>
                    handleItemKeyDown(e, index, navLink.children?.length || 0, onSelect)
                  }
                  onClose={closeAll}
                />
              </li>
            ))}
            <li>
              <a
                href={companyInfo.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient py-2.5 px-6 text-sm"
              >
                Book a Call
              </a>
            </li>
          </ul>

          {/* Mobile hamburger button */}
          <button
            className={cn(
              'md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1 z-[1001]'
            )}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={cn(
                'block w-6 h-0.5 bg-[var(--text-primary)] rounded-sm transition-all duration-300',
                mobileMenuOpen && 'rotate-45 translate-x-[5px] translate-y-[5px]'
              )}
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-[var(--text-primary)] rounded-sm transition-all duration-300',
                mobileMenuOpen && 'opacity-0'
              )}
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-[var(--text-primary)] rounded-sm transition-all duration-300',
                mobileMenuOpen && '-rotate-45 translate-x-[5px] -translate-y-[5px]'
              )}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[999] bg-[rgba(10,10,15,0.96)] backdrop-blur-[24px]',
          'flex-col items-center justify-center gap-8',
          'transition-opacity duration-400',
          mobileMenuOpen ? 'flex opacity-100' : 'hidden opacity-0'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <MobileNavAccordion navLinks={navLinks} onLinkClick={handleLinkClick} />
        <a
          href={companyInfo.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient mt-4"
          onClick={handleLinkClick}
        >
          Book a Call
        </a>
      </div>
    </>
  );
}
