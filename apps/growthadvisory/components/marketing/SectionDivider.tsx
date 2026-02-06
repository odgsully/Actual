'use client';

import { cn } from '@/lib/utils';

interface SectionDividerProps {
  className?: string;
}

/**
 * Subtle gradient line divider between sections
 */
export function SectionDivider({ className }: SectionDividerProps) {
  return <div className={cn('section-divider', className)} />;
}
