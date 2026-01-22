'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Image,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Trash2,
  ImageOff,
} from 'lucide-react';
import { usePhotoSlideshow } from '@/hooks/usePhotoSlideshow';
import { CATEGORY_CONFIGS, getAllCategories } from '@/lib/slideshow/categories';
import type { Photo, PhotoCategory } from '@/lib/slideshow/types';
import type { TileComponentProps } from '../TileRegistry';

/**
 * PhotoSlideshowTile - Compact tile showing mini auto-advancing slideshow
 *
 * Displays:
 * - Auto-rotating photo every 5 seconds
 * - Photo count badge
 * - Opens modal with full carousel on click
 */
export function PhotoSlideshowTile({ tile, className }: TileComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { photos, isLoading, totalCount } = usePhotoSlideshow('all');

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [photos.length]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const currentPhoto = photos[currentIndex];

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-purple-500/10 to-pink-500/10
    border border-purple-500/30
    rounded-lg
    hover:from-purple-500/20 hover:to-pink-500/20
    hover:border-purple-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:ring-offset-2
    overflow-hidden
    ${className ?? ''}
  `.trim();

  return (
    <>
      <div
        className={baseClasses}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label={`Open ${tile.name}`}
        aria-haspopup="dialog"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        {/* Background photo preview */}
        {currentPhoto && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 transition-opacity duration-500"
            style={{ backgroundImage: `url(${currentPhoto.publicUrl})` }}
          />
        )}

        {/* Header */}
        <div className="relative flex items-center justify-between mb-2 z-10">
          <Image className="w-5 h-5 text-purple-500" />
          {totalCount > 0 && (
            <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {totalCount} photos
            </span>
          )}
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-end z-10">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex items-center gap-2">
              <ImageOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">No photos yet</span>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-foreground truncate">
                {currentPhoto?.caption || 'Photo Slideshow'}
              </span>
              {currentPhoto && (
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_CONFIGS[currentPhoto.category]?.emoji}{' '}
                  {CATEGORY_CONFIGS[currentPhoto.category]?.label}
                </span>
              )}
            </>
          )}
        </div>

        {/* Progress dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {photos.slice(0, Math.min(5, photos.length)).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex % Math.min(5, photos.length)
                    ? 'bg-purple-500'
                    : 'bg-purple-500/30'
                }`}
              />
            ))}
            {photos.length > 5 && (
              <span className="text-[10px] text-purple-400 ml-1">
                +{photos.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <PhotoSlideshowModal onClose={handleClose} />
      )}
    </>
  );
}

/**
 * PhotoSlideshowModal - Full slideshow view with carousel and upload
 */
function PhotoSlideshowModal({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<PhotoCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    photos,
    isLoading,
    totalCount,
    upload,
    isUploading,
    remove,
    isDeleting,
  } = usePhotoSlideshow(activeCategory);

  const categories = getAllCategories();

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    },
    [onClose, handlePrev, handleNext]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const category = activeCategory === 'all' ? 'inspo' : activeCategory;

      upload({
        file,
        payload: { category },
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowUpload(false);
    },
    [activeCategory, upload]
  );

  const handleDelete = useCallback(
    (photoId: string) => {
      if (confirm('Delete this photo?')) {
        remove(photoId);
      }
    },
    [remove]
  );

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slideshow-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          relative
          w-full max-w-5xl
          h-[90vh]
          m-4
          bg-background
          border border-border
          rounded-xl
          shadow-2xl
          overflow-hidden
          flex flex-col
          animate-in fade-in-0 zoom-in-95
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-500" />
            <h2 id="slideshow-title" className="text-lg font-semibold">
              Photo Slideshow
            </h2>
            <span className="text-sm text-muted-foreground">
              ({totalCount} photos)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Add Photo
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-3 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading photos...</span>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <ImageOff className="w-16 h-16 opacity-50" />
              <p>No photos in this category</p>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add First Photo
              </button>
            </div>
          ) : (
            <>
              {/* Photo Display */}
              <div className="relative w-full h-full flex items-center justify-center p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPhoto?.publicUrl}
                  alt={currentPhoto?.caption || 'Photo'}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />

                {/* Photo Info Overlay */}
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                    {currentPhoto?.caption && (
                      <p className="text-white font-medium mb-1">
                        {currentPhoto.caption}
                      </p>
                    )}
                    <p className="text-white/70 text-sm">
                      {CATEGORY_CONFIGS[currentPhoto?.category || 'inspo']?.emoji}{' '}
                      {CATEGORY_CONFIGS[currentPhoto?.category || 'inspo']?.label}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => currentPhoto && handleDelete(currentPhoto.id)}
                    disabled={isDeleting}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    aria-label="Delete photo"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Photo Counter */}
        {photos.length > 0 && (
          <div className="flex justify-center p-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Photo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a photo to add to{' '}
                {activeCategory === 'all'
                  ? 'your collection'
                  : CATEGORY_CONFIGS[activeCategory].label}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose Photo
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoSlideshowTile;
