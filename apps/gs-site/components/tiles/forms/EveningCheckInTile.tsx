'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Moon, X, Check, Loader2, ClipboardList, Star, Sparkles, Camera, Image, Home, Plus, UtensilsCrossed } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';
import { useLIFXFormIntegration } from '@/hooks/useLIFXFormIntegration';

/**
 * EveningCheckInTile - Evening check-in form
 *
 * Fields:
 * 1. Deep Work Hours - Number input for total hours today
 * 2. What'd you get done? - Text area for accomplishments
 * 3. Improve how? - Text area for reflection
 * 4. Day Rating - 1-5 scale
 *
 * Evening phase: 6pm - 11pm
 */
interface EveningCheckInTileProps {
  tile: Tile;
  className?: string;
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export function EveningCheckInTile({ tile, className, externalOpen, onExternalClose }: EveningCheckInTileProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sync with external open state
  const modalOpen = externalOpen !== undefined ? externalOpen : isOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LIFX integration - turn off lights on form completion
  const { onEveningFormComplete } = useLIFXFormIntegration();

  // Deep Work state
  const [deepWorkHours, setDeepWorkHours] = useState('');
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const hoursDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Accomplishments state
  const [accomplishments, setAccomplishments] = useState('');

  // Improvement state
  const [improvements, setImprovements] = useState('');

  // Rating state
  const [dayRating, setDayRating] = useState<number | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onExternalClose?.();
  }, [onExternalClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement === e.currentTarget) {
          e.preventDefault();
          handleOpen();
        }
      }
    },
    [handleClose, handleOpen]
  );

  // Save deep work hours to Notion inline with debounce
  const saveDeepWorkHours = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setIsSavingHours(true);
    setHoursSaved(false);

    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Deep Work',
          value: numValue,
          type: 'number',
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setHoursSaved(true);
        setTimeout(() => setHoursSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving deep work hours:', error);
    } finally {
      setIsSavingHours(false);
    }
  }, []);

  // Handle hours input change with debounce
  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeepWorkHours(value);
    setHoursSaved(false);

    // Clear existing debounce
    if (hoursDebounceRef.current) {
      clearTimeout(hoursDebounceRef.current);
    }

    // Debounce save (800ms after typing stops)
    hoursDebounceRef.current = setTimeout(() => {
      saveDeepWorkHours(value);
    }, 800);
  }, [saveDeepWorkHours]);

  // Save hours on blur immediately
  const handleHoursBlur = useCallback(() => {
    if (hoursDebounceRef.current) {
      clearTimeout(hoursDebounceRef.current);
    }
    saveDeepWorkHours(deepWorkHours);
  }, [deepWorkHours, saveDeepWorkHours]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (hoursDebounceRef.current) {
        clearTimeout(hoursDebounceRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save deep work hours if not already saved
      if (deepWorkHours && !hoursSaved) {
        await saveDeepWorkHours(deepWorkHours);
      }

      // Save evening check-in data
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Evening Check-In',
          value: true,
          type: 'checkbox',
          date: new Date().toISOString().split('T')[0],
          additionalData: {
            accomplishments,
            improvements,
            dayRating,
          },
        }),
      });

      if (response.ok) {
        // Turn off lights and update schedule state
        onEveningFormComplete();
        // Close modal on success
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error submitting evening check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [deepWorkHours, hoursSaved, saveDeepWorkHours, accomplishments, improvements, dayRating, onEveningFormComplete]);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-purple-500/10 to-indigo-500/10
    border border-purple-500/30
    rounded-lg
    hover:from-purple-500/20 hover:to-indigo-500/20
    hover:border-purple-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
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
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <Moon className="w-5 h-5 text-purple-400" />
            {tile.status === 'Done' && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-sm font-medium text-foreground leading-tight">
              {tile.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Review + Reflect + Rate
            </p>
          </div>
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evening-checkin-title"
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
              w-full max-w-md
              max-h-[90vh]
              m-4
              bg-background
              border border-border
              rounded-xl
              shadow-2xl
              overflow-hidden
              animate-in fade-in-0 zoom-in-95
            "
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-400" />
                <h2 id="evening-checkin-title" className="text-lg font-semibold">
                  Evening Check-In
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

              {/* Field 1: Deep Work Hours */}
              <div className="space-y-2">
                <label htmlFor="deepwork-input" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Deep Work Hours
                </label>
                <div className="relative">
                  <input
                    ref={hoursInputRef}
                    id="deepwork-input"
                    type="number"
                    step="0.5"
                    min="0"
                    max="16"
                    placeholder="Total hours today..."
                    value={deepWorkHours}
                    onChange={handleHoursChange}
                    onBlur={handleHoursBlur}
                    className="
                      w-full px-4 py-3
                      bg-background border border-input rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      text-base
                      [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none
                      [&::-webkit-inner-spin-button]:appearance-none
                    "
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSavingHours && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {hoursSaved && (
                      <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in-0">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">hrs</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saves to Notion Habits as you type
                </p>
              </div>

              {/* Field 2: Accomplishments */}
              <div className="space-y-2">
                <label htmlFor="accomplishments-input" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  What&apos;d you get done?
                </label>
                <textarea
                  id="accomplishments-input"
                  placeholder="List your wins today..."
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                  rows={3}
                  className="
                    w-full px-4 py-3
                    bg-background border border-input rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    text-base resize-none
                  "
                />
              </div>

              {/* Field 3: Improvements */}
              <div className="space-y-2">
                <label htmlFor="improvements-input" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Improve how?
                </label>
                <textarea
                  id="improvements-input"
                  placeholder="What would you do differently..."
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  rows={2}
                  className="
                    w-full px-4 py-3
                    bg-background border border-input rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    text-base resize-none
                  "
                />
              </div>

              {/* Field 4: Day Rating */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  Rate Your Day
                </label>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setDayRating(rating)}
                      className={`
                        flex-1 py-3 rounded-lg border-2 font-medium transition-all duration-200
                        ${dayRating === rating
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'border-muted-foreground/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-muted-foreground'
                        }
                      `}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Rough day</span>
                  <span>Crushed it</span>
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
                    rounded-lg
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
                    bg-purple-500 text-white
                    rounded-lg
                    hover:bg-purple-600
                    disabled:opacity-50
                    transition-colors
                    flex items-center gap-2
                  "
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Standalone Evening Check-In Modal
 * Can be used independently without a tile (e.g., from PhaseReminder)
 */
interface HabitatPhoto {
  id: string;
  url: string;
  file: File;
}

export function EveningCheckInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deepWorkHours, setDeepWorkHours] = useState('');
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [accomplishments, setAccomplishments] = useState('');
  const [improvements, setImprovements] = useState('');
  const [dayRating, setDayRating] = useState<number | null>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const hoursDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // LIFX integration - turn off lights on form completion
  const { onEveningFormComplete } = useLIFXFormIntegration();

  // Food Tracked state (required)
  const [foodTracked, setFoodTracked] = useState(false);
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [foodSaved, setFoodSaved] = useState(false);

  // Habitat Pic Check state (0-8 photos)
  const [habitatPhotos, setHabitatPhotos] = useState<HabitatPhoto[]>([]);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const habitatFileInputRef = useRef<HTMLInputElement>(null);
  const habitatCameraInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 8;

  const handleHabitatFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_PHOTOS - habitatPhotos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPhotos: HabitatPhoto[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setHabitatPhotos(prev => [...prev, ...newPhotos]);
    setShowPhotoOptions(false);
    if (e.target) e.target.value = '';
  }, [habitatPhotos.length]);

  const handleHabitatCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && habitatPhotos.length < MAX_PHOTOS) {
      const newPhoto: HabitatPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
      };
      setHabitatPhotos(prev => [...prev, newPhoto]);
      setShowPhotoOptions(false);
    }
    if (e.target) e.target.value = '';
  }, [habitatPhotos.length]);

  const removeHabitatPhoto = useCallback((id: string) => {
    setHabitatPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.url);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  // Cleanup habitat photo URLs on unmount
  useEffect(() => {
    return () => {
      habitatPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    };
  }, []);

  // Save Food Tracked to Notion inline
  const saveFoodTracked = useCallback(async (checked: boolean) => {
    setIsSavingFood(true);
    setFoodSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Food Tracked',
          value: checked,
          type: 'checkbox',
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (response.ok) {
        setFoodSaved(true);
        setTimeout(() => setFoodSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving food tracked:', error);
    } finally {
      setIsSavingFood(false);
    }
  }, []);

  const handleFoodTrackedChange = useCallback((checked: boolean) => {
    setFoodTracked(checked);
    saveFoodTracked(checked);
  }, [saveFoodTracked]);

  const saveDeepWorkHours = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    setIsSavingHours(true);
    setHoursSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Deep Work',
          value: numValue,
          type: 'number',
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (response.ok) {
        setHoursSaved(true);
        setTimeout(() => setHoursSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving deep work hours:', error);
    } finally {
      setIsSavingHours(false);
    }
  }, []);

  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeepWorkHours(value);
    setHoursSaved(false);
    if (hoursDebounceRef.current) clearTimeout(hoursDebounceRef.current);
    hoursDebounceRef.current = setTimeout(() => saveDeepWorkHours(value), 800);
  }, [saveDeepWorkHours]);

  const handleHoursBlur = useCallback(() => {
    if (hoursDebounceRef.current) clearTimeout(hoursDebounceRef.current);
    saveDeepWorkHours(deepWorkHours);
  }, [deepWorkHours, saveDeepWorkHours]);

  useEffect(() => {
    return () => {
      if (hoursDebounceRef.current) clearTimeout(hoursDebounceRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Food Tracked is required
    if (!foodTracked) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (deepWorkHours && !hoursSaved) await saveDeepWorkHours(deepWorkHours);

      // Ensure Food Tracked is saved (should already be saved inline, but double-check)
      if (!foodSaved) await saveFoodTracked(true);

      // TODO: Upload habitat photos to Supabase storage
      if (habitatPhotos.length > 0) {
        console.log('Habitat photos to upload:', habitatPhotos.length);
        // Future: Upload to Supabase storage bucket
      }

      await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Evening Check-In',
          value: true,
          type: 'checkbox',
          date: new Date().toISOString().split('T')[0],
          additionalData: {
            accomplishments,
            improvements,
            dayRating,
            habitatPhotoCount: habitatPhotos.length,
            foodTracked: true,
          },
        }),
      });
      // Turn off lights and update schedule state
      onEveningFormComplete();
      onClose();
    } catch (error) {
      console.error('Error submitting evening check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [deepWorkHours, hoursSaved, saveDeepWorkHours, foodTracked, foodSaved, saveFoodTracked, accomplishments, improvements, dayRating, habitatPhotos, onClose, onEveningFormComplete]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evening-modal-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] m-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-400" />
            <h2 id="evening-modal-title" className="text-lg font-semibold">Evening Check-In</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background/50 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-2">
            <label htmlFor="modal-deepwork" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground" />Deep Work Hours
            </label>
            <div className="relative">
              <input ref={hoursInputRef} id="modal-deepwork" type="number" step="0.5" min="0" max="16" placeholder="Total hours today..." value={deepWorkHours} onChange={handleHoursChange} onBlur={handleHoursBlur} className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSavingHours && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {hoursSaved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
                <span className="text-sm text-muted-foreground">hrs</span>
              </div>
            </div>
          </div>

          {/* Food Tracked - Required checkbox with inline Notion save */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleFoodTrackedChange(!foodTracked)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                foodTracked
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'border-muted-foreground/30 hover:border-purple-500/50 hover:bg-purple-500/5'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                foodTracked ? 'bg-green-500 border-green-500' : 'border-muted-foreground/50'
              }`}>
                {foodTracked && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${foodTracked ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                  Food Tracked
                </span>
                <span className="text-xs text-red-500">*</span>
              </div>
              <div className="flex items-center gap-2">
                {isSavingFood && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {foodSaved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Required - Syncs to Notion Habits</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="modal-accomplishments" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />What&apos;d you get done?
            </label>
            <textarea id="modal-accomplishments" placeholder="List your wins today..." value={accomplishments} onChange={(e) => setAccomplishments(e.target.value)} rows={3} className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base resize-none" />
          </div>
          <div className="space-y-2">
            <label htmlFor="modal-improvements" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground" />Improve how?
            </label>
            <textarea id="modal-improvements" placeholder="What would you do differently..." value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base resize-none" />
          </div>

          {/* Habitat Pic Check - Multi-photo upload (0-8) */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Home className="w-4 h-4 text-muted-foreground" />
              Habitat Pic Check
              <span className="text-xs text-muted-foreground ml-auto">{habitatPhotos.length}/{MAX_PHOTOS}</span>
            </label>
            <p className="text-xs text-muted-foreground -mt-1">Clean sink, clothes laid out, phone across room, etc.</p>

            {/* Hidden file inputs */}
            <input ref={habitatFileInputRef} type="file" accept="image/*" multiple onChange={handleHabitatFileSelect} className="hidden" />
            <input ref={habitatCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleHabitatCameraCapture} className="hidden" />

            {/* Photo grid */}
            {habitatPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {habitatPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={photo.url} alt="Habitat" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeHabitatPhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add photo button */}
            {habitatPhotos.length < MAX_PHOTOS && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-200 text-muted-foreground"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add photos</span>
                </button>
                {showPhotoOptions && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                    <button type="button" onClick={() => habitatFileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Image className="w-5 h-5 text-muted-foreground" />
                      <div><div className="text-sm font-medium">Choose from Library</div><div className="text-xs text-muted-foreground">Select multiple photos</div></div>
                    </button>
                    <button type="button" onClick={() => habitatCameraInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <div><div className="text-sm font-medium">Take Photo</div><div className="text-xs text-muted-foreground">Use camera</div></div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Star className="w-4 h-4 text-muted-foreground" />Rate Your Day
            </label>
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => setDayRating(rating)} className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${dayRating === rating ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-muted-foreground/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-muted-foreground'}`}>
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1"><span>Rough day</span><span>Crushed it</span></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !foodTracked}
              title={!foodTracked ? 'Food Tracked is required' : undefined}
              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EveningCheckInTile;
