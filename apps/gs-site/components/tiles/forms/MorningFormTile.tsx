'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sun, X, Check, Camera, Image, Loader2, Video, Scale, Sparkles, Ruler } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { TileComponentProps } from '../TileRegistry';
import { useLIFXFormIntegration } from '@/hooks/useLIFXFormIntegration';

/**
 * MorningFormTile - Morning Check In form
 *
 * Fields:
 * 1. Weight - Number input, saves inline to Notion Habits "Weight" property
 * 2. Morning Video - Opens device camera app for 45-sec AM video
 * 3. Body Progress Photo - Upload from library or capture with camera
 * 4. Face Progress Photo - Upload from library or capture with camera
 *
 * Must be completed before accessing GS Site Standing phase
 */
export function MorningFormTile({ tile, className }: TileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LIFX integration - turns off lights when form is submitted
  const { onMorningFormComplete } = useLIFXFormIntegration();

  // Weight state
  const [weight, setWeight] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const weightDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Teeth Grind Rating state (1-5 scale)
  const [teethGrindRating, setTeethGrindRating] = useState<number | null>(null);
  const [isSavingGrind, setIsSavingGrind] = useState(false);
  const [grindSaved, setGrindSaved] = useState(false);

  // Retainer state (checkbox)
  const [retainer, setRetainer] = useState(false);
  const [isSavingRetainer, setIsSavingRetainer] = useState(false);
  const [retainerSaved, setRetainerSaved] = useState(false);

  // Body Measurements state
  const [shoulderMeasurement, setShoulderMeasurement] = useState('');
  const [isSavingShoulder, setIsSavingShoulder] = useState(false);
  const [shoulderSaved, setShoulderSaved] = useState(false);
  const shoulderDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [thighMeasurement, setThighMeasurement] = useState('');
  const [isSavingThigh, setIsSavingThigh] = useState(false);
  const [thighSaved, setThighSaved] = useState(false);
  const thighDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Body Progress Photo state
  const [bodyPhotoUrl, setBodyPhotoUrl] = useState<string | null>(null);
  const [bodyPhotoSource, setBodyPhotoSource] = useState<'library' | 'camera' | null>(null);
  const [showBodyPhotoOptions, setShowBodyPhotoOptions] = useState(false);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const bodyCameraInputRef = useRef<HTMLInputElement>(null);

  // Face Progress Photo state
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [facePhotoSource, setFacePhotoSource] = useState<'library' | 'camera' | null>(null);
  const [showFacePhotoOptions, setShowFacePhotoOptions] = useState(false);
  const faceFileInputRef = useRef<HTMLInputElement>(null);
  const faceCameraInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoRecorded, setVideoRecorded] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowBodyPhotoOptions(false);
    setShowFacePhotoOptions(false);
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

  // Save Teeth Grind Rating (1-5 scale, saves immediately on click)
  const saveTeethGrindRating = useCallback(async (rating: number) => {
    setIsSavingGrind(true);
    setGrindSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Teeth Grind Rating',
          value: rating,
          type: 'number',
        }),
      });
      if (response.ok) {
        setGrindSaved(true);
        setTimeout(() => setGrindSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving teeth grind rating:', error);
    } finally {
      setIsSavingGrind(false);
    }
  }, []);

  const handleTeethGrindClick = useCallback((rating: number) => {
    setTeethGrindRating(rating);
    saveTeethGrindRating(rating);
  }, [saveTeethGrindRating]);

  // Save Retainer checkbox (saves immediately on toggle)
  const saveRetainer = useCallback(async (value: boolean) => {
    setIsSavingRetainer(true);
    setRetainerSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Retainer',
          value: value,
          type: 'checkbox',
        }),
      });
      if (response.ok) {
        setRetainerSaved(true);
        setTimeout(() => setRetainerSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving retainer:', error);
    } finally {
      setIsSavingRetainer(false);
    }
  }, []);

  const handleRetainerToggle = useCallback(() => {
    const newValue = !retainer;
    setRetainer(newValue);
    saveRetainer(newValue);
  }, [retainer, saveRetainer]);

  // Save Shoulder Measurement (debounced)
  const saveShoulder = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setIsSavingShoulder(true);
    setShoulderSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Shoulder Measurement',
          value: numValue,
          type: 'number',
        }),
      });
      if (response.ok) {
        setShoulderSaved(true);
        setTimeout(() => setShoulderSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving shoulder measurement:', error);
    } finally {
      setIsSavingShoulder(false);
    }
  }, []);

  const handleShoulderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShoulderMeasurement(value);
    setShoulderSaved(false);
    if (shoulderDebounceRef.current) clearTimeout(shoulderDebounceRef.current);
    shoulderDebounceRef.current = setTimeout(() => saveShoulder(value), 800);
  }, [saveShoulder]);

  const handleShoulderBlur = useCallback(() => {
    if (shoulderDebounceRef.current) clearTimeout(shoulderDebounceRef.current);
    saveShoulder(shoulderMeasurement);
  }, [shoulderMeasurement, saveShoulder]);

  // Save Thigh Measurement (debounced)
  const saveThigh = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setIsSavingThigh(true);
    setThighSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: 'Thigh Measurement',
          value: numValue,
          type: 'number',
        }),
      });
      if (response.ok) {
        setThighSaved(true);
        setTimeout(() => setThighSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving thigh measurement:', error);
    } finally {
      setIsSavingThigh(false);
    }
  }, []);

  const handleThighChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setThighMeasurement(value);
    setThighSaved(false);
    if (thighDebounceRef.current) clearTimeout(thighDebounceRef.current);
    thighDebounceRef.current = setTimeout(() => saveThigh(value), 800);
  }, [saveThigh]);

  const handleThighBlur = useCallback(() => {
    if (thighDebounceRef.current) clearTimeout(thighDebounceRef.current);
    saveThigh(thighMeasurement);
  }, [thighMeasurement, saveThigh]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (weightDebounceRef.current) {
        clearTimeout(weightDebounceRef.current);
      }
      if (shoulderDebounceRef.current) {
        clearTimeout(shoulderDebounceRef.current);
      }
      if (thighDebounceRef.current) {
        clearTimeout(thighDebounceRef.current);
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

  // Body Progress Photo handlers
  const handleBodyFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBodyPhotoUrl(url);
      setBodyPhotoSource('library');
      setShowBodyPhotoOptions(false);
    }
  }, []);

  const handleBodyCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBodyPhotoUrl(url);
      setBodyPhotoSource('camera');
      setShowBodyPhotoOptions(false);
    }
  }, []);

  const handleBodyPhotoClick = useCallback(() => {
    setShowBodyPhotoOptions(!showBodyPhotoOptions);
    setShowFacePhotoOptions(false);
  }, [showBodyPhotoOptions]);

  const handleRemoveBodyPhoto = useCallback(() => {
    if (bodyPhotoUrl) URL.revokeObjectURL(bodyPhotoUrl);
    setBodyPhotoUrl(null);
    setBodyPhotoSource(null);
  }, [bodyPhotoUrl]);

  // Face Progress Photo handlers
  const handleFaceFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFacePhotoUrl(url);
      setFacePhotoSource('library');
      setShowFacePhotoOptions(false);
    }
  }, []);

  const handleFaceCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFacePhotoUrl(url);
      setFacePhotoSource('camera');
      setShowFacePhotoOptions(false);
    }
  }, []);

  const handleFacePhotoClick = useCallback(() => {
    setShowFacePhotoOptions(!showFacePhotoOptions);
    setShowBodyPhotoOptions(false);
  }, [showFacePhotoOptions]);

  const handleRemoveFacePhoto = useCallback(() => {
    if (facePhotoUrl) URL.revokeObjectURL(facePhotoUrl);
    setFacePhotoUrl(null);
    setFacePhotoSource(null);
  }, [facePhotoUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save weight if not already saved
      if (weight && !weightSaved) {
        await saveWeight(weight);
      }

      // TODO: Upload body progress photo to Supabase storage if present
      if (bodyPhotoUrl && bodyPhotoSource) {
        console.log('Body progress photo to upload:', bodyPhotoSource);
      }

      // TODO: Upload face progress photo to Supabase storage if present
      if (facePhotoUrl && facePhotoSource) {
        console.log('Face progress photo to upload:', facePhotoSource);
      }

      // Turn off LIFX lights after morning form completion
      onMorningFormComplete();

      // Close modal on success
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting morning check in:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [weight, weightSaved, saveWeight, bodyPhotoUrl, bodyPhotoSource, facePhotoUrl, facePhotoSource, onMorningFormComplete]);

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
              Weight + Video + Photos
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
                  Morning Check In
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

              {/* Field 2: Teeth Grind Rating (1-5 scale) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Teeth Grind Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleTeethGrindClick(rating)}
                      disabled={isSavingGrind}
                      className={`
                        flex-1 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 border
                        ${teethGrindRating === rating
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-background border-input hover:bg-muted hover:border-muted-foreground/30'
                        }
                        ${isSavingGrind ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {rating}
                    </button>
                  ))}
                  {isSavingGrind && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-1" />
                  )}
                  {grindSaved && (
                    <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>None</span>
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Strong</span>
                  <span>Severe</span>
                </div>
              </div>

              {/* Field 3: Retainer */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Retainer
                </label>
                <button
                  type="button"
                  onClick={handleRetainerToggle}
                  disabled={isSavingRetainer}
                  className={`
                    w-full flex items-center justify-between
                    px-4 py-3
                    rounded-lg border
                    transition-all duration-200
                    ${retainer
                      ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                      : 'bg-background border-input hover:bg-muted hover:border-muted-foreground/30'
                    }
                    ${isSavingRetainer ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-sm font-medium">
                    {retainer ? 'Wore Retainer ✓' : 'Wore Retainer?'}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSavingRetainer && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {retainerSaved && (
                      <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in-0">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      transition-all duration-200
                      ${retainer
                        ? 'bg-green-500 border-green-500'
                        : 'border-muted-foreground/30'
                      }
                    `}>
                      {retainer && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              </div>

              {/* Field 4: Body Measurements */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Body Measurements
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Shoulder */}
                  <div className="space-y-1">
                    <label htmlFor="shoulder-input" className="text-xs text-muted-foreground">
                      Shoulder (in)
                    </label>
                    <div className="relative">
                      <input
                        id="shoulder-input"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={shoulderMeasurement}
                        onChange={handleShoulderChange}
                        onBlur={handleShoulderBlur}
                        className="
                          w-full px-3 py-2
                          bg-background border border-input rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                          text-sm
                          [appearance:textfield]
                          [&::-webkit-outer-spin-button]:appearance-none
                          [&::-webkit-inner-spin-button]:appearance-none
                        "
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isSavingShoulder && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                        {shoulderSaved && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Thigh */}
                  <div className="space-y-1">
                    <label htmlFor="thigh-input" className="text-xs text-muted-foreground">
                      Thigh (in)
                    </label>
                    <div className="relative">
                      <input
                        id="thigh-input"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={thighMeasurement}
                        onChange={handleThighChange}
                        onBlur={handleThighBlur}
                        className="
                          w-full px-3 py-2
                          bg-background border border-input rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                          text-sm
                          [appearance:textfield]
                          [&::-webkit-outer-spin-button]:appearance-none
                          [&::-webkit-inner-spin-button]:appearance-none
                        "
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isSavingThigh && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                        {thighSaved && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saves automatically after typing
                </p>
              </div>

              {/* Field 5: Morning Video */}
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

              {/* Field 3: Body Progress Photo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  Body Progress
                </label>

                {/* Hidden file inputs for body photo */}
                <input
                  ref={bodyFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBodyFileSelect}
                  className="hidden"
                />
                <input
                  ref={bodyCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleBodyCameraCapture}
                  className="hidden"
                />

                {/* Body photo preview or upload button */}
                {bodyPhotoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={bodyPhotoUrl}
                      alt="Body progress photo"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveBodyPhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                      {bodyPhotoSource === 'camera' ? 'Camera' : 'Library'}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleBodyPhotoClick}
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-3
                        rounded-lg border-2 border-dashed border-muted-foreground/30
                        hover:border-muted-foreground/50 hover:bg-muted/20
                        transition-all duration-200
                        text-muted-foreground
                      "
                    >
                      <Camera className="w-5 h-5" />
                      <span>Add body photo</span>
                    </button>

                    {/* Body photo source options */}
                    {showBodyPhotoOptions && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                        <button
                          type="button"
                          onClick={() => bodyFileInputRef.current?.click()}
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
                          onClick={() => bodyCameraInputRef.current?.click()}
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

              {/* Field 4: Face Progress Photo */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  Face Progress
                </label>

                {/* Hidden file inputs for face photo */}
                <input
                  ref={faceFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFaceFileSelect}
                  className="hidden"
                />
                <input
                  ref={faceCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFaceCameraCapture}
                  className="hidden"
                />

                {/* Face photo preview or upload button */}
                {facePhotoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={facePhotoUrl}
                      alt="Face progress photo"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFacePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                      {facePhotoSource === 'camera' ? 'Camera' : 'Library'}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleFacePhotoClick}
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-3
                        rounded-lg border-2 border-dashed border-muted-foreground/30
                        hover:border-muted-foreground/50 hover:bg-muted/20
                        transition-all duration-200
                        text-muted-foreground
                      "
                    >
                      <Camera className="w-5 h-5" />
                      <span>Add face photo</span>
                    </button>

                    {/* Face photo source options */}
                    {showFacePhotoOptions && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                        <button
                          type="button"
                          onClick={() => faceFileInputRef.current?.click()}
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
                          onClick={() => faceCameraInputRef.current?.click()}
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

/**
 * Standalone Morning Check In Modal
 * Can be used independently without a tile (e.g., from PhaseReminder)
 */
export function MorningFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weight, setWeight] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);

  // LIFX integration - turns off lights when form is submitted
  const { onMorningFormComplete } = useLIFXFormIntegration();

  // Teeth Grind Rating state (1-5 scale)
  const [teethGrindRating, setTeethGrindRating] = useState<number | null>(null);
  const [isSavingGrind, setIsSavingGrind] = useState(false);
  const [grindSaved, setGrindSaved] = useState(false);

  // Retainer state (checkbox)
  const [retainer, setRetainer] = useState(false);
  const [isSavingRetainer, setIsSavingRetainer] = useState(false);
  const [retainerSaved, setRetainerSaved] = useState(false);

  // Body Measurements state
  const [shoulderMeasurement, setShoulderMeasurement] = useState('');
  const [isSavingShoulder, setIsSavingShoulder] = useState(false);
  const [shoulderSaved, setShoulderSaved] = useState(false);
  const shoulderDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [thighMeasurement, setThighMeasurement] = useState('');
  const [isSavingThigh, setIsSavingThigh] = useState(false);
  const [thighSaved, setThighSaved] = useState(false);
  const thighDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Body Progress Photo state
  const [bodyPhotoUrl, setBodyPhotoUrl] = useState<string | null>(null);
  const [bodyPhotoSource, setBodyPhotoSource] = useState<'library' | 'camera' | null>(null);
  const [showBodyPhotoOptions, setShowBodyPhotoOptions] = useState(false);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const bodyCameraInputRef = useRef<HTMLInputElement>(null);
  // Face Progress Photo state
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [facePhotoSource, setFacePhotoSource] = useState<'library' | 'camera' | null>(null);
  const [showFacePhotoOptions, setShowFacePhotoOptions] = useState(false);
  const faceFileInputRef = useRef<HTMLInputElement>(null);
  const faceCameraInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const weightDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWeight(value);
    setWeightSaved(false);
    if (weightDebounceRef.current) clearTimeout(weightDebounceRef.current);
    weightDebounceRef.current = setTimeout(() => saveWeight(value), 800);
  }, [saveWeight]);

  const handleWeightBlur = useCallback(() => {
    if (weightDebounceRef.current) clearTimeout(weightDebounceRef.current);
    saveWeight(weight);
  }, [weight, saveWeight]);

  // Save Teeth Grind Rating
  const saveTeethGrindRating = useCallback(async (rating: number) => {
    setIsSavingGrind(true);
    setGrindSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: 'Teeth Grind Rating', value: rating, type: 'number' }),
      });
      if (response.ok) {
        setGrindSaved(true);
        setTimeout(() => setGrindSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving teeth grind rating:', error);
    } finally {
      setIsSavingGrind(false);
    }
  }, []);

  const handleTeethGrindClick = useCallback((rating: number) => {
    setTeethGrindRating(rating);
    saveTeethGrindRating(rating);
  }, [saveTeethGrindRating]);

  // Save Retainer checkbox
  const saveRetainer = useCallback(async (value: boolean) => {
    setIsSavingRetainer(true);
    setRetainerSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: 'Retainer', value: value, type: 'checkbox' }),
      });
      if (response.ok) {
        setRetainerSaved(true);
        setTimeout(() => setRetainerSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving retainer:', error);
    } finally {
      setIsSavingRetainer(false);
    }
  }, []);

  const handleRetainerToggle = useCallback(() => {
    const newValue = !retainer;
    setRetainer(newValue);
    saveRetainer(newValue);
  }, [retainer, saveRetainer]);

  // Save Shoulder Measurement
  const saveShoulder = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    setIsSavingShoulder(true);
    setShoulderSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: 'Shoulder Measurement', value: numValue, type: 'number' }),
      });
      if (response.ok) {
        setShoulderSaved(true);
        setTimeout(() => setShoulderSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving shoulder measurement:', error);
    } finally {
      setIsSavingShoulder(false);
    }
  }, []);

  const handleShoulderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShoulderMeasurement(value);
    setShoulderSaved(false);
    if (shoulderDebounceRef.current) clearTimeout(shoulderDebounceRef.current);
    shoulderDebounceRef.current = setTimeout(() => saveShoulder(value), 800);
  }, [saveShoulder]);

  const handleShoulderBlur = useCallback(() => {
    if (shoulderDebounceRef.current) clearTimeout(shoulderDebounceRef.current);
    saveShoulder(shoulderMeasurement);
  }, [shoulderMeasurement, saveShoulder]);

  // Save Thigh Measurement
  const saveThigh = useCallback(async (value: string) => {
    if (!value || value.trim() === '') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    setIsSavingThigh(true);
    setThighSaved(false);
    try {
      const response = await fetch('/api/notion/habits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: 'Thigh Measurement', value: numValue, type: 'number' }),
      });
      if (response.ok) {
        setThighSaved(true);
        setTimeout(() => setThighSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving thigh measurement:', error);
    } finally {
      setIsSavingThigh(false);
    }
  }, []);

  const handleThighChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setThighMeasurement(value);
    setThighSaved(false);
    if (thighDebounceRef.current) clearTimeout(thighDebounceRef.current);
    thighDebounceRef.current = setTimeout(() => saveThigh(value), 800);
  }, [saveThigh]);

  const handleThighBlur = useCallback(() => {
    if (thighDebounceRef.current) clearTimeout(thighDebounceRef.current);
    saveThigh(thighMeasurement);
  }, [thighMeasurement, saveThigh]);

  useEffect(() => {
    return () => {
      if (weightDebounceRef.current) clearTimeout(weightDebounceRef.current);
      if (shoulderDebounceRef.current) clearTimeout(shoulderDebounceRef.current);
      if (thighDebounceRef.current) clearTimeout(thighDebounceRef.current);
    };
  }, []);

  const handleOpenCameraForVideo = useCallback(() => {
    const videoInput = document.createElement('input');
    videoInput.type = 'file';
    videoInput.accept = 'video/*';
    videoInput.capture = 'environment';
    videoInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setVideoRecorded(true);
        console.log('Video captured:', file.name, file.size);
      }
    };
    videoInput.click();
  }, []);

  // Body Progress Photo handlers
  const handleBodyFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBodyPhotoUrl(url);
      setBodyPhotoSource('library');
      setShowBodyPhotoOptions(false);
    }
  }, []);

  const handleBodyCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBodyPhotoUrl(url);
      setBodyPhotoSource('camera');
      setShowBodyPhotoOptions(false);
    }
  }, []);

  const handleRemoveBodyPhoto = useCallback(() => {
    if (bodyPhotoUrl) URL.revokeObjectURL(bodyPhotoUrl);
    setBodyPhotoUrl(null);
    setBodyPhotoSource(null);
  }, [bodyPhotoUrl]);

  // Face Progress Photo handlers
  const handleFaceFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFacePhotoUrl(url);
      setFacePhotoSource('library');
      setShowFacePhotoOptions(false);
    }
  }, []);

  const handleFaceCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFacePhotoUrl(url);
      setFacePhotoSource('camera');
      setShowFacePhotoOptions(false);
    }
  }, []);

  const handleRemoveFacePhoto = useCallback(() => {
    if (facePhotoUrl) URL.revokeObjectURL(facePhotoUrl);
    setFacePhotoUrl(null);
    setFacePhotoSource(null);
  }, [facePhotoUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (weight && !weightSaved) await saveWeight(weight);
      if (bodyPhotoUrl && bodyPhotoSource) console.log('Body progress photo to upload:', bodyPhotoSource);
      if (facePhotoUrl && facePhotoSource) console.log('Face progress photo to upload:', facePhotoSource);

      // Turn off LIFX lights after morning form completion
      onMorningFormComplete();

      onClose();
    } catch (error) {
      console.error('Error submitting morning check in:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [weight, weightSaved, saveWeight, bodyPhotoUrl, bodyPhotoSource, facePhotoUrl, facePhotoSource, onClose, onMorningFormComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="morning-modal-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] m-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 id="morning-modal-title" className="text-lg font-semibold">Morning Check In</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background/50 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-2">
            <label htmlFor="modal-weight" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Scale className="w-4 h-4 text-muted-foreground" />Weight
            </label>
            <div className="relative">
              <input ref={weightInputRef} id="modal-weight" type="number" step="0.1" placeholder="Enter weight..." value={weight} onChange={handleWeightChange} onBlur={handleWeightBlur} className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSavingWeight && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {weightSaved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
                <span className="text-sm text-muted-foreground">lbs</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Saves to Notion Habits as you type</p>
          </div>
          {/* Teeth Grind Rating */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground" />Teeth Grind Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => handleTeethGrindClick(rating)} disabled={isSavingGrind}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${teethGrindRating === rating ? 'bg-amber-500 text-white border-amber-500' : 'bg-background border-input hover:bg-muted hover:border-muted-foreground/30'} ${isSavingGrind ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {rating}
                </button>
              ))}
              {isSavingGrind && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-1" />}
              {grindSaved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /></span>}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>None</span><span>Mild</span><span>Moderate</span><span>Strong</span><span>Severe</span>
            </div>
          </div>
          {/* Retainer */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground" />Retainer
            </label>
            <button type="button" onClick={handleRetainerToggle} disabled={isSavingRetainer}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${retainer ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400' : 'bg-background border-input hover:bg-muted hover:border-muted-foreground/30'} ${isSavingRetainer ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="text-sm font-medium">{retainer ? 'Wore Retainer ✓' : 'Wore Retainer?'}</span>
              <div className="flex items-center gap-2">
                {isSavingRetainer && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {retainerSaved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${retainer ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}>
                  {retainer && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          </div>
          {/* Body Measurements */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Ruler className="w-4 h-4 text-muted-foreground" />Body Measurements
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="modal-shoulder" className="text-xs text-muted-foreground">Shoulder (in)</label>
                <div className="relative">
                  <input id="modal-shoulder" type="number" step="0.1" placeholder="0.0" value={shoulderMeasurement} onChange={handleShoulderChange} onBlur={handleShoulderBlur}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSavingShoulder && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    {shoulderSaved && <Check className="w-3 h-3 text-green-500" />}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="modal-thigh" className="text-xs text-muted-foreground">Thigh (in)</label>
                <div className="relative">
                  <input id="modal-thigh" type="number" step="0.1" placeholder="0.0" value={thighMeasurement} onChange={handleThighChange} onBlur={handleThighBlur}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSavingThigh && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    {thighSaved && <Check className="w-3 h-3 text-green-500" />}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Saves automatically after typing</p>
          </div>
          {/* Morning Video */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Video className="w-4 h-4 text-muted-foreground" />Morning Video
            </label>
            <button type="button" onClick={handleOpenCameraForVideo} className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${videoRecorded ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400' : 'border-dashed border-muted-foreground/30 hover:border-amber-500/50 hover:bg-amber-500/5'}`}>
              {videoRecorded ? (<><Check className="w-5 h-5" /><span>Video Recorded</span></>) : (<><Video className="w-5 h-5 text-muted-foreground" /><div className="text-left"><div className="text-sm font-medium">Open Camera</div><div className="text-xs text-muted-foreground">Record 45-sec AM video</div></div></>)}
            </button>
          </div>
          {/* Body Progress Photo */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Camera className="w-4 h-4 text-muted-foreground" />Body Progress
            </label>
            <input ref={bodyFileInputRef} type="file" accept="image/*" onChange={handleBodyFileSelect} className="hidden" />
            <input ref={bodyCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleBodyCameraCapture} className="hidden" />
            {bodyPhotoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={bodyPhotoUrl} alt="Body progress photo" className="w-full h-32 object-cover" />
                <button type="button" onClick={handleRemoveBodyPhoto} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"><X className="w-4 h-4 text-white" /></button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">{bodyPhotoSource === 'camera' ? 'Camera' : 'Library'}</div>
              </div>
            ) : (
              <div className="relative">
                <button type="button" onClick={() => { setShowBodyPhotoOptions(!showBodyPhotoOptions); setShowFacePhotoOptions(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/20 transition-all duration-200 text-muted-foreground">
                  <Camera className="w-5 h-5" /><span>Add body photo</span>
                </button>
                {showBodyPhotoOptions && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                    <button type="button" onClick={() => bodyFileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Image className="w-5 h-5 text-muted-foreground" /><div><div className="text-sm font-medium">Upload from Library</div><div className="text-xs text-muted-foreground">Choose from your photos</div></div>
                    </button>
                    <button type="button" onClick={() => bodyCameraInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Camera className="w-5 h-5 text-muted-foreground" /><div><div className="text-sm font-medium">Camera</div><div className="text-xs text-muted-foreground">Take a photo now</div></div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Face Progress Photo */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Camera className="w-4 h-4 text-muted-foreground" />Face Progress
            </label>
            <input ref={faceFileInputRef} type="file" accept="image/*" onChange={handleFaceFileSelect} className="hidden" />
            <input ref={faceCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFaceCameraCapture} className="hidden" />
            {facePhotoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={facePhotoUrl} alt="Face progress photo" className="w-full h-32 object-cover" />
                <button type="button" onClick={handleRemoveFacePhoto} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"><X className="w-4 h-4 text-white" /></button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">{facePhotoSource === 'camera' ? 'Camera' : 'Library'}</div>
              </div>
            ) : (
              <div className="relative">
                <button type="button" onClick={() => { setShowFacePhotoOptions(!showFacePhotoOptions); setShowBodyPhotoOptions(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/20 transition-all duration-200 text-muted-foreground">
                  <Camera className="w-5 h-5" /><span>Add face photo</span>
                </button>
                {showFacePhotoOptions && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-lg shadow-lg z-10 animate-in fade-in-0 slide-in-from-top-2">
                    <button type="button" onClick={() => faceFileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Image className="w-5 h-5 text-muted-foreground" /><div><div className="text-sm font-medium">Upload from Library</div><div className="text-xs text-muted-foreground">Choose from your photos</div></div>
                    </button>
                    <button type="button" onClick={() => faceCameraInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                      <Camera className="w-5 h-5 text-muted-foreground" /><div><div className="text-sm font-medium">Camera</div><div className="text-xs text-muted-foreground">Take a photo now</div></div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MorningFormTile;
