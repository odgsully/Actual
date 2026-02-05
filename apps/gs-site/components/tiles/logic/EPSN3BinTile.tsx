'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Settings2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { useEPSN3Uploads } from '@/hooks/useEPSN3Uploads';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface EPSN3Config {
  /** Target upload frequency in days */
  targetFrequency?: number;
  /** Allowed file types (extensions) */
  allowedTypes?: string[];
}

interface EPSN3BinTileProps {
  tile: Tile;
  config?: EPSN3Config;
  className?: string;
}

// ============================================================
// Local Storage Keys (config only)
// ============================================================

const STORAGE_KEY_CONFIG = 'epsn3_config';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: EPSN3Config = {
  targetFrequency: 7,
  allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.md', '.jpg', '.png', '.zip'],
};

// ============================================================
// Utility Functions
// ============================================================

function getDaysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function loadConfig(): EPSN3Config {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: EPSN3Config) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }
}

// ============================================================
// Main Component
// ============================================================

export function EPSN3BinTile({
  tile,
  config: initialConfig,
  className,
}: EPSN3BinTileProps) {
  const [config, setConfig] = useState<EPSN3Config>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig();
  });

  const { uploads, isLoading, upload, isUploading, remove, isDeleting } = useEPSN3Uploads();

  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const targetFrequency = config.targetFrequency || DEFAULT_CONFIG.targetFrequency!;
  const daysSinceLastUpload = uploads.length > 0
    ? getDaysSinceDate(uploads[0].uploadDate)
    : Infinity;
  const isFrequencyMet = daysSinceLastUpload <= targetFrequency;
  const frequencyWarning = !isFrequencyMet && uploads.length > 0;

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type if restrictions exist
        if (config.allowedTypes && config.allowedTypes.length > 0) {
          const ext = '.' + file.name.split('.').pop()?.toLowerCase();
          if (!config.allowedTypes.includes(ext)) {
            continue;
          }
        }

        upload(file, {
          onSuccess: () => {
            setJustUploaded(true);
            setTimeout(() => setJustUploaded(false), 2000);
          },
        });
      }
    },
    [config.allowedTypes, upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDeleteUpload = useCallback(
    (id: string) => {
      remove(id);
    },
    [remove]
  );

  const handleFrequencyChange = (frequency: number) => {
    if (frequency > 0 && frequency <= 365) {
      const newConfig = { ...config, targetFrequency: frequency };
      setConfig(newConfig);
      if (!initialConfig) saveConfig(newConfig);
    }
  };

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[7rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${isDragging ? 'border-primary border-2 bg-accent' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail
      active={tile.actionWarning || frequencyWarning}
      hoverMessage={tile.actionDesc || 'Upload frequency target not met'}
    >
      <div
        className={baseClasses}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name}
            </h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 bg-accent rounded-md space-y-2"
          >
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Target Frequency (days)
              </label>
              <input
                type="number"
                value={targetFrequency}
                onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <div>Total uploads: {uploads.length}</div>
              <div>
                Last upload:{' '}
                {uploads.length > 0
                  ? daysSinceLastUpload === 0
                    ? 'today'
                    : `${daysSinceLastUpload} day${daysSinceLastUpload !== 1 ? 's' : ''} ago`
                  : 'never'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Upload Zone */}
          <label
            className={`
              flex flex-col items-center justify-center
              p-3 border-2 border-dashed rounded-md
              cursor-pointer transition-all
              ${isDragging ? 'border-primary bg-accent' : 'border-muted'}
              hover:border-muted-foreground/50 hover:bg-accent/50
            `}
          >
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              aria-label="Upload files"
            />

            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-center"
                >
                  <Loader2 className="w-6 h-6 text-muted-foreground mx-auto mb-1 animate-spin" />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </motion.div>
              ) : justUploaded ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-center"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Uploaded!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">
                    Drop files or click
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </label>

          {/* Frequency Status */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Target: every {targetFrequency} day{targetFrequency !== 1 ? 's' : ''}
            </span>
            {uploads.length > 0 && (
              <div
                className={`flex items-center gap-1 ${
                  isFrequencyMet ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isFrequencyMet ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{daysSinceLastUpload}d</span>
              </div>
            )}
          </div>

          {/* Recent Uploads List (collapsed) */}
          {!showSettings && uploads.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Last: {uploads[0].fileName.slice(0, 20)}
              {uploads[0].fileName.length > 20 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-8 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>
    </WarningBorderTrail>
  );
}

export default EPSN3BinTile;
