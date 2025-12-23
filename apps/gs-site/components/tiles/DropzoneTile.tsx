'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { WarningBorderTrail } from './WarningBorderTrail';
import type { TileComponentProps } from './TileRegistry';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

/**
 * Format bytes to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * DropzoneTile - File upload tile with drag-and-drop
 *
 * Provides a dropzone for file uploads. Used for tiles like:
 * - EPSN3 Bin
 * - Habitat Pic
 *
 * Features:
 * - Drag-and-drop zone
 * - Click to browse files
 * - File type validation
 * - Upload progress indicator
 * - Multi-file support
 * - Keyboard accessible
 */
export function DropzoneTile({ tile, className }: TileComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed file types (configurable per tile in future)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return `Invalid file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`;
      }
      if (file.size > maxFileSize) {
        return `File too large. Max size: ${formatFileSize(maxFileSize)}`;
      }
      return null;
    },
    [allowedTypes, maxFileSize]
  );

  const simulateUpload = useCallback(async (uploadFile: UploadedFile) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
      );
    }

    // Simulate success (90% of time) or error
    const success = Math.random() > 0.1;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: success ? 'success' : 'error',
              error: success ? undefined : 'Upload failed. Please try again.',
            }
          : f
      )
    );
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        const uploadFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          status: error ? 'error' : 'uploading',
          progress: 0,
          error: error || undefined,
        };
        newFiles.push(uploadFile);

        if (!error) {
          simulateUpload(uploadFile);
        }
      });

      setFiles((prev) => [...prev, ...newFiles]);
      setIsExpanded(true);
    },
    [validateFile, simulateUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    min-h-[7rem]
    bg-card
    border-2 border-dashed
    ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
    rounded-lg
    hover:border-muted-foreground/50
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
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Upload files to ${tile.name}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleInputChange}
          />

          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Upload
              className={`
                w-6 h-6 mb-2
                ${isDragging ? 'text-primary' : 'text-muted-foreground'}
                group-hover:text-foreground
                transition-colors
              `}
            />
            <h3 className="text-sm font-medium text-foreground">
              {tile.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isDragging ? 'Drop files here' : 'Drag & drop or click'}
            </p>
          </div>

          {/* File count badge */}
          {files.length > 0 && (
            <div className="absolute bottom-2 right-2">
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {files.length}
              </span>
            </div>
          )}

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

      {/* Expanded file list modal */}
      {isExpanded && files.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative w-full max-w-md m-4 bg-background border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 id="upload-title" className="text-lg font-semibold">
                {tile.name} - Uploads
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File list */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <ul className="space-y-2">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                  >
                    <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {file.status === 'uploading' && (
                        <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {file.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-accent rounded flex-shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleClick}
                className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Upload More Files
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DropzoneTile;
