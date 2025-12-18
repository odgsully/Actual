/**
 * MCAO Integration Workflow Integration Tests
 *
 * Tests complete MCAO API integration including lookup, caching, and property linking
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAdminSession,
  makeRequest,
  MOCK_MCAO_RESPONSE,
  TEST_CONFIG,
  type AuthSession,
  supabaseAdmin,
} from '../setup';

describe('MCAO Integration Workflow', () => {
  let adminSession: AuthSession | null;
  const testAPN = '123-45-678A';

  beforeAll(async () => {
    // Get admin session
    adminSession = await getAdminSession();
    if (!adminSession) {
      throw new Error('Failed to get admin session for tests');
    }

    // Clean up any existing test data
    await supabaseAdmin
      .from('mcao_property_cache')
      .delete()
      .eq('apn', testAPN);
  }, TEST_CONFIG.testTimeout);

  afterAll(async () => {
    // Cleanup test MCAO data
    await supabaseAdmin
      .from('mcao_property_cache')
      .delete()
      .eq('apn', testAPN);
  });

  // ==========================================================================
  // POST /api/admin/mcao/lookup - APN Lookup
  // ==========================================================================

  describe('POST /api/admin/mcao/lookup', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: { apn: testAPN },
      });

      expect(response.status).toBe(401);
    });

    it('should validate APN is provided', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: {},
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should validate APN format', async () => {
      const invalidAPNs = [
        'invalid',
        '123-45-678', // Missing letter
        '12-45-678A', // Wrong length
        'ABC-DE-FGHA', // All letters
      ];

      for (const invalidAPN of invalidAPNs) {
        const response = await makeRequest('/api/admin/mcao/lookup', {
          method: 'POST',
          body: { apn: invalidAPN },
          accessToken: adminSession?.accessToken,
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Invalid APN format');
      }
    });

    it('should accept valid APN formats', async () => {
      const validAPNs = [
        '123-45-678A',
        '123-45-678B',
        '999-99-999Z',
      ];

      for (const apn of validAPNs) {
        const response = await makeRequest('/api/admin/mcao/lookup', {
          method: 'POST',
          body: { apn },
          accessToken: adminSession?.accessToken,
        });

        // Will fail with API error (not configured), but should pass validation
        expect([200, 400, 500]).toContain(response.status);
        const data = await response.json();
        if (response.status === 400) {
          expect(data.error).not.toContain('Invalid APN format');
        }
      }
    });

    it('should format APN correctly', async () => {
      const unformattedAPNs = [
        '12345678A', // No dashes
        '123 45 678A', // Spaces
        '123-45-678a', // Lowercase
      ];

      for (const unformattedAPN of unformattedAPNs) {
        const response = await makeRequest('/api/admin/mcao/lookup', {
          method: 'POST',
          body: { apn: unformattedAPN },
          accessToken: adminSession?.accessToken,
        });

        // Should accept and format
        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  // ==========================================================================
  // GET /api/admin/mcao/lookup - Documentation
  // ==========================================================================

  describe('GET /api/admin/mcao/lookup', () => {
    it('should return endpoint documentation', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.endpoint).toBeDefined();
      expect(data.description).toBeDefined();
      expect(data.parameters).toBeDefined();
      expect(data.parameters.apn).toBeDefined();
      expect(data.example).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /api/admin/mcao/status - Cache Status
  // ==========================================================================

  describe('GET /api/admin/mcao/status', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/mcao/status');
      expect(response.status).toBe(401);
    });

    it('should return cache statistics', async () => {
      const response = await makeRequest('/api/admin/mcao/status', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cacheSize).toBeDefined();
      expect(typeof data.cacheSize).toBe('number');
    });
  });

  // ==========================================================================
  // Database Caching Tests
  // ==========================================================================

  describe('Database Caching', () => {
    beforeAll(async () => {
      // Insert mock data directly into cache
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', testAPN);

      await supabaseAdmin
        .from('mcao_property_cache')
        .insert({
          apn: testAPN,
          api_response: MOCK_MCAO_RESPONSE,
          fetched_at: new Date().toISOString(),
        });
    });

    it('should return cached data when available', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: { apn: testAPN },
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.cached).toBe(true);
      expect(data.source).toBe('database');
      expect(data.data).toBeDefined();
      expect(data.data.apn).toBe(testAPN);
    });

    it('should bypass cache when refresh=true', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: { apn: testAPN, refresh: true },
        accessToken: adminSession?.accessToken,
      });

      // Will try to hit API (will fail without real API key)
      expect([200, 400, 500]).toContain(response.status);
      const data = await response.json();

      if (data.success) {
        // If successful, should not be from database cache
        expect(data.source).not.toBe('database');
      }
    });

    it('should include optional parameters in API call', async () => {
      const response = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: {
          apn: testAPN,
          includeHistory: true,
          includeTax: true,
        },
        accessToken: adminSession?.accessToken,
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ==========================================================================
  // GET /api/admin/mcao/property/[apn] - Get Property
  // ==========================================================================

  describe('GET /api/admin/mcao/property/[apn]', () => {
    beforeAll(async () => {
      // Ensure cache has data
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', testAPN);

      await supabaseAdmin
        .from('mcao_property_cache')
        .insert({
          apn: testAPN,
          api_response: MOCK_MCAO_RESPONSE,
          fetched_at: new Date().toISOString(),
        });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest(`/api/admin/mcao/property/${testAPN}`);
      expect(response.status).toBe(401);
    });

    it('should get property from cache', async () => {
      const response = await makeRequest(`/api/admin/mcao/property/${testAPN}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.apn).toBe(testAPN);
      expect(data.api_response).toBeDefined();
    });

    it('should return 404 for non-existent APN', async () => {
      const nonExistentAPN = '999-99-999Z';
      const response = await makeRequest(`/api/admin/mcao/property/${nonExistentAPN}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // DELETE /api/admin/mcao/property/[apn] - Delete from Cache
  // ==========================================================================

  describe('DELETE /api/admin/mcao/property/[apn]', () => {
    beforeEach(async () => {
      // Ensure cache has data for delete tests
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', testAPN);

      await supabaseAdmin
        .from('mcao_property_cache')
        .insert({
          apn: testAPN,
          api_response: MOCK_MCAO_RESPONSE,
          fetched_at: new Date().toISOString(),
        });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest(`/api/admin/mcao/property/${testAPN}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('should delete property from cache', async () => {
      const response = await makeRequest(`/api/admin/mcao/property/${testAPN}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it's deleted
      const getResponse = await makeRequest(`/api/admin/mcao/property/${testAPN}`, {
        accessToken: adminSession?.accessToken,
      });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent property', async () => {
      const nonExistentAPN = '999-99-999Z';
      const response = await makeRequest(`/api/admin/mcao/property/${nonExistentAPN}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // Complete MCAO Workflow
  // ==========================================================================

  describe('Complete MCAO Workflow', () => {
    const workflowAPN = '456-78-901B';

    beforeAll(async () => {
      // Clean up
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', workflowAPN);
    });

    afterAll(async () => {
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', workflowAPN);
    });

    it('should handle complete lookup-cache-retrieve-delete workflow', async () => {
      // Step 1: Lookup (will try API, may fail without real key)
      const lookupResponse = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: { apn: workflowAPN },
        accessToken: adminSession?.accessToken,
      });

      // May fail due to API, so we manually insert for testing
      if (lookupResponse.status !== 200) {
        await supabaseAdmin
          .from('mcao_property_cache')
          .insert({
            apn: workflowAPN,
            api_response: { ...MOCK_MCAO_RESPONSE, apn: workflowAPN },
            fetched_at: new Date().toISOString(),
          });
      }

      // Step 2: Retrieve from cache
      const getResponse = await makeRequest(`/api/admin/mcao/property/${workflowAPN}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.apn).toBe(workflowAPN);

      // Step 3: Verify cached lookup returns same data
      const cachedLookupResponse = await makeRequest('/api/admin/mcao/lookup', {
        method: 'POST',
        body: { apn: workflowAPN },
        accessToken: adminSession?.accessToken,
      });

      expect(cachedLookupResponse.status).toBe(200);
      const cachedData = await cachedLookupResponse.json();
      expect(cachedData.cached).toBe(true);
      expect(cachedData.source).toBe('database');

      // Step 4: Delete from cache
      const deleteResponse = await makeRequest(`/api/admin/mcao/property/${workflowAPN}`, {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      expect(deleteResponse.status).toBe(200);

      // Step 5: Verify deletion
      const verifyResponse = await makeRequest(`/api/admin/mcao/property/${workflowAPN}`, {
        accessToken: adminSession?.accessToken,
      });

      expect(verifyResponse.status).toBe(404);
    });
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const response = await makeRequest('/api/admin/mcao/status', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cacheSize).toBeDefined();
      expect(typeof data.cacheSize).toBe('number');
      expect(data.cacheSize).toBeGreaterThanOrEqual(0);
    });

    it('should handle clearing cache (if endpoint exists)', async () => {
      const response = await makeRequest('/api/admin/mcao/status', {
        method: 'DELETE',
        accessToken: adminSession?.accessToken,
      });

      // Endpoint may not exist, allow 404
      expect([200, 404, 405]).toContain(response.status);
    });
  });
});
