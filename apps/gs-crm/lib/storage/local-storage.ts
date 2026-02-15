/**
 * Local MacOS Storage Integration
 *
 * Handles local file storage in MacOS folder structure
 * Path: /Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/
 * Format: {LastName} {MM.YY}/
 */

import fs from 'fs/promises'
import path from 'path'
import { STORAGE_CONFIG, generateLocalFolderName } from './config'
import type { LocalFolderResult, LocalFileSaveResult } from '@/lib/types/storage'

/**
 * Create client folder in local MacOS structure
 * Format: "LastName MM.YY"
 *
 * @param lastName - Client last name
 * @param date - Date for folder naming (defaults to current date)
 * @returns Folder path and name
 */
export async function createClientFolder(
  lastName: string,
  date: Date = new Date()
): Promise<LocalFolderResult> {
  try {
    const folderName = generateLocalFolderName(lastName, date)
    const folderPath = path.join(STORAGE_CONFIG.localBasePath, folderName)

    // Check if folder already exists
    try {
      await fs.access(folderPath)
      console.log('[Local Storage] Folder already exists:', folderPath)
      return { folderPath, folderName, error: null }
    } catch {
      // Folder doesn't exist, create it
    }

    // Create folder
    await fs.mkdir(folderPath, { recursive: true })

    console.log('[Local Storage] Folder created:', folderPath)
    return { folderPath, folderName, error: null }
  } catch (error) {
    console.error('[Local Storage] Error creating folder:', error)
    return {
      folderPath: null,
      folderName: generateLocalFolderName(lastName, date),
      error: error as Error,
    }
  }
}

/**
 * Save file to local MacOS folder
 *
 * @param clientLastName - Client last name
 * @param month - Month string (MM)
 * @param year - Year string (YY)
 * @param fileName - File name
 * @param data - File data as Buffer
 * @returns Saved file path
 */
export async function saveToLocalFolder(
  clientLastName: string,
  month: string,
  year: string,
  fileName: string,
  data: Buffer
): Promise<LocalFileSaveResult> {
  try {
    // Create folder name format: "LastName MM.YY"
    const folderName = `${clientLastName} ${month}.${year}`
    const folderPath = path.join(STORAGE_CONFIG.localBasePath, folderName)

    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true })

    // Full file path
    const filePath = path.join(folderPath, fileName)

    // Write file
    await fs.writeFile(filePath, data)

    console.log('[Local Storage] File saved:', filePath)
    return { path: filePath, error: null }
  } catch (error) {
    console.error('[Local Storage] Error saving file:', error)
    return { path: null, error: error as Error }
  }
}

/**
 * Save file to existing client folder by folder name
 *
 * @param folderName - Folder name (e.g., "Mozingo 10.25")
 * @param fileName - File name
 * @param data - File data as Buffer
 * @returns Saved file path
 */
export async function saveFileToFolder(
  folderName: string,
  fileName: string,
  data: Buffer
): Promise<LocalFileSaveResult> {
  try {
    const folderPath = path.join(STORAGE_CONFIG.localBasePath, folderName)

    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true })

    // Full file path
    const filePath = path.join(folderPath, fileName)

    // Write file
    await fs.writeFile(filePath, data)

    console.log('[Local Storage] File saved to folder:', filePath)
    return { path: filePath, error: null }
  } catch (error) {
    console.error('[Local Storage] Error saving file to folder:', error)
    return { path: null, error: error as Error }
  }
}

/**
 * Save Blob to local folder
 * Useful for downloading from Supabase and saving locally
 *
 * @param folderName - Folder name
 * @param fileName - File name
 * @param blob - Blob data
 * @returns Saved file path
 */
export async function saveBlobToFolder(
  folderName: string,
  fileName: string,
  blob: Blob
): Promise<LocalFileSaveResult> {
  try {
    const buffer = Buffer.from(await blob.arrayBuffer())
    return await saveFileToFolder(folderName, fileName, buffer)
  } catch (error) {
    console.error('[Local Storage] Error saving blob:', error)
    return { path: null, error: error as Error }
  }
}

/**
 * List files in a local client folder
 *
 * @param folderPath - Full path to folder
 * @returns Array of file names
 */
export async function listLocalFiles(folderPath: string): Promise<{
  files: string[]
  error: Error | null
}> {
  try {
    const files = await fs.readdir(folderPath)

    // Filter out hidden files and directories
    const filteredFiles = files.filter(
      (file) => !file.startsWith('.') && !file.startsWith('_')
    )

    console.log('[Local Storage] Listed files:', filteredFiles.length)
    return { files: filteredFiles, error: null }
  } catch (error) {
    console.error('[Local Storage] Error listing files:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * List all client folders in local storage
 *
 * @returns Array of folder names
 */
export async function listClientFolders(): Promise<{
  folders: string[]
  error: Error | null
}> {
  try {
    const entries = await fs.readdir(STORAGE_CONFIG.localBasePath, {
      withFileTypes: true,
    })

    // Get only directories
    const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

    console.log('[Local Storage] Listed client folders:', folders.length)
    return { folders, error: null }
  } catch (error) {
    console.error('[Local Storage] Error listing folders:', error)
    return { folders: [], error: error as Error }
  }
}

/**
 * Check if local folder exists
 *
 * @param folderName - Folder name
 * @returns True if exists
 */
export async function folderExists(folderName: string): Promise<boolean> {
  try {
    const folderPath = path.join(STORAGE_CONFIG.localBasePath, folderName)
    await fs.access(folderPath)
    return true
  } catch {
    return false
  }
}

/**
 * Check if file exists in local folder
 *
 * @param folderName - Folder name
 * @param fileName - File name
 * @returns True if exists
 */
export async function fileExistsInFolder(
  folderName: string,
  fileName: string
): Promise<boolean> {
  try {
    const filePath = path.join(STORAGE_CONFIG.localBasePath, folderName, fileName)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete file from local folder
 *
 * @param folderName - Folder name
 * @param fileName - File name
 * @returns Success status
 */
export async function deleteLocalFile(
  folderName: string,
  fileName: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const filePath = path.join(STORAGE_CONFIG.localBasePath, folderName, fileName)
    await fs.unlink(filePath)

    console.log('[Local Storage] File deleted:', filePath)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Local Storage] Error deleting file:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Delete entire client folder
 * WARNING: This will delete all files in the folder
 *
 * @param folderName - Folder name
 * @returns Success status
 */
export async function deleteClientFolder(folderName: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const folderPath = path.join(STORAGE_CONFIG.localBasePath, folderName)
    await fs.rm(folderPath, { recursive: true, force: true })

    console.log('[Local Storage] Folder deleted:', folderPath)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Local Storage] Error deleting folder:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get file stats from local folder
 *
 * @param folderName - Folder name
 * @param fileName - File name
 * @returns File stats or null
 */
export async function getLocalFileStats(
  folderName: string,
  fileName: string
): Promise<{ size: number; created: Date; modified: Date } | null> {
  try {
    const filePath = path.join(STORAGE_CONFIG.localBasePath, folderName, fileName)
    const stats = await fs.stat(filePath)

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    }
  } catch (error) {
    console.error('[Local Storage] Error getting file stats:', error)
    return null
  }
}

/**
 * Read file from local folder
 *
 * @param folderName - Folder name
 * @param fileName - File name
 * @returns File buffer or null
 */
export async function readLocalFile(
  folderName: string,
  fileName: string
): Promise<{ buffer: Buffer | null; error: Error | null }> {
  try {
    const filePath = path.join(STORAGE_CONFIG.localBasePath, folderName, fileName)
    const buffer = await fs.readFile(filePath)

    console.log('[Local Storage] File read:', filePath)
    return { buffer, error: null }
  } catch (error) {
    console.error('[Local Storage] Error reading file:', error)
    return { buffer: null, error: error as Error }
  }
}

/**
 * Ensure base storage path exists
 * Should be called on app startup
 */
export async function ensureBasePathExists(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_CONFIG.localBasePath, { recursive: true })
    console.log('[Local Storage] Base path verified:', STORAGE_CONFIG.localBasePath)
  } catch (error) {
    console.error('[Local Storage] Error creating base path:', error)
    throw error
  }
}
