/**
 * Unit Tests for Upload Schema Validation
 *
 * Tests Zod validation schemas, file validation helpers,
 * and utility functions for upload processing.
 */

import {
  uploadFormSchema,
  uploadResultSchema,
  validateFile,
  formatFileSize,
  getUploadTypeLabel,
  UPLOAD_TYPES,
  FILE_CONSTRAINTS,
  PROCESSING_STATUS,
} from '../upload-schema'

describe('upload-schema', () => {
  describe('UPLOAD_TYPES', () => {
    it('should have correct upload type constants', () => {
      expect(UPLOAD_TYPES.DIRECT_COMPS).toBe('direct_comps')
      expect(UPLOAD_TYPES.ALL_SCOPES).toBe('all_scopes')
      expect(UPLOAD_TYPES.HALF_MILE).toBe('half_mile')
    })
  })

  describe('FILE_CONSTRAINTS', () => {
    it('should have correct max file size', () => {
      expect(FILE_CONSTRAINTS.MAX_SIZE).toBe(10 * 1024 * 1024) // 10 MB
    })

    it('should accept CSV and Excel file types', () => {
      expect(FILE_CONSTRAINTS.ACCEPTED_TYPES).toContain('text/csv')
      expect(FILE_CONSTRAINTS.ACCEPTED_TYPES).toContain('application/vnd.ms-excel')
      expect(FILE_CONSTRAINTS.ACCEPTED_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('should accept correct file extensions', () => {
      expect(FILE_CONSTRAINTS.ACCEPTED_EXTENSIONS).toContain('.csv')
      expect(FILE_CONSTRAINTS.ACCEPTED_EXTENSIONS).toContain('.xlsx')
      expect(FILE_CONSTRAINTS.ACCEPTED_EXTENSIONS).toContain('.xls')
    })
  })

  describe('uploadFormSchema', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      const blob = new Blob(['x'.repeat(size)], { type })
      return new File([blob], name, { type })
    }

    it('should validate correct upload form data', () => {
      const validData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.csv', 1024, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for clientId', () => {
      const invalidData = {
        clientId: 'not-a-uuid',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.csv', 1024, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid client')
      }
    })

    it('should reject empty clientId', () => {
      const invalidData = {
        clientId: '',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.csv', 1024, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate all upload types', () => {
      const validTypes = ['direct_comps', 'all_scopes', 'half_mile']

      validTypes.forEach(uploadType => {
        const data = {
          clientId: '550e8400-e29b-41d4-a716-446655440000',
          uploadType,
          file: createMockFile('test.csv', 1024, 'text/csv'),
        }

        const result = uploadFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid upload type', () => {
      const invalidData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'invalid_type',
        file: createMockFile('test.csv', 1024, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty file', () => {
      const invalidData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.csv', 0, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty')
      }
    })

    it('should reject file larger than max size', () => {
      const invalidData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.csv', FILE_CONSTRAINTS.MAX_SIZE + 1, 'text/csv'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10MB')
      }
    })

    it('should reject invalid file extension', () => {
      const invalidData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.txt', 1024, 'text/plain'),
      }

      const result = uploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message).join(' ')
        expect(messages).toContain('CSV')
      }
    })

    it('should accept .xlsx files', () => {
      const validData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile(
          'test.xlsx',
          1024,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ),
      }

      const result = uploadFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept .xls files', () => {
      const validData = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        uploadType: 'direct_comps' as const,
        file: createMockFile('test.xls', 1024, 'application/vnd.ms-excel'),
      }

      const result = uploadFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('uploadResultSchema', () => {
    it('should validate successful upload result', () => {
      const validResult = {
        success: true,
        uploadId: 'upload-123',
        totalRows: 100,
        validRows: 95,
        skippedRows: 5,
        errors: [],
        warnings: ['Row 10: Missing optional field'],
        downloadUrl: 'https://example.com/download',
        message: 'Upload completed successfully',
      }

      const result = uploadResultSchema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should validate error upload result', () => {
      const errorResult = {
        success: false,
        errors: ['Invalid file format', 'Missing required columns'],
        message: 'Upload failed',
      }

      const result = uploadResultSchema.safeParse(errorResult)
      expect(result.success).toBe(true)
    })

    it('should validate minimal upload result', () => {
      const minimalResult = {
        success: true,
      }

      const result = uploadResultSchema.safeParse(minimalResult)
      expect(result.success).toBe(true)
    })
  })

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number): File => {
      const blob = new Blob(['x'.repeat(size)])
      return new File([blob], name)
    }

    it('should validate correct CSV file', () => {
      const file = createMockFile('data.csv', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate correct XLSX file', () => {
      const file = createMockFile('data.xlsx', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate correct XLS file', () => {
      const file = createMockFile('data.xls', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty file', () => {
      const file = createMockFile('data.csv', 0)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File is empty')
    })

    it('should reject file larger than max size', () => {
      const file = createMockFile('data.csv', FILE_CONSTRAINTS.MAX_SIZE + 1)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
      expect(result.error).toContain('10MB')
    })

    it('should reject invalid file extension', () => {
      const file = createMockFile('data.txt', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should handle files with uppercase extensions', () => {
      const file = createMockFile('data.CSV', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('should reject files with no extension', () => {
      const file = createMockFile('data', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(100)).toBe('100 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.75 * 1024 * 1024 * 1024)).toBe('2.75 GB')
    })

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB')
    })
  })

  describe('getUploadTypeLabel', () => {
    it('should return correct label for direct_comps', () => {
      expect(getUploadTypeLabel(UPLOAD_TYPES.DIRECT_COMPS)).toBe('Direct Comparables')
    })

    it('should return correct label for all_scopes', () => {
      expect(getUploadTypeLabel(UPLOAD_TYPES.ALL_SCOPES)).toBe('All Scopes')
    })

    it('should return correct label for half_mile', () => {
      expect(getUploadTypeLabel(UPLOAD_TYPES.HALF_MILE)).toBe('Half Mile Radius')
    })

    it('should return Unknown for invalid type', () => {
      expect(getUploadTypeLabel('invalid' as any)).toBe('Unknown')
    })
  })

  describe('PROCESSING_STATUS', () => {
    it('should have correct status constants', () => {
      expect(PROCESSING_STATUS.IDLE).toBe('idle')
      expect(PROCESSING_STATUS.UPLOADING).toBe('uploading')
      expect(PROCESSING_STATUS.PROCESSING).toBe('processing')
      expect(PROCESSING_STATUS.COMPLETE).toBe('complete')
      expect(PROCESSING_STATUS.ERROR).toBe('error')
    })

    it('should have all expected status values', () => {
      const statuses = Object.values(PROCESSING_STATUS)
      expect(statuses).toHaveLength(5)
      expect(statuses).toContain('idle')
      expect(statuses).toContain('uploading')
      expect(statuses).toContain('processing')
      expect(statuses).toContain('complete')
      expect(statuses).toContain('error')
    })
  })
})
