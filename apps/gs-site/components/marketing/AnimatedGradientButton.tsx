'use client';

import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface AnimatedGradientButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'large';
  className?: string;
  showArrow?: boolean;
}

export function AnimatedGradientButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'default',
  className,
  showArrow = false,
}: AnimatedGradientButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 rounded-lg';

  const sizeStyles = {
    default: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base',
  };

  const variantStyles = {
    primary: cn(
      'bg-gradient-to-r from-amber-400 via-purple-500 to-teal-400',
      'animate-gradient text-white',
      'hover:scale-[1.02] hover:-translate-y-0.5',
      'shadow-lg hover:shadow-xl hover:shadow-purple-500/25',
      'active:scale-[0.98]'
    ),
    secondary: cn(
      'border border-border bg-transparent text-foreground',
      'hover:bg-accent hover:border-accent',
      'hover:scale-[1.02] hover:-translate-y-0.5',
      'active:scale-[0.98]'
    ),
  };

  const combinedClassName = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  const content = (
    <>
      {children}
      {showArrow && (
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(combinedClassName, 'group')}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={cn(combinedClassName, 'group')}>
      {content}
    </button>
  );
}
