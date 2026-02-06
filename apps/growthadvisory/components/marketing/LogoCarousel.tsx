'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { clientLogos } from '@/lib/marketing-data';

interface LogoCarouselProps {
  className?: string;
  label?: string;
}

/**
 * Infinite horizontal scrolling logo carousel
 * Logos are duplicated for seamless loop animation
 * Pauses on hover, grayscale to color on hover
 */
export function LogoCarousel({
  className,
  label = 'Trusted by forward-thinking teams',
}: LogoCarouselProps) {
  // Duplicate logos for seamless infinite scroll
  const allLogos = [...clientLogos, ...clientLogos];

  return (
    <div className={cn('py-12 px-8 max-w-[1400px] mx-auto overflow-hidden', className)}>
      {/* Label */}
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-center mb-8 text-[var(--text-tertiary)]">
        {label}
      </p>

      {/* Carousel track */}
      <div className="logo-carousel__track">
        <div className="logo-carousel__slide" aria-hidden="true">
          {allLogos.map((logo, index) => (
            <div key={`${logo.name}-${index}`} className="logo-carousel__item">
              <Image
                src={logo.src}
                alt={logo.name}
                width={180}
                height={60}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
