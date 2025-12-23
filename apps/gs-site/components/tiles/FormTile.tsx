'use client';

import { useState, useCallback } from 'react';
import { FileText, X, ChevronRight, Loader2 } from 'lucide-react';
import { WarningBorderTrail } from './WarningBorderTrail';
import type { TileComponentProps } from './TileRegistry';

/**
 * FormTile - Modal trigger for form-based tiles
 *
 * Opens a slide-over panel or modal with form content.
 * Used for tiles like:
 * - Morning Form
 * - Forms Monthly/Quarterly
 * - Multi-wk Phase Form
 * - Open House To-Do
 *
 * Features:
 * - Click to open modal/slide-over
 * - Form state persists during session
 * - Close confirmation if unsaved changes
 * - Keyboard accessible (Escape to close)
 */
export function FormTile({ tile, className }: TileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setIsOpen(false);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    },
    [handleClose, handleOpen]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setHasUnsavedChanges(false);
    setIsOpen(false);
  }, []);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:bg-accent
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-ring
    focus:ring-offset-2
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
      <WarningBorderTrail
        active={tile.actionWarning}
        hoverMessage={tile.actionDesc}
      >
        <div
          className={baseClasses}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`Open ${tile.name} form`}
          aria-haspopup="dialog"
        >
          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
              {tile.name}
            </h3>
            {tile.desc && (
              <p className="text-xs text-muted-foreground mt-1 tracking-wide truncate">
                {tile.desc}
              </p>
            )}
          </div>

          {/* 3rd Party indicator */}
          {tile.thirdParty.length > 0 && (
            <div className="absolute top-2 left-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
                title={`3rd Party: ${tile.thirdParty.join(', ')}`}
              />
            </div>
          )}
        </div>
      </WarningBorderTrail>

      {/* Modal/Slide-over */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="
              relative
              w-full max-w-lg
              max-h-[90vh]
              m-4
              bg-background
              border border-border
              rounded-lg
              shadow-xl
              overflow-hidden
              animate-in fade-in-0 zoom-in-95
            "
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 id="form-title" className="text-lg font-semibold">
                {tile.name}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-accent transition-colors"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {tile.desc && (
                <p className="text-sm text-muted-foreground">{tile.desc}</p>
              )}

              {/* Placeholder form fields - replace with actual form content */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="form-field-1"
                    className="block text-sm font-medium mb-1"
                  >
                    Field 1
                  </label>
                  <input
                    id="form-field-1"
                    type="text"
                    className="
                      w-full px-3 py-2
                      bg-background border border-input rounded-md
                      focus:outline-none focus:ring-2 focus:ring-ring
                    "
                    placeholder="Enter value..."
                    onChange={() => setHasUnsavedChanges(true)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-field-2"
                    className="block text-sm font-medium mb-1"
                  >
                    Field 2
                  </label>
                  <textarea
                    id="form-field-2"
                    className="
                      w-full px-3 py-2 min-h-[100px]
                      bg-background border border-input rounded-md
                      focus:outline-none focus:ring-2 focus:ring-ring
                      resize-none
                    "
                    placeholder="Enter description..."
                    onChange={() => setHasUnsavedChanges(true)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  className="
                    px-4 py-2
                    text-sm font-medium
                    bg-secondary text-secondary-foreground
                    rounded-md
                    hover:bg-secondary/80
                    transition-colors
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    px-4 py-2
                    text-sm font-medium
                    bg-primary text-primary-foreground
                    rounded-md
                    hover:bg-primary/90
                    disabled:opacity-50
                    transition-colors
                    flex items-center gap-2
                  "
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default FormTile;
