/**
 * Unit Tests for Database Clients Module
 *
 * Tests CRUD operations for gsrealty_clients table
 * with mocked Supabase client.
 */

import {
  getAllClients,
  getClientById,
  searchClients,
  createClient,
  updateClient,
  deleteClient,
  getClientCount,
  type GSRealtyClient,
  type CreateClientInput,
  type UpdateClientInput,
} from '../clients'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

describe('database/clients', () => {
  const mockSupabaseClient = createSupabaseClient as jest.MockedFunction<typeof createSupabaseClient>

  const mockClient: GSRealtyClient = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '660e8400-e29b-41d4-a716-446655440001',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-1234',
    email: 'john.doe@example.com',
    address: '123 Main St, Phoenix, AZ',
    property_address: '456 Oak St, Phoenix, AZ',
    notes: 'First time home buyer',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockClient2: GSRealtyClient = {
    id: '660e8400-e29b-41d4-a716-446655440002',
    user_id: '660e8400-e29b-41d4-a716-446655440001',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '555-5678',
    email: 'jane.smith@example.com',
    address: null,
    property_address: null,
    notes: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getAllClients', () => {
    it('should return all clients successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockClient, mockClient2],
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

      const result = await getAllClients()

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result.clients).toEqual([mockClient, mockClient2])
      expect(result.error).toBeNull()
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      const result = await getAllClients()

      expect(result.clients).toBeNull()
      expect(result.error).toEqual(mockError)
    })

    it('should return empty array when no clients exist', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
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
        order: mockOrder,
      })

      const result = await getAllClients()

      expect(result.clients).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getClientById', () => {
    it('should return client by id successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockClient,
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

      const result = await getClientById(mockClient.id)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', mockClient.id)
      expect(mockSingle).toHaveBeenCalled()
      expect(result.client).toEqual(mockClient)
      expect(result.error).toBeNull()
    })

    it('should handle client not found', async () => {
      const mockError = new Error('Client not found')
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      const result = await getClientById('non-existent-id')

      expect(result.client).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('searchClients', () => {
    it('should search clients by query', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOr = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockClient],
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        or: mockOr,
      })

      mockOr.mockReturnValue({
        order: mockOrder,
      })

      const result = await searchClients('john')

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOr).toHaveBeenCalledWith(
        'first_name.ilike.%john%,last_name.ilike.%john%,email.ilike.%john%'
      )
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result.clients).toEqual([mockClient])
      expect(result.error).toBeNull()
    })

    it('should handle empty search results', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOr = jest.fn().mockReturnThis()
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
        or: mockOr,
      })

      mockOr.mockReturnValue({
        order: mockOrder,
      })

      const result = await searchClients('nonexistent')

      expect(result.clients).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle search errors', async () => {
      const mockError = new Error('Search failed')
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockOr = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        or: mockOr,
      })

      mockOr.mockReturnValue({
        order: mockOrder,
      })

      const result = await searchClients('john')

      expect(result.clients).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('createClient', () => {
    it('should create new client successfully', async () => {
      const input: CreateClientInput = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-1234',
        email: 'john.doe@example.com',
        address: '123 Main St',
        property_address: '456 Oak St',
        notes: 'Test notes',
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockInsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockClient,
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

      const result = await createClient(input)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockInsert).toHaveBeenCalledWith({
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        property_address: input.property_address,
        notes: input.notes,
        user_id: null,
      })
      expect(result.client).toEqual(mockClient)
      expect(result.error).toBeNull()
    })

    it('should create client with minimal fields', async () => {
      const input: CreateClientInput = {
        first_name: 'Jane',
        last_name: 'Smith',
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockInsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockClient2,
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

      const result = await createClient(input)

      expect(mockInsert).toHaveBeenCalledWith({
        first_name: input.first_name,
        last_name: input.last_name,
        phone: null,
        email: null,
        address: null,
        property_address: null,
        notes: null,
        user_id: null,
      })
      expect(result.client).toEqual(mockClient2)
      expect(result.error).toBeNull()
    })

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed')
      const input: CreateClientInput = {
        first_name: 'John',
        last_name: 'Doe',
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

      const result = await createClient(input)

      expect(result.client).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const input: UpdateClientInput = {
        phone: '555-9999',
        notes: 'Updated notes',
      }

      const updatedClient = { ...mockClient, ...input }

      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: updatedClient,
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

      mockEq.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await updateClient(mockClient.id, input)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockUpdate).toHaveBeenCalledWith({
        phone: input.phone,
        notes: input.notes,
      })
      expect(mockEq).toHaveBeenCalledWith('id', mockClient.id)
      expect(result.client).toEqual(updatedClient)
      expect(result.error).toBeNull()
    })

    it('should handle partial updates', async () => {
      const input: UpdateClientInput = {
        first_name: 'Johnny',
      }

      const updatedClient = { ...mockClient, first_name: 'Johnny' }

      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: updatedClient,
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

      mockEq.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await updateClient(mockClient.id, input)

      expect(mockUpdate).toHaveBeenCalledWith({
        first_name: 'Johnny',
      })
      expect(result.client).toEqual(updatedClient)
      expect(result.error).toBeNull()
    })

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed')
      const input: UpdateClientInput = {
        phone: '555-9999',
      }

      const mockFrom = jest.fn().mockReturnThis()
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      mockEq.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        single: mockSingle,
      })

      const result = await updateClient(mockClient.id, input)

      expect(result.client).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
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

      const result = await deleteClient(mockClient.id)

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', mockClient.id)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const mockError = new Error('Deletion failed')
      const mockFrom = jest.fn().mockReturnThis()
      const mockDelete = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({
        error: mockError,
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

      const result = await deleteClient(mockClient.id)

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
    })
  })

  describe('getClientCount', () => {
    it('should return client count successfully', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockResolvedValue({
        count: 42,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      const result = await getClientCount()

      expect(mockFrom).toHaveBeenCalledWith('gsrealty_clients')
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(result.count).toBe(42)
      expect(result.error).toBeNull()
    })

    it('should return 0 when no clients exist', async () => {
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockResolvedValue({
        count: 0,
        error: null,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      const result = await getClientCount()

      expect(result.count).toBe(0)
      expect(result.error).toBeNull()
    })

    it('should handle count errors', async () => {
      const mockError = new Error('Count failed')
      const mockFrom = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockResolvedValue({
        count: null,
        error: mockError,
      })

      mockSupabaseClient.mockReturnValue({
        from: mockFrom,
      } as any)

      mockFrom.mockReturnValue({
        select: mockSelect,
      })

      const result = await getClientCount()

      expect(result.count).toBe(0)
      expect(result.error).toEqual(mockError)
    })
  })
})
