'use client';

import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileWarning,
  X,
} from 'lucide-react';
import { useDirectoryHealth, DirectoryResult } from '@/hooks/useDirectoryHealth';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface DirectoryHealthTileProps {
  tile: Tile;
  className?: string;
}

/**
 * DirectoryHealthModal - Full details popup
 */
function DirectoryHealthModal({
  onClose,
  data,
  isLoading,
  error,
  refetch,
}: {
  onClose: () => void;
  data: ReturnType<typeof useDirectoryHealth>['data'];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}) {
  const getStatusColor = (count: number) => {
    if (count === 0) return 'text-green-500';
    if (count <= 3) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getBgColor = (count: number) => {
    if (count === 0) return 'bg-green-500/10';
    if (count <= 3) return 'bg-yellow-500/10';
    return 'bg-orange-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Folder Health</h2>
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-muted-foreground mb-4">Failed to scan directories</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success state */}
          {!error && data && (
            <>
              {/* Summary */}
              <div className={`flex items-center justify-center gap-3 p-4 rounded-lg mb-6 ${getBgColor(data.totalUnexpected)}`}>
                {data.totalUnexpected === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <FileWarning className={`w-8 h-8 ${getStatusColor(data.totalUnexpected)}`} />
                )}
                <div>
                  <span className={`text-3xl font-bold ${getStatusColor(data.totalUnexpected)}`}>
                    {data.totalUnexpected}
                  </span>
                  <span className="text-lg text-muted-foreground ml-2">
                    unexpected {data.totalUnexpected === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Directory breakdown */}
              <div className="space-y-4">
                {data.directories
                  .filter((d) => !d.skipped)
                  .map((dir) => (
                    <DirectoryCard key={dir.key} dir={dir} />
                  ))}

                {/* Skipped directories */}
                {data.directories.filter((d) => d.skipped).length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Skipped (all items OK):</p>
                    <div className="flex flex-wrap gap-2">
                      {data.directories
                        .filter((d) => d.skipped)
                        .map((dir) => (
                          <span
                            key={dir.key}
                            className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                          >
                            {dir.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground text-center mt-6">
                Last scanned: {new Date(data.timestamp).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DirectoryCard - Shows a single directory's status
 */
function DirectoryCard({ dir }: { dir: DirectoryResult }) {
  const isClean = dir.count === 0 && dir.success;
  const hasError = !dir.success;

  return (
    <div className={`p-4 rounded-lg border ${
      hasError ? 'border-red-500/30 bg-red-500/5' :
      isClean ? 'border-green-500/30 bg-green-500/5' :
      'border-yellow-500/30 bg-yellow-500/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Folder className={`w-4 h-4 ${
            hasError ? 'text-red-500' :
            isClean ? 'text-green-500' :
            'text-yellow-500'
          }`} />
          <span className="font-medium">{dir.name}</span>
        </div>
        <span className={`text-sm font-medium ${
          hasError ? 'text-red-500' :
          isClean ? 'text-green-500' :
          'text-yellow-500'
        }`}>
          {hasError ? 'Error' : isClean ? 'Clean' : `${dir.count} unexpected`}
        </span>
      </div>

      {/* Error message */}
      {hasError && dir.error && (
        <p className="text-sm text-red-400 mt-1">{dir.error}</p>
      )}

      {/* Unexpected items list */}
      {dir.unexpected.length > 0 && (
        <div className="mt-2 space-y-1">
          {dir.unexpected.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-muted-foreground pl-6"
            >
              <span className="text-yellow-500">•</span>
              <span className="truncate" title={item}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Path (collapsed) */}
      <p className="text-xs text-muted-foreground/60 mt-2 truncate" title={dir.path}>
        {dir.path.replace(/^\/Users\/[^/]+/, '~')}
      </p>
    </div>
  );
}

/**
 * DirectoryHealthTile - Shows unexpected files in monitored directories
 * Click to open full details modal
 */
export function DirectoryHealthTile({ tile, className }: DirectoryHealthTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error, refetch } = useDirectoryHealth();

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const getStatusColor = (count: number, hasError: boolean) => {
    if (hasError) return 'text-red-500';
    if (count === 0) return 'text-green-500';
    if (count <= 3) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getBgColor = (count: number) => {
    if (count === 0) return 'bg-green-500/10';
    if (count <= 3) return 'bg-yellow-500/10';
    return 'bg-orange-500/10';
  };

  return (
    <>
      <WarningBorderTrail
        active={false}
        hoverMessage={undefined}
      >
        <div
          className={baseClasses}
          onClick={() => setIsModalOpen(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-foreground">
                Folder Health
              </span>
            </div>
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Loading */}
            {isLoading && !data && (
              <div className="animate-pulse">
                <div className="h-6 w-12 bg-muted rounded" />
              </div>
            )}

            {/* Error */}
            {error && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}

            {/* Success */}
            {!isLoading && !error && data && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${getBgColor(data.totalUnexpected)}`}>
                {data.totalUnexpected === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <FileWarning className={`w-5 h-5 ${getStatusColor(data.totalUnexpected, false)}`} />
                )}
                <span className={`text-xl font-bold ${getStatusColor(data.totalUnexpected, false)}`}>
                  {data.totalUnexpected}
                </span>
              </div>
            )}
          </div>

          {/* Mini badges */}
          {data && (
            <div className="flex items-center justify-center gap-1.5">
              {data.directories
                .filter((d) => !d.skipped)
                .map((dir) => (
                  <div
                    key={dir.key}
                    className={`w-2 h-2 rounded-full ${
                      dir.count === 0 ? 'bg-green-500' :
                      dir.count <= 3 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    title={`${dir.name}: ${dir.count}`}
                  />
                ))}
            </div>
          )}

          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {isModalOpen && (
        <DirectoryHealthModal
          onClose={() => setIsModalOpen(false)}
          data={data}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
        />
      )}
    </>
  );
}

export default DirectoryHealthTile;
