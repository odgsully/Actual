/**
 * Client Management API Integration Tests
 *
 * Tests all client CRUD operations through API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  getAdminSession,
  makeRequest,
  generateTestClient,
  cleanupTestData,
  registerTestData,
  resetTestDataIds,
  TEST_CONFIG,
  type AuthSession,
} from '../setup';

describe('Client Management API Integration', () => {
  let adminSession: AuthSession | null;
  let testClientId: string;

  beforeAll(async () => {
    // Get admin session
    adminSession = await getAdminSession();
    if (!adminSession) {
      throw new Error('Failed to get admin session for tests');
    }
  }, TEST_CONFIG.testTimeout);

  beforeEach(() => {
    resetTestDataIds();
  });

  afterAll(async () => {
    // Cleanup will be handled by individual tests
  });

  // ==========================================================================
  // GET /api/admin/clients - List All Clients
  // ==========================================================================

  describe('GET /api/admin/clients', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/clients');
      expect(response.status).toBe(401);
    });

    it('should return all clients for authenticated admin', async () => {
      const response = await makeRequest('/api/admin/clients', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return clients in descending order by created_at', async () => {
      const response = await makeRequest('/api/admin/clients', {
        accessToken: adminSession?.accessToken,
      });

      const clients = await response.json();
      if (clients.length > 1) {
        const firstDate = new Date(clients[0].created_at);
        const secondDate = new Date(clients[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  // ==========================================================================
  // POST /api/admin/clients - Create Client
  // ==========================================================================

  describe('POST /api/admin/clients', () => {
    afterEach(async () => {
      // Cleanup created clients
      if (testClientId) {
        await cleanupTestData({ clientIds: [testClientId] });
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const testClient = generateTestClient();
      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: testClient,
      });

      expect(response.status).toBe(401);
    });

    it('should create a new client with valid data', async () => {
      const testClient = generateTestClient();

      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: testClient,
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.client).toBeDefined();
      expect(data.client.first_name).toBe(testClient.first_name);
      expect(data.client.last_name).toBe(testClient.last_name);
      expect(data.client.email).toBe(testClient.email);
      expect(data.client.id).toBeDefined();

      testClientId = data.client.id;
      registerTestData('client', testClientId);
    });

    it('should validate required fields (first_name, last_name)', async () => {
      const invalidClient = {
        email: 'test@test.com',
        // Missing first_name and last_name
      };

      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: invalidClient,
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle optional fields correctly', async () => {
      const minimalClient = {
        first_name: 'Test',
        last_name: 'Minimal',
      };

      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: minimalClient,
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.client.phone).toBeNull();
      expect(data.client.email).toBeNull();

      testClientId = data.client.id;
      registerTestData('client', testClientId);
    });
  });

  // ==========================================================================
  // GET /api/admin/clients/[id] - Get Client by ID
  // ==========================================================================

  describe('GET /api/admin/clients/[id]', () => {
    beforeAll(async () => {
      // Create a test client
      const testClient = generateTestClient();
      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: testClient,
        accessToken: adminSession?.accessToken,
      });

      const data = await response.json();
      testClientId = data.client.id;
      registerTestData('client', testClientId);
    });

    afterAll(async () => {
      if (testClientId) {
        await cleanupTestData({ clientIds: [testClientId] });
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest(`/api/admin/clients/${testClientId}`);
      expect(response.status).toBe(401);
    });

    it('should return client data for valid ID', async () => {
      const response = await makeRequest(`/api/admin/clients/${testClientId}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(testClientId);
      expect(data.first_name).toBeDefined();
      expect(data.last_name).toBeDefined();
    });

    it('should return 404 for non-existent client ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await makeRequest(`/api/admin/clients/${fakeId}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await makeRequest('/api/admin/clients/invalid-id', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // PATCH /api/admin/clients/[id] - Update Client
  // ==========================================================================

  describe('PATCH /api/admin/clients/[id]', () => {
    let updateTestClientId: string;

    beforeAll(async () => {
      // Create a test client
      const testClient = generateTestClient();
      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: testClient,
        accessToken: adminSession?.accessToken,
      });

      const data = await response.json();
      updateTestClientId = data.client.id;
      registerTestData('client', updateTestClientId);
    });

    afterAll(async () => {
      if (updateTestClientId) {
        await cleanupTestData({ clientIds: [updateTestClientId] });
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest(`/api/admin/clients/${updateTestClientId}`, {
        method: 'PATCH',
        body: { first_name: 'Updated' },
      });

      expect(response.status).toBe(401);
    });

    it('should update client fields', async () => {
      const updates = {
        first_name: 'UpdatedFirst',
        last_name: 'UpdatedLast',
        phone: '555-9999',
      };

      const response = await makeRequest(`/api/admin/clients/${updateTestClientId}`, {
        method: 'PATCH',
        body: updates,
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.client.first_name).toBe(updates.first_name);
      expect(data.client.last_name).toBe(updates.last_name);
      expect(data.client.phone).toBe(updates.phone);
    });

    it('should allow partial updates', async () => {
      const partialUpdate = {
        notes: 'Updated notes only',
      };

      const response = await makeRequest(`/api/admin/clients/${updateTestClientId}`, {
        method: 'PATCH',
        body: partialUpdate,
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.client.notes).toBe(partialUpdate.notes);
    });

    it('should return 404 for non-existent client ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await makeRequest(`/api/admin/clients/${fakeId}`, {
        method: 'PATCH',
        body: { first_name: 'Updated' },
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // DELETE /api/admin/clients/[id] - Delete Client
  // ==========================================================================

  describe('DELETE /api/admin/clients/[id]', () => {
    let deleteTestClientId: string;

    beforeEach(async () => {
      // Create a test client for each delete test
      const testClient = generateTestClient();
      const response = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: testClient,
        accessToken: adminSession?.accessToken,
      });

      const data = await response.json();
      deleteTestClientId = data.client.id;
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest(`/api/admin/clients/${deleteTestClientId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('should delete existing client', async () => {
      const response = await makeRequest(`/api/admin/clients/${deleteTestClientId}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify client is deleted
      const getResponse = await makeRequest(`/api/admin/clients/${deleteTestClientId}`, {
        accessToken: adminSession?.accessToken,
      });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent client ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await makeRequest(`/api/admin/clients/${fakeId}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });

    it('should prevent deleting same client twice', async () => {
      // First delete
      await makeRequest(`/api/admin/clients/${deleteTestClientId}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      // Second delete should fail
      const response = await makeRequest(`/api/admin/clients/${deleteTestClientId}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // Search Functionality
  // ==========================================================================

  describe('Client Search', () => {
    let searchClient1Id: string;
    let searchClient2Id: string;

    beforeAll(async () => {
      // Create test clients with specific names for searching
      const client1 = generateTestClient({
        first_name: 'SearchTest',
        last_name: 'One',
        email: 'searchtest1@test.com',
      });

      const client2 = generateTestClient({
        first_name: 'SearchTest',
        last_name: 'Two',
        email: 'searchtest2@test.com',
      });

      const response1 = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: client1,
        accessToken: adminSession?.accessToken,
      });

      const response2 = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: client2,
        accessToken: adminSession?.accessToken,
      });

      const data1 = await response1.json();
      const data2 = await response2.json();

      searchClient1Id = data1.client.id;
      searchClient2Id = data2.client.id;

      registerTestData('client', searchClient1Id);
      registerTestData('client', searchClient2Id);
    });

    afterAll(async () => {
      await cleanupTestData({
        clientIds: [searchClient1Id, searchClient2Id],
      });
    });

    it('should search clients by first name', async () => {
      const response = await makeRequest('/api/admin/clients?search=SearchTest', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const clients = await response.json();
      expect(clients.length).toBeGreaterThanOrEqual(2);
      expect(clients.some((c: any) => c.id === searchClient1Id)).toBe(true);
      expect(clients.some((c: any) => c.id === searchClient2Id)).toBe(true);
    });

    it('should search clients by email', async () => {
      const response = await makeRequest('/api/admin/clients?search=searchtest1', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const clients = await response.json();
      expect(clients.some((c: any) => c.id === searchClient1Id)).toBe(true);
    });
  });
});
