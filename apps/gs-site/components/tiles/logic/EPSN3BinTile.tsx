'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Settings2, FileText, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface UploadRecord {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  fileType: string;
}

export interface EPSN3Config {
  /** Target upload frequency in days */
  targetFrequency?: number;
  /** Maximum number of uploads to track */
  maxRecords?: number;
  /** Allowed file types (extensions) */
  allowedTypes?: string[];
}

interface EPSN3BinTileProps {
  tile: Tile;
  config?: EPSN3Config;
  className?: string;
}

// ============================================================
// Local Storage Keys
// ============================================================

const STORAGE_KEY_UPLOADS = 'epsn3_uploads';
const STORAGE_KEY_CONFIG = 'epsn3_config';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: EPSN3Config = {
  targetFrequency: 7, // Weekly uploads
  maxRecords: 50,
  allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.md', '.jpg', '.png', '.zip'],
};

// ============================================================
// Utility Functions
// ============================================================

function getDaysSinceLastUpload(uploads: UploadRecord[]): number {
  if (uploads.length === 0) return Infinity;

  const sortedUploads = [...uploads].sort(
    (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const lastUpload = new Date(sortedUploads[0].uploadDate);
  const now = new Date();
  const diff = now.getTime() - lastUpload.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function saveUploads(uploads: UploadRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_UPLOADS, JSON.stringify(uploads));
  }
}

function loadUploads(): UploadRecord[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_UPLOADS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((record: any) => ({
          ...record,
          uploadDate: new Date(record.uploadDate),
        }));
      } catch {
        return [];
      }
    }
  }
  return [];
}

function saveConfig(config: EPSN3Config) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }
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

// ============================================================
// Main Component
// ============================================================

/**
 * EPSN3BinTile - Upload tracking with frequency monitoring
 *
 * "EPSN3" appears to be a specific document/file tracking system.
 * This tile tracks upload cadence and alerts when frequency target is not met.
 *
 * Features:
 * - Pure frontend file upload tracking (no API calls)
 * - Configurable upload frequency target
 * - Local file metadata storage (no actual file upload)
 * - Upload history with timestamps
 * - Warning when upload frequency falls below target
 * - Persistent state in localStorage
 * - Works completely offline
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <EPSN3BinTile
 *   tile={tile}
 *   config={{
 *     targetFrequency: 7, // Weekly
 *     maxRecords: 50,
 *     allowedTypes: ['.pdf', '.doc', '.docx'],
 *   }}
 * />
 * ```
 */
export function EPSN3BinTile({
  tile,
  config: initialConfig,
  className,
}: EPSN3BinTileProps) {
  const [config, setConfig] = useState<EPSN3Config>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig();
  });

  const [uploads, setUploads] = useState<UploadRecord[]>(() => loadUploads());
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const targetFrequency = config.targetFrequency || DEFAULT_CONFIG.targetFrequency!;
  const daysSinceLastUpload = getDaysSinceLastUpload(uploads);
  const isFrequencyMet = daysSinceLastUpload <= targetFrequency;
  const frequencyWarning = !isFrequencyMet && uploads.length > 0;

  // Save uploads when changed
  useEffect(() => {
    saveUploads(uploads);
  }, [uploads]);

  // Save config when changed
  useEffect(() => {
    if (!initialConfig) {
      saveConfig(config);
    }
  }, [config, initialConfig]);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newUploads: UploadRecord[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type if restrictions exist
        if (config.allowedTypes && config.allowedTypes.length > 0) {
          const ext = '.' + file.name.split('.').pop()?.toLowerCase();
          if (!config.allowedTypes.includes(ext)) {
            continue; // Skip disallowed file types
          }
        }

        newUploads.push({
          id: `${Date.now()}-${i}`,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date(),
          fileType: file.type || 'unknown',
        });
      }

      if (newUploads.length > 0) {
        setUploads((prev) => {
          const combined = [...newUploads, ...prev];
          const maxRecords = config.maxRecords || DEFAULT_CONFIG.maxRecords!;
          return combined.slice(0, maxRecords);
        });

        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2000);
      }
    },
    [config.allowedTypes, config.maxRecords]
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

  const handleDeleteUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  const handleFrequencyChange = (frequency: number) => {
    if (frequency > 0 && frequency <= 365) {
      setConfig((prev) => ({ ...prev, targetFrequency: frequency }));
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
              {justUploaded ? (
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
