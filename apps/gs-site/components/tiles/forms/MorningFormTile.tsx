'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sun, X, Check, Camera, Image, Loader2, Video, Scale } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { TileComponentProps } from '../TileRegistry';

/**
 * MorningFormTile - Morning check-in form
 *
 * Fields:
 * 1. Weight - Number input, saves inline to Notion Habits "Weight" property
 * 2. Morning Video - Opens device camera app for 45-sec AM video
 * 3. Photo - Upload from library or capture with camera
 *
 * Must be completed before accessing GS Site Standing phase
 */
export function MorningFormTile({ tile, className }: TileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weight state
  const [weight, setWeight] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const weightDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'library' | 'camera' | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoRecorded, setVideoRecorded] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowPhotoOptions(false);
  }, []);

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

  // Save weight to Notion inline with debounce
  const saveWeight = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setIsSavingWeight(true);
    setWeightSaved(false);

    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Weight',
          value: numValue,
          type: 'number',
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setWeightSaved(true);
        setTimeout(() => setWeightSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving weight:', error);
    } finally {
      setIsSavingWeight(false);
    }
  }, []);

  // Handle weight input change with debounce
  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWeight(value);
    setWeightSaved(false);

    // Clear existing debounce
    if (weightDebounceRef.current) {
      clearTimeout(weightDebounceRef.current);
    }

    // Debounce save (800ms after typing stops)
    weightDebounceRef.current = setTimeout(() => {
      saveWeight(value);
    }, 800);
  }, [saveWeight]);

  // Save weight on blur immediately
  const handleWeightBlur = useCallback(() => {
    if (weightDebounceRef.current) {
      clearTimeout(weightDebounceRef.current);
    }
    saveWeight(weight);
  }, [weight, saveWeight]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (weightDebounceRef.current) {
        clearTimeout(weightDebounceRef.current);
      }
    };
  }, []);

  // Open camera app for video recording
  const handleOpenCameraForVideo = useCallback(() => {
    // Create a temporary video input to trigger camera
    const videoInput = document.createElement('input');
    videoInput.type = 'file';
    videoInput.accept = 'video/*';
    videoInput.capture = 'environment';

    videoInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setVideoRecorded(true);
        // TODO: Upload video to Supabase storage
        console.log('Video captured:', file.name, file.size);
      }
    };

    videoInput.click();
  }, []);

  // Handle file selection from library
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoSource('library');
      setShowPhotoOptions(false);
    }
  }, []);

  // Handle camera capture
  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoSource('camera');
      setShowPhotoOptions(false);
    }
  }, []);

  // Open photo options menu
  const handlePhotoClick = useCallback(() => {
    setShowPhotoOptions(!showPhotoOptions);
  }, [showPhotoOptions]);

  // Select from library
  const handleLibrarySelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Open camera for photo
  const handleCameraSelect = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  // Remove selected photo
  const handleRemovePhoto = useCallback(() => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(null);
    setPhotoSource(null);
  }, [photoUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save weight if not already saved
      if (weight && !weightSaved) {
        await saveWeight(weight);
      }

      // TODO: Upload photo to Supabase storage if present
      if (photoUrl && photoSource) {
        console.log('Photo to upload:', photoSource);
      }

      // Close modal on success
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting morning form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [weight, weightSaved, saveWeight, photoUrl, photoSource]);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-amber-500/10 to-orange-500/10
    border border-amber-500/30
    rounded-lg
    hover:from-amber-500/20 hover:to-orange-500/20
    hover:border-amber-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-amber-500
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
            <Sun className="w-5 h-5 text-amber-500" />
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
              Weight + Video + Photo
            </p>
          </div>
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="morning-form-title"
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
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <h2 id="morning-form-title" className="text-lg font-semibold">
                  Morning Form
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

              {/* Field 1: Weight */}
              <div className="space-y-2">
                <label htmlFor="weight-input" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  Weight
                </label>
                <div className="relative">
                  <input
                    ref={weightInputRef}
                    id="weight-input"
                    type="number"
                    step="0.1"
                    placeholder="Enter weight..."
                    value={weight}
                    onChange={handleWeightChange}
                    onBlur={handleWeightBlur}
                    className="
                      w-full px-4 py-3
                      bg-background border border-input rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                      text-base
                      [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none
                      [&::-webkit-inner-spin-button]:appearance-none
                    "
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSavingWeight && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {weightSaved && (
                      <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in-0">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">lbs</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saves to Notion Habits as you type
                </p>
              </div>

              {/* Field 2: Morning Video */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  Morning Video
                </label>
                <button
                  type="button"
                  onClick={handleOpenCameraForVideo}
                  className={`
                    w-full flex items-center justify-center gap-3
                    px-4 py-4
                    rounded-lg border-2
                    transition-all duration-200
                    ${videoRecorded
                      ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                      : 'border-dashed border-muted-foreground/30 hover:border-amber-500/50 hover:bg-amber-500/5'
                    }
                  `}
                >
                  {videoRecorded ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Video Recorded</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 text-muted-foreground" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Open Camera</div>
                        <div className="text-xs text-muted-foreground">Record 45-sec AM video</div>
                      </div>
                    </>
                  )}
                </button>
                <p className="text-xs text-muted-foreground">
                  Goals review, yesterday reflection, etc.
                </p>
              </div>

              {/* Field 3: Photo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  Photo
                </label>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {/* Photo preview or upload button */}
                {photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={photoUrl}
                      alt="Morning photo"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                      {photoSource === 'camera' ? 'Camera' : 'Library'}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-4
                        rounded-lg border-2 border-dashed border-muted-foreground/30
                        hover:border-muted-foreground/50 hover:bg-muted/20
                        transition-all duration-200
                        text-muted-foreground
                      "
                    >
                      <Camera className="w-5 h-5" />
                      <span>Tap to add photo</span>
                    </button>

                    {/* Photo source options */}
                    {showPhotoOptions && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                        <button
                          type="button"
                          onClick={handleLibrarySelect}
                          className="
                            w-full flex items-center gap-3 px-3 py-2.5
                            rounded-md hover:bg-accent
                            transition-colors text-left
                          "
                        >
                          <Image className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Upload from Library</div>
                            <div className="text-xs text-muted-foreground">Choose from your photos</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={handleCameraSelect}
                          className="
                            w-full flex items-center gap-3 px-3 py-2.5
                            rounded-md hover:bg-accent
                            transition-colors text-left
                          "
                        >
                          <Camera className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Camera</div>
                            <div className="text-xs text-muted-foreground">Take a photo now</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                    bg-amber-500 text-white
                    rounded-lg
                    hover:bg-amber-600
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

export default MorningFormTile;
