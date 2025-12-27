'use client';

import { BgAnimateButton } from '@/components/ui/bg-animate-button';
import { cn } from '@/lib/utils';

export type MenuCategory = 'ALL' | 'Real Estate' | 'Software' | 'Org' | 'Content' | 'Health' | 'Learn';

const MENU_CATEGORIES: {
  id: MenuCategory;
  label: string;
  gradient: 'default' | 'sunset' | 'ocean' | 'nebula' | 'candy' | 'forest' | 'sunrise' | 'gold';
}[] = [
  { id: 'Org', label: 'Org', gradient: 'nebula' },
  { id: 'Real Estate', label: 'Real Estate', gradient: 'sunset' },
  { id: 'Software', label: 'Software', gradient: 'ocean' },
  { id: 'Content', label: 'Content', gradient: 'candy' },
  { id: 'Health', label: 'Health', gradient: 'forest' },
  { id: 'Learn', label: 'Learn', gradient: 'gold' },
  { id: 'ALL', label: 'ALL', gradient: 'default' },
];

interface MenuFilterProps {
  activeCategory: MenuCategory;
  onCategoryChange: (category: MenuCategory) => void;
  className?: string;
}

export function MenuFilter({ activeCategory, onCategoryChange, className }: MenuFilterProps) {
  return (
    <div className={cn('flex gap-3 flex-wrap justify-center p-4', className)}>
      {MENU_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <BgAnimateButton
            key={cat.id}
            gradient={cat.gradient}
            animation="spin-slow"
            rounded="full"
            shadow={isActive ? 'deep' : 'soft'}
            size="sm"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              'transition-all duration-200',
              isActive && 'ring-2 ring-white/80 scale-105'
            )}
          >
            {cat.label}
          </BgAnimateButton>
        );
      })}
    </div>
  );
}

export { MENU_CATEGORIES };
export default MenuFilter;
