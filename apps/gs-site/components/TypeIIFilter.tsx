'use client';

import { cn } from '@/lib/utils';

export type TypeIICategory =
  | 'ALL'
  | 'Button'
  | 'Graph'
  | 'Metric'
  | 'Form'
  | 'Counter'
  | 'Calendar'
  | 'Dropzone'
  | 'Logic';

const TYPE_II_CATEGORIES: {
  id: TypeIICategory;
  label: string;
}[] = [
  { id: 'Button', label: 'Button' },
  { id: 'Graph', label: 'Graph' },
  { id: 'Metric', label: 'Metric' },
  { id: 'Form', label: 'Form' },
  { id: 'Counter', label: 'Counter' },
  { id: 'Calendar', label: 'Calendar' },
  { id: 'Dropzone', label: 'Dropzone' },
  { id: 'Logic', label: 'Logic' },
];

interface TypeIIFilterProps {
  activeTypeII: TypeIICategory;
  onTypeIIChange: (typeII: TypeIICategory) => void;
  className?: string;
}

export function TypeIIFilter({
  activeTypeII,
  onTypeIIChange,
  className,
}: TypeIIFilterProps) {
  const handleClick = (catId: TypeIICategory) => {
    // Toggle: if clicking active type, reset to ALL
    if (activeTypeII === catId) {
      onTypeIIChange('ALL');
    } else {
      onTypeIIChange(catId);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2 flex-wrap justify-center py-3 px-4',
        'bg-muted/30 border-t border-border/50',
        className
      )}
    >
      {TYPE_II_CATEGORIES.map((cat) => {
        const isActive = activeTypeII === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-sm transition-all duration-200',
              'bg-neutral-400 text-black border border-transparent',
              isActive && 'ring-2 ring-white'
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export { TYPE_II_CATEGORIES };
export default TypeIIFilter;
