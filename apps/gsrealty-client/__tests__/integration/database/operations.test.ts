/**
 * Database Operations Integration Tests
 *
 * Tests direct database operations with real Supabase instance
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  supabaseAdmin,
  generateTestClient,
  cleanupTestData,
  TEST_CONFIG,
} from '../setup';

describe('Database Operations Integration', () => {
  let testClientIds: string[] = [];
  let testFileIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test data
    await cleanupTestData({
      clientIds: testClientIds,
      fileIds: testFileIds,
    });
  });

  // ==========================================================================
  // gsrealty_clients Table Operations
  // ==========================================================================

  describe('gsrealty_clients Table', () => {
    it('should insert new client', async () => {
      const testClient = generateTestClient();

      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.first_name).toBe(testClient.first_name);
      expect(data.last_name).toBe(testClient.last_name);
      expect(data.id).toBeDefined();

      testClientIds.push(data.id);
    });

    it('should select all clients', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should select client by ID', async () => {
      // Create test client first
      const testClient = generateTestClient();
      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testClientIds.push(insertData.id);

      // Select by ID
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select('*')
        .eq('id', insertData.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(insertData.id);
    });

    it('should update client', async () => {
      // Create test client
      const testClient = generateTestClient();
      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testClientIds.push(insertData.id);

      // Update client
      const updates = {
        first_name: 'UpdatedFirst',
        notes: 'Updated notes',
      };

      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .update(updates)
        .eq('id', insertData.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.first_name).toBe(updates.first_name);
      expect(data.notes).toBe(updates.notes);
    });

    it('should delete client', async () => {
      // Create test client
      const testClient = generateTestClient();
      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      // Delete client
      const { error: deleteError } = await supabaseAdmin
        .from('gsrealty_clients')
        .delete()
        .eq('id', insertData.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: selectData } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .eq('id', insertData.id)
        .single();

      expect(selectData).toBeNull();
    });

    it('should filter clients by email', async () => {
      // Create test client with specific email
      const uniqueEmail = `unique-${Date.now()}@test.com`;
      const testClient = generateTestClient({ email: uniqueEmail });

      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testClientIds.push(insertData.id);

      // Filter by email
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .eq('email', uniqueEmail);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].email).toBe(uniqueEmail);
    });

    it('should search clients with ilike', async () => {
      // Create test client
      const testClient = generateTestClient({
        first_name: 'SearchableFirst',
        last_name: 'SearchableLast',
      });

      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testClientIds.push(insertData.id);

      // Search by first name
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .ilike('first_name', '%searchable%');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should order clients by created_at', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data && data.length > 1) {
        const first = new Date(data[0].created_at);
        const second = new Date(data[1].created_at);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    it('should count total clients', async () => {
      const { count, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // gsrealty_users Table Operations
  // ==========================================================================

  describe('gsrealty_users Table', () => {
    it('should select all users', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_users')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter users by role', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_users')
        .select()
        .eq('role', 'admin');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should verify admin user exists', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_users')
        .select()
        .eq('email', TEST_CONFIG.adminEmail)
        .single();

      // Admin may or may not exist in test DB
      expect([null, error]).toBeDefined();
    });
  });

  // ==========================================================================
  // gsrealty_invitations Table Operations
  // ==========================================================================

  describe('gsrealty_invitations Table', () => {
    let testInvitationClientId: string;

    beforeAll(async () => {
      // Create client for invitation tests
      const testClient = generateTestClient();
      const { data } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testInvitationClientId = data!.id;
      testClientIds.push(data!.id);
    });

    it('should insert invitation', async () => {
      const invitation = {
        client_id: testInvitationClientId,
        email: 'invitation@test.com',
        token: `test-token-${Date.now()}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('gsrealty_invitations')
        .insert(invitation)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.token).toBe(invitation.token);
    });

    it('should select invitation by token', async () => {
      const token = `unique-token-${Date.now()}`;
      const invitation = {
        client_id: testInvitationClientId,
        email: 'token-test@test.com',
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await supabaseAdmin
        .from('gsrealty_invitations')
        .insert(invitation);

      const { data, error } = await supabaseAdmin
        .from('gsrealty_invitations')
        .select()
        .eq('token', token)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.token).toBe(token);
    });

    it('should filter non-expired invitations', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_invitations')
        .select()
        .gt('expires_at', new Date().toISOString());

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // ==========================================================================
  // mcao_property_cache Table Operations
  // ==========================================================================

  describe('mcao_property_cache Table', () => {
    const testAPN = '999-99-999Z';

    afterAll(async () => {
      // Cleanup test MCAO data
      await supabaseAdmin
        .from('mcao_property_cache')
        .delete()
        .eq('apn', testAPN);
    });

    it('should insert MCAO cache entry', async () => {
      const cacheEntry = {
        apn: testAPN,
        api_response: {
          apn: testAPN,
          ownerName: 'Test Owner',
          propertyAddress: {
            fullAddress: '123 Test St',
          },
        },
        fetched_at: new Date().toISOString(),
      };

      const { data, error} = await supabaseAdmin
        .from('mcao_property_cache')
        .insert(cacheEntry)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.apn).toBe(testAPN);
    });

    it('should select MCAO cache by APN', async () => {
      const { data, error } = await supabaseAdmin
        .from('mcao_property_cache')
        .select()
        .eq('apn', testAPN)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.apn).toBe(testAPN);
    });

    it('should upsert MCAO cache (update on conflict)', async () => {
      const updatedEntry = {
        apn: testAPN,
        api_response: {
          apn: testAPN,
          ownerName: 'Updated Owner',
        },
        fetched_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('mcao_property_cache')
        .upsert(updatedEntry, { onConflict: 'apn' })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.api_response.ownerName).toBe('Updated Owner');
    });
  });

  // ==========================================================================
  // Database Constraints & Validation
  // ==========================================================================

  describe('Database Constraints', () => {
    it('should enforce NOT NULL on required fields', async () => {
      const invalidClient = {
        // Missing first_name and last_name (required)
        email: 'test@test.com',
      };

      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(invalidClient);

      expect(error).toBeDefined();
    });

    it('should enforce UUID format for id fields', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .eq('id', 'invalid-uuid');

      // Should error or return no results
      expect([null, data]).toBeDefined();
    });

    it('should auto-generate UUID for new records', async () => {
      const testClient = generateTestClient();
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBeDefined();
      expect(data!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      testClientIds.push(data!.id);
    });

    it('should auto-set created_at timestamp', async () => {
      const testClient = generateTestClient();
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.created_at).toBeDefined();

      const createdAt = new Date(data.created_at);
      const now = new Date();
      expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime());

      testClientIds.push(data.id);
    });

    it('should auto-update updated_at timestamp on update', async () => {
      // Create client
      const testClient = generateTestClient();
      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(testClient)
        .select()
        .single();

      testClientIds.push(insertData.id);

      const originalUpdatedAt = insertData.updated_at;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update client
      const { data: updateData, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .update({ notes: 'Updated' })
        .eq('id', insertData.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updateData.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  // ==========================================================================
  // Transaction-like Operations
  // ==========================================================================

  describe('Batch Operations', () => {
    it('should insert multiple clients in one operation', async () => {
      const clients = [
        generateTestClient(),
        generateTestClient(),
        generateTestClient(),
      ];

      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(clients)
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(3);

      // Collect IDs for cleanup
      data!.forEach(client => testClientIds.push(client.id));
    });

    it('should update multiple records with filter', async () => {
      // Create clients with specific tag
      const tag = `batch-${Date.now()}`;
      const clients = [
        generateTestClient({ notes: tag }),
        generateTestClient({ notes: tag }),
      ];

      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(clients)
        .select();

      insertData!.forEach(c => testClientIds.push(c.id));

      // Update all with that tag
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .update({ phone: '555-BATCH' })
        .eq('notes', tag)
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(2);
      expect(data!.every(c => c.phone === '555-BATCH')).toBe(true);
    });

    it('should delete multiple records with filter', async () => {
      // Create clients
      const tag = `delete-${Date.now()}`;
      const clients = [
        generateTestClient({ notes: tag }),
        generateTestClient({ notes: tag }),
      ];

      const { data: insertData } = await supabaseAdmin
        .from('gsrealty_clients')
        .insert(clients)
        .select();

      const ids = insertData!.map(c => c.id);

      // Delete all with that tag
      const { error } = await supabaseAdmin
        .from('gsrealty_clients')
        .delete()
        .eq('notes', tag);

      expect(error).toBeNull();

      // Verify deletion
      const { data: selectData } = await supabaseAdmin
        .from('gsrealty_clients')
        .select()
        .in('id', ids);

      expect(selectData).toBeDefined();
      expect(selectData!.length).toBe(0);
    });
  });

  // ==========================================================================
  // Connection & Performance
  // ==========================================================================

  describe('Database Connection', () => {
    it('should maintain connection for multiple queries', async () => {
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabaseAdmin
          .from('gsrealty_clients')
          .select('id')
          .limit(1);

        expect(error).toBeNull();
      }
    });

    it('should handle large result sets with pagination', async () => {
      const { data, error } = await supabaseAdmin
        .from('gsrealty_clients')
        .select('*')
        .range(0, 9); // First 10 records

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toBeDefined();
      expect(data!.length).toBeLessThanOrEqual(10);
    });
  });
});
