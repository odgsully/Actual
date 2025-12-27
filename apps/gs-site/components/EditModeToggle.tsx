'use client';

import { Move, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditModeToggleProps {
  editMode: boolean;
  onToggle: () => void;
  className?: string;
}

export function EditModeToggle({
  editMode,
  onToggle,
  className,
}: EditModeToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              editMode
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground',
              className
            )}
            aria-label={editMode ? 'Lock layout' : 'Edit layout'}
            aria-pressed={editMode}
          >
            {editMode ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Move className="w-4 h-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{editMode ? 'Click to lock layout' : 'Click to rearrange tiles'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
