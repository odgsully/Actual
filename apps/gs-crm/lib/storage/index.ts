/**
 * GSRealty Storage System - Main Export
 *
 * Centralized exports for all storage functionality
 * Import from this file for convenience
 */

// Configuration
export * from './config'

// Supabase Storage
export {
  initializeStorage,
  uploadToSupabase,
  uploadBufferToSupabase,
  downloadFromSupabase,
  createSignedUrl,
  deleteFromSupabase,
  deleteMultipleFromSupabase,
  listFilesInFolder,
  listClientFiles,
  fileExists,
  getFileMetadata,
} from './supabase-storage'

// Local Storage
export {
  createClientFolder,
  saveToLocalFolder,
  saveFileToFolder,
  saveBlobToFolder,
  listLocalFiles,
  listClientFolders,
  folderExists,
  fileExistsInFolder,
  deleteLocalFile,
  deleteClientFolder,
  getLocalFileStats,
  readLocalFile,
  ensureBasePathExists,
} from './local-storage'

// Types (re-export for convenience)
export type {
  FileType,
  UploadType,
  ProcessingStatus,
  StorageFolder,
  UploadedFile,
  RecordFileUploadInput,
  StorageFile,
  UploadResult,
  DownloadResult,
  DeleteResult,
  ListFilesResult,
  LocalFolderResult,
  LocalFileSaveResult,
  FileValidation,
  UploadMetadata,
  StorageStats,
} from '@/lib/types/storage'
