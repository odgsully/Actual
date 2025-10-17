/**
 * Unit Tests for Database Files Module
 *
 * Tests CRUD operations for gsrealty_uploaded_files table
 * with mocked Supabase client.
 */

import {
  recordFileUpload,
  updateFileStatus,
  updateFileLocalPath,
  getClientFiles,
  getFileById,
  getAllFiles,
  getFilesByStatus,
  getFilesByType,
  deleteFileRecord,
  getClientFileCount,
  getTotalFileCount,
} from '../files'
import type { UploadedFile, RecordFileUploadInput } from '@/lib/types/storage'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

describe('database/files', () => {
  const mockSupabaseClient = createSupabaseClient as jest.MockedFunction<typeof createSupabaseClient>

  const mockFile: UploadedFile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    client_id: '660e8400-e29b-41d4-a716-446655440001',
    file_name: 'mls-data.csv',
    file_type: 'text/csv',
    storage_path: '/uploads/mls-data.csv',
    local_path: null,
    file_size: 102400,
    upload_date: '2024-01-01T00:00:00Z',
    uploaded_by: 'user-123',
    processed: false,
    processing_status: 'pending',
    processing_errors: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('recordFileUpload', () => {
    it('should record file upload successfully', async () => {
      const input: RecordFileUploadInput = {
        clientId: '660e8400-e29b-41d4-a716-446655440001',
        fileName: 'mls-data.csv',
        fileType: 'text/csv',
        storagePath: '/uploads/mls-data.csv',
        fileSize: 102400,
        uploadedBy: 'user-123',
        processingStatus: 'pending',
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockInsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFile,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        insert: mockInsert,
      })

      mockInsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await recordFileUpload(input)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_uploaded_files')
      expect(mockInsert).toHaveBeenCalledWith({
        client_id: input.clientId,
        file_name: input.fileName,
        file_type: input.fileType,
        storage_path: input.storagePath,
        file_size: input.fileSize,
        uploaded_by: input.uploadedBy,
        processed: false,
        processing_status: 'pending',
      })
      expect(result.file).toEqual(mockFile)
      expect(result.error).toBeNull()
    })

    it('should handle upload errors', async () => {
      const mockError = new Error('Upload failed')
      const input: RecordFileUploadInput = {
        clientId: '660e8400-e29b-41d4-a716-446655440001',
        fileName: 'test.csv',
        fileType: 'text/csv',
        storagePath: '/uploads/test.csv',
        fileSize: 1024,
        uploadedBy: 'user-123',
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockInsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        insert: mockInsert,
      })

      mockInsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await recordFileUpload(input)

      expect(result.file).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('updateFileStatus', () => {
    it('should update file status to complete', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        update: mockUpdate,
      })

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })

      const result = await updateFileStatus(mockFile.id, 'complete')

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_uploaded_files')
      expect(mockUpdate).toHaveBeenCalledWith({
        processing_status: 'complete',
        processed: true,
      })
      expect(mockEq).toHaveBeenCalledWith('id', mockFile.id)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should update file status with error message', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        update: mockUpdate,
      })

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })

      const errorMessage = 'Processing failed: Invalid data format'
      const result = await updateFileStatus(mockFile.id, 'error', errorMessage)

      expect(mockUpdate).toHaveBeenCalledWith({
        processing_status: 'error',
        processed: false,
        processing_errors: { message: errorMessage },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateFileLocalPath', () => {
    it('should update local path successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        update: mockUpdate,
      })

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })

      const localPath = '/Users/user/Documents/mls-data.csv'
      const result = await updateFileLocalPath(mockFile.id, localPath)

      expect(mockUpdate).toHaveBeenCalledWith({ local_path: localPath })
      expect(mockEq).toHaveBeenCalledWith('id', mockFile.id)
      expect(result.success).toBe(true)
    })
  })

  describe('getClientFiles', () => {
    it('should get all files for a client', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockFile],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      const result = await getClientFiles(mockFile.client_id)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_uploaded_files')
      expect(mockEq).toHaveBeenCalledWith('client_id', mockFile.client_id)
      expect(mockOrder).toHaveBeenCalledWith('upload_date', { ascending: false })
      expect(result.files).toEqual([mockFile])
      expect(result.error).toBeNull()
    })

    it('should return empty array when no files found', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      const result = await getClientFiles('non-existent-client')

      expect(result.files).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getFileById', () => {
    it('should get file by id', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFile,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await getFileById(mockFile.id)

      expect(mockEq).toHaveBeenCalledWith('id', mockFile.id)
      expect(result.file).toEqual(mockFile)
      expect(result.error).toBeNull()
    })
  })

  describe('getAllFiles', () => {
    it('should get all files with default limit', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue({
        data: [mockFile],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        limit: mockLimit,
      })

      const result = await getAllFiles()

      expect(mockLimit).toHaveBeenCalledWith(100)
      expect(result.files).toEqual([mockFile])
    })

    it('should respect custom limit', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        limit: mockLimit,
      })

      await getAllFiles(50)

      expect(mockLimit).toHaveBeenCalledWith(50)
    })
  })

  describe('getFilesByStatus', () => {
    it('should filter files by status', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockFile],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      const result = await getFilesByStatus('pending')

      expect(mockEq).toHaveBeenCalledWith('processing_status', 'pending')
      expect(result.files).toEqual([mockFile])
    })
  })

  describe('getFilesByType', () => {
    it('should filter files by type', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockFile],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        order: mockOrder,
      })

      const result = await getFilesByType('text/csv')

      expect(mockEq).toHaveBeenCalledWith('file_type', 'text/csv')
      expect(result.files).toEqual([mockFile])
    })
  })

  describe('deleteFileRecord', () => {
    it('should delete file record successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockDelete = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        delete: mockDelete,
      })

      mockDelete.mockReturnValue({
        eq: mockEq,
      })

      const result = await deleteFileRecord(mockFile.id)

      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', mockFile.id)
      expect(result.success).toBe(true)
    })
  })

  describe('getClientFileCount', () => {
    it('should get file count for client', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        count: 5,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      const result = await getClientFileCount(mockFile.client_id)

      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockEq).toHaveBeenCalledWith('client_id', mockFile.client_id)
      expect(result.count).toBe(5)
    })
  })

  describe('getTotalFileCount', () => {
    it('should get total file count', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockResolvedValue({
        count: 100,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      const result = await getTotalFileCount()

      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(result.count).toBe(100)
    })
  })
})
