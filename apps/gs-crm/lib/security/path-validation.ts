/**
 * Path Validation Utilities
 *
 * Prevents path traversal attacks across all file operations.
 * Phase 0: File/path safety for the MLS upload patch plan.
 */

import path from 'path'

/**
 * Validate that a file ID contains only safe characters.
 * Rejects any traversal sequences, shell metacharacters, or path separators.
 *
 * @example
 * validateFileId('breakups_1708900000_abc1234') // OK
 * validateFileId('../../.env')                   // throws
 */
export function validateFileId(fileId: unknown): string {
  if (typeof fileId !== 'string' || fileId.length === 0) {
    throw new PathValidationError('File ID is required')
  }
  if (fileId.length > 255) {
    throw new PathValidationError('File ID too long')
  }
  // Allow alphanumeric, hyphens, underscores, and dots (but not leading dots)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(fileId)) {
    throw new PathValidationError('File ID contains invalid characters')
  }
  // Extra safety: reject any traversal patterns even if regex above should catch them
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    throw new PathValidationError('File ID contains path traversal sequence')
  }
  return fileId
}

/**
 * Validate that a path component (folder name or file name) is safe.
 * Does not allow path separators or traversal sequences.
 */
export function validatePathComponent(component: string, fieldName: string = 'path'): string {
  if (!component || typeof component !== 'string') {
    throw new PathValidationError(`${fieldName} is required`)
  }
  if (component.includes('..')) {
    throw new PathValidationError(`${fieldName} contains traversal sequence`)
  }
  if (component.includes('/') || component.includes('\\')) {
    throw new PathValidationError(`${fieldName} contains path separator`)
  }
  if (component.includes('\0')) {
    throw new PathValidationError(`${fieldName} contains null byte`)
  }
  return component
}

/**
 * Verify that a resolved path stays within a base directory.
 * Uses path.resolve() for canonicalization — does NOT follow symlinks
 * (use fs.realpath for symlink resolution when the file must already exist).
 */
export function isPathWithinBase(targetPath: string, basePath: string): boolean {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedBase = path.resolve(basePath)
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep)
}

/**
 * Build a safe file path within a base directory, rejecting traversal.
 * Throws if the resulting path escapes the base.
 *
 * @example
 * safePath('/app/tmp/reportit', fileId, '.xlsx')
 */
export function safePath(baseDir: string, ...segments: string[]): string {
  // Validate each segment individually
  for (const seg of segments) {
    if (seg.includes('..') || seg.includes('\0')) {
      throw new PathValidationError('Path segment contains traversal or null byte')
    }
  }

  const result = path.join(baseDir, ...segments)

  if (!isPathWithinBase(result, baseDir)) {
    throw new PathValidationError('Resolved path escapes base directory')
  }

  return result
}

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PathValidationError'
  }
}
