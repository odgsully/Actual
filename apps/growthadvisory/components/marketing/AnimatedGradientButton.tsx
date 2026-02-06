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
  const baseStyles = variant === 'primary' ? 'btn-gradient' : 'btn-ghost';

  const sizeStyles = {
    default: 'py-2.5 px-6 text-sm',
    large: 'py-4 px-9 text-[15px]',
  };

  const combinedClassName = cn(
    baseStyles,
    sizeStyles[size],
    'group',
    className
  );

  const content = (
    <>
      {children}
      {showArrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={combinedClassName}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName}>
      {content}
    </button>
  );
}
