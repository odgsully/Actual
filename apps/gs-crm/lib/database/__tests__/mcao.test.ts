/**
 * Unit Tests for MCAO Database Module
 *
 * Tests CRUD operations for gsrealty_mcao_data table
 * with mocked Supabase client.
 */

import {
  saveMCAOData,
  getMCAODataByAPN,
  linkMCAOToProperty,
  searchMCAOByOwner,
  getMCAOStats,
  deleteMCAOData,
  mcaoDataExists,
} from '../mcao'
import type { APN, MCAOApiResponse, MCAODatabaseRecord } from '@/lib/types/mcao-data'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

describe('database/mcao', () => {
  const mockSupabaseClient = createSupabaseClient as jest.MockedFunction<typeof createSupabaseClient>

  const mockApiResponse: MCAOApiResponse = {
    apn: '123-45-678' as APN,
    parcelNumber: 'PARCEL123',
    ownerName: 'John Doe',
    legalDescription: 'Lot 1, Block 2',
    propertyAddress: {
      number: '123',
      street: 'Main St',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      fullAddress: '123 Main St, Phoenix, AZ 85001',
    },
    propertyType: 'Single Family',
    landUse: 'Residential',
    lotSize: 7500,
    yearBuilt: 2005,
    assessedValue: {
      total: 350000,
      land: 100000,
      improvement: 250000,
    },
    taxInfo: {
      taxYear: 2024,
      taxAmount: 3500,
      taxRate: 0.01,
      taxArea: 'TA-001',
    },
    lastUpdated: '2024-01-15T10:00:00Z',
    dataSource: 'MCAO',
  }

  const mockDatabaseRecord: MCAODatabaseRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    property_id: null,
    apn: '123-45-678' as APN,
    owner_name: 'John Doe',
    legal_description: 'Lot 1, Block 2',
    tax_amount: 3500,
    assessed_value: 350000,
    api_response: mockApiResponse,
    fetched_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('saveMCAOData', () => {
    it('should save MCAO data successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDatabaseRecord,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        upsert: mockUpsert,
      })

      mockUpsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await saveMCAOData('123-45-678' as APN, mockApiResponse)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_mcao_data')
      expect(mockUpsert).toHaveBeenCalled()
      expect(result.record).toEqual(mockDatabaseRecord)
      expect(result.error).toBeNull()
    })

    it('should format APN before saving', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDatabaseRecord,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        upsert: mockUpsert,
      })

      mockUpsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      // Pass unformatted APN
      await saveMCAOData('12345678' as APN, mockApiResponse)

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          apn: '123-45-678',
        }),
        expect.any(Object)
      )
    })

    it('should reject invalid APN format', async () => {
      const result = await saveMCAOData('invalid-apn' as APN, mockApiResponse)

      expect(result.record).toBeNull()
      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('Invalid APN format')
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      const mockFrom = jest.fn().mockReturnThis()
      const mockUpsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        upsert: mockUpsert,
      })

      mockUpsert.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await saveMCAOData('123-45-678' as APN, mockApiResponse)

      expect(result.record).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('getMCAODataByAPN', () => {
    it('should retrieve MCAO data by APN', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDatabaseRecord,
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

      const result = await getMCAODataByAPN('123-45-678' as APN)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_mcao_data')
      expect(mockEq).toHaveBeenCalledWith('apn', '123-45-678')
      expect(result.data).toEqual(mockDatabaseRecord)
      expect(result.error).toBeNull()
    })

    it('should return null when APN not found (PGRST116)', async () => {
      const notFoundError = { code: 'PGRST116', message: 'Not found' }
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: notFoundError,
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

      const result = await getMCAODataByAPN('999-99-999' as APN)

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should reject invalid APN', async () => {
      const result = await getMCAODataByAPN('invalid' as APN)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('linkMCAOToProperty', () => {
    it('should link MCAO data to property successfully', async () => {
      const propertyId = '660e8400-e29b-41d4-a716-446655440001'
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

      const result = await linkMCAOToProperty('123-45-678' as APN, propertyId)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_mcao_data')
      expect(mockUpdate).toHaveBeenCalledWith({ property_id: propertyId })
      expect(mockEq).toHaveBeenCalledWith('apn', '123-45-678')
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject invalid APN when linking', async () => {
      const result = await linkMCAOToProperty('invalid' as APN, 'property-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('searchMCAOByOwner', () => {
    it('should search MCAO data by owner name', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockIlike = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockResolvedValue({
        data: [mockDatabaseRecord],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      })

      mockIlike.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        limit: mockLimit,
      })

      const result = await searchMCAOByOwner('John')

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_mcao_data')
      expect(mockIlike).toHaveBeenCalledWith('owner_name', '%John%')
      expect(mockLimit).toHaveBeenCalledWith(50)
      expect(result.results).toEqual([mockDatabaseRecord])
      expect(result.error).toBeNull()
    })

    it('should return empty array when no matches found', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockIlike = jest.fn().mockReturnThis()
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
        ilike: mockIlike,
      })

      mockIlike.mockReturnValue({
        order: mockOrder,
      })

      mockOrder.mockReturnValue({
        limit: mockLimit,
      })

      const result = await searchMCAOByOwner('NonexistentOwner')

      expect(result.results).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getMCAOStats', () => {
    it('should retrieve MCAO statistics', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockNot = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockReturnThis()
      const mockLimit = jest.fn().mockReturnThis()
      const mockSingle = jest.fn()

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      // Mock for total count
      mockSelect.mockReturnValueOnce(Promise.resolve({ count: 100, error: null }))

      // Mock for linked count
      mockSelect.mockReturnValueOnce({
        not: mockNot,
      })

      mockNot.mockReturnValue(Promise.resolve({ count: 25, error: null }))

      // Mock for most recent
      mockSelect.mockReturnValueOnce({
        order: mockOrder,
      })

      mockOrder.mockReturnValueOnce({
        limit: mockLimit,
      })

      mockLimit.mockReturnValueOnce({
        single: mockSingle,
      })

      mockSingle.mockResolvedValueOnce({
        data: { fetched_at: '2024-01-20T10:00:00Z' },
        error: null,
      })

      // Mock for oldest
      mockSelect.mockReturnValueOnce({
        order: mockOrder,
      })

      mockOrder.mockReturnValueOnce({
        limit: mockLimit,
      })

      mockLimit.mockReturnValueOnce({
        single: mockSingle,
      })

      mockSingle.mockResolvedValueOnce({
        data: { fetched_at: '2024-01-01T10:00:00Z' },
        error: null,
      })

      const result = await getMCAOStats()

      expect(result.stats).toBeTruthy()
      expect(result.stats?.totalRecords).toBe(100)
      expect(result.stats?.linkedToProperties).toBe(25)
      expect(result.error).toBeNull()
    })
  })

  describe('deleteMCAOData', () => {
    it('should delete MCAO data successfully', async () => {
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

      const result = await deleteMCAOData('123-45-678' as APN)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_mcao_data')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('apn', '123-45-678')
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject invalid APN when deleting', async () => {
      const result = await deleteMCAOData('invalid' as APN)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('mcaoDataExists', () => {
    it('should return true when data exists', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        count: 1,
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

      const result = await mcaoDataExists('123-45-678' as APN)

      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockEq).toHaveBeenCalledWith('apn', '123-45-678')
      expect(result.exists).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return false when data does not exist', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        count: 0,
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

      const result = await mcaoDataExists('999-99-999' as APN)

      expect(result.exists).toBe(false)
      expect(result.error).toBeNull()
    })

    it('should reject invalid APN when checking existence', async () => {
      const result = await mcaoDataExists('invalid' as APN)

      expect(result.exists).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })
})
