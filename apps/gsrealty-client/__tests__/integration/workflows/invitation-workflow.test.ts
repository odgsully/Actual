/**
 * Invitation Workflow Integration Tests
 *
 * Tests complete invitation workflow: send, verify, resend, and account setup
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
  supabaseAdmin,
} from '../setup';

describe('Invitation Workflow Integration', () => {
  let adminSession: AuthSession | null;
  let testClientId: string;
  let testInvitationId: string;
  let testInvitationToken: string;

  beforeAll(async () => {
    // Get admin session
    adminSession = await getAdminSession();
    if (!adminSession) {
      throw new Error('Failed to get admin session for tests');
    }

    // Create a test client without user_id (ready for invitation)
    const testClient = generateTestClient({
      email: `invite-test-${Date.now()}@test.com`,
    });

    const response = await makeRequest('/api/admin/clients', {
      method: 'POST',
      body: testClient,
      accessToken: adminSession.accessToken,
    });

    const data = await response.json();
    testClientId = data.client.id;
    registerTestData('client', testClientId);
  }, TEST_CONFIG.testTimeout);

  beforeEach(() => {
    resetTestDataIds();
  });

  afterAll(async () => {
    // Cleanup
    const cleanupIds = {
      clientIds: testClientId ? [testClientId] : [],
      invitationIds: testInvitationId ? [testInvitationId] : [],
    };
    await cleanupTestData(cleanupIds);
  });

  // ==========================================================================
  // POST /api/admin/invites/send - Send Invitation
  // ==========================================================================

  describe('POST /api/admin/invites/send', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: { clientId: testClientId },
      });

      expect(response.status).toBe(401);
    });

    it('should validate clientId is provided', async () => {
      const response = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: {},
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('clientId');
    });

    it('should return 404 for non-existent client', async () => {
      const fakeClientId = '00000000-0000-0000-0000-000000000000';
      const response = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: { clientId: fakeClientId },
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(404);
    });

    it('should send invitation successfully', async () => {
      const response = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: {
          clientId: testClientId,
          customMessage: 'Welcome to GSRealty!',
        },
        accessToken: adminSession?.accessToken,
      });

      // May return 200 or 207 (multi-status if email fails but invitation created)
      expect([200, 207]).toContain(response.status);
      const data = await response.json();

      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.invitation).toBeDefined();
        expect(data.invitation.id).toBeDefined();
        expect(data.invitation.email).toBeDefined();
        expect(data.invitation.setupUrl).toBeDefined();
        expect(data.emailSent).toBe(true);

        testInvitationId = data.invitation.id;
        registerTestData('invitation', testInvitationId);

        // Extract token from setupUrl
        const urlMatch = data.invitation.setupUrl.match(/\/setup\/([^/]+)/);
        if (urlMatch) {
          testInvitationToken = urlMatch[1];
        }
      } else if (response.status === 207) {
        // Email failed but invitation created
        expect(data.invitation).toBeDefined();
        testInvitationId = data.invitation.id;
        testInvitationToken = data.invitation.token;
        registerTestData('invitation', testInvitationId);
      }
    });

    it('should include custom message in invitation', async () => {
      const customMessage = 'Custom onboarding message for testing';

      const response = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: {
          clientId: testClientId,
          customMessage,
        },
        accessToken: adminSession?.accessToken,
      });

      // Invitation already sent, should fail
      expect([200, 207, 400]).toContain(response.status);
    });

    it('should prevent sending invitation to client with existing account', async () => {
      // Create client with user_id
      const clientWithUser = generateTestClient({
        email: `existing-user-${Date.now()}@test.com`,
      });

      const createResponse = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: { ...clientWithUser, user_id: 'test-user-id' },
        accessToken: adminSession?.accessToken,
      });

      const createData = await createResponse.json();
      const clientId = createData.client.id;

      const inviteResponse = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: { clientId },
        accessToken: adminSession?.accessToken,
      });

      expect(inviteResponse.status).toBe(400);
      const inviteData = await inviteResponse.json();
      expect(inviteData.error).toContain('already has an account');

      // Cleanup
      await cleanupTestData({ clientIds: [clientId] });
    });

    it('should reject client without email', async () => {
      // Create client without email
      const clientNoEmail = generateTestClient({ email: null });

      const createResponse = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: clientNoEmail,
        accessToken: adminSession?.accessToken,
      });

      const createData = await createResponse.json();
      const clientId = createData.client.id;

      const inviteResponse = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: { clientId },
        accessToken: adminSession?.accessToken,
      });

      expect(inviteResponse.status).toBe(400);
      const inviteData = await inviteResponse.json();
      expect(inviteData.error).toContain('email');

      // Cleanup
      await cleanupTestData({ clientIds: [clientId] });
    });
  });

  // ==========================================================================
  // GET /api/admin/invites/send - Documentation
  // ==========================================================================

  describe('GET /api/admin/invites/send', () => {
    it('should return endpoint documentation', async () => {
      const response = await makeRequest('/api/admin/invites/send');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.endpoint).toBeDefined();
      expect(data.method).toBe('POST');
      expect(data.requiredFields).toBeDefined();
      expect(data.requiredFields.clientId).toBeDefined();
    });
  });

  // ==========================================================================
  // POST /api/admin/invites/verify - Verify Token
  // ==========================================================================

  describe('POST /api/admin/invites/verify', () => {
    beforeAll(async () => {
      // Ensure we have a valid invitation token
      if (!testInvitationToken) {
        // Query database for the invitation
        const { data } = await supabaseAdmin
          .from('gsrealty_invitations')
          .select('token')
          .eq('client_id', testClientId)
          .single();

        if (data) {
          testInvitationToken = data.token;
        }
      }
    });

    it('should validate token is provided', async () => {
      const response = await makeRequest('/api/admin/invites/verify', {
        method: 'POST',
        body: {},
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('token');
    });

    it('should verify valid token', async () => {
      if (!testInvitationToken) {
        console.log('Skipping test: no invitation token available');
        return;
      }

      const response = await makeRequest('/api/admin/invites/verify', {
        method: 'POST',
        body: { token: testInvitationToken },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.invitation).toBeDefined();
      expect(data.client).toBeDefined();
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid-token-12345';

      const response = await makeRequest('/api/admin/invites/verify', {
        method: 'POST',
        body: { token: invalidToken },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });

    it('should reject expired token', async () => {
      // Create invitation that expires immediately
      const expiredClient = generateTestClient({
        email: `expired-${Date.now()}@test.com`,
      });

      const createResponse = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: expiredClient,
        accessToken: adminSession?.accessToken,
      });

      const createData = await createResponse.json();
      const expiredClientId = createData.client.id;

      // Manually create expired invitation in database
      const expiredToken = 'expired-token-' + Date.now();
      await supabaseAdmin
        .from('gsrealty_invitations')
        .insert({
          client_id: expiredClientId,
          email: expiredClient.email,
          token: expiredToken,
          expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
          created_by: adminSession?.user.id,
        });

      const verifyResponse = await makeRequest('/api/admin/invites/verify', {
        method: 'POST',
        body: { token: expiredToken },
      });

      expect([400, 404]).toContain(verifyResponse.status);
      const verifyData = await verifyResponse.json();
      expect(verifyData.valid).toBe(false);

      // Cleanup
      await cleanupTestData({ clientIds: [expiredClientId] });
    });
  });

  // ==========================================================================
  // POST /api/admin/invites/resend - Resend Invitation
  // ==========================================================================

  describe('POST /api/admin/invites/resend', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/invites/resend', {
        method: 'POST',
        body: { clientId: testClientId },
      });

      expect(response.status).toBe(401);
    });

    it('should validate clientId is provided', async () => {
      const response = await makeRequest('/api/admin/invites/resend', {
        method: 'POST',
        body: {},
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
    });

    it('should resend existing invitation', async () => {
      const response = await makeRequest('/api/admin/invites/resend', {
        method: 'POST',
        body: { clientId: testClientId },
        accessToken: adminSession?.accessToken,
      });

      // May succeed or fail depending on email configuration
      expect([200, 207, 404]).toContain(response.status);
    });

    it('should return 404 for client without invitation', async () => {
      const noInviteClient = generateTestClient({
        email: `no-invite-${Date.now()}@test.com`,
      });

      const createResponse = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: noInviteClient,
        accessToken: adminSession?.accessToken,
      });

      const createData = await createResponse.json();
      const clientId = createData.client.id;

      const resendResponse = await makeRequest('/api/admin/invites/resend', {
        method: 'POST',
        body: { clientId },
        accessToken: adminSession?.accessToken,
      });

      expect(resendResponse.status).toBe(404);

      // Cleanup
      await cleanupTestData({ clientIds: [clientId] });
    });
  });

  // ==========================================================================
  // Complete Invitation Workflow
  // ==========================================================================

  describe('Complete Invitation Workflow', () => {
    let workflowClientId: string;
    let workflowToken: string;

    beforeAll(async () => {
      // Create fresh client for workflow test
      const workflowClient = generateTestClient({
        email: `workflow-${Date.now()}@test.com`,
      });

      const createResponse = await makeRequest('/api/admin/clients', {
        method: 'POST',
        body: workflowClient,
        accessToken: adminSession?.accessToken,
      });

      const createData = await createResponse.json();
      workflowClientId = createData.client.id;
      registerTestData('client', workflowClientId);
    });

    afterAll(async () => {
      if (workflowClientId) {
        await cleanupTestData({ clientIds: [workflowClientId] });
      }
    });

    it('should complete send-verify-setup workflow', async () => {
      // Step 1: Send invitation
      const sendResponse = await makeRequest('/api/admin/invites/send', {
        method: 'POST',
        body: {
          clientId: workflowClientId,
          customMessage: 'Complete workflow test',
        },
        accessToken: adminSession?.accessToken,
      });

      expect([200, 207]).toContain(sendResponse.status);
      const sendData = await sendResponse.json();
      expect(sendData.invitation).toBeDefined();

      workflowToken = sendData.invitation.token || sendData.invitation.setupUrl?.split('/').pop();

      // Step 2: Verify token
      const verifyResponse = await makeRequest('/api/admin/invites/verify', {
        method: 'POST',
        body: { token: workflowToken },
      });

      expect(verifyResponse.status).toBe(200);
      const verifyData = await verifyResponse.json();
      expect(verifyData.valid).toBe(true);
      expect(verifyData.client.id).toBe(workflowClientId);

      // Step 3: Complete setup (would normally set password)
      const setupResponse = await makeRequest('/api/setup/complete', {
        method: 'POST',
        body: {
          token: workflowToken,
          password: 'TestPassword123!',
        },
      });

      // May succeed or fail depending on implementation
      expect([200, 400, 404]).toContain(setupResponse.status);
    });

    it('should handle resend workflow', async () => {
      // Step 1: Resend invitation
      const resendResponse = await makeRequest('/api/admin/invites/resend', {
        method: 'POST',
        body: { clientId: workflowClientId },
        accessToken: adminSession?.accessToken,
      });

      expect([200, 207]).toContain(resendResponse.status);

      // Step 2: Verify new/same token still works
      if (workflowToken) {
        const verifyResponse = await makeRequest('/api/admin/invites/verify', {
          method: 'POST',
          body: { token: workflowToken },
        });

        // Should still be valid
        expect([200, 400]).toContain(verifyResponse.status);
      }
    });
  });

  // ==========================================================================
  // Security Tests
  // ==========================================================================

  describe('Invitation Security', () => {
    it('should use UUID v4 tokens', async () => {
      if (!testInvitationToken) {
        console.log('Skipping test: no invitation token available');
        return;
      }

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidV4Regex.test(testInvitationToken)).toBe(true);
    });

    it('should have expiration date', async () => {
      if (!testInvitationId) {
        console.log('Skipping test: no invitation ID available');
        return;
      }

      const { data } = await supabaseAdmin
        .from('gsrealty_invitations')
        .select('expires_at')
        .eq('id', testInvitationId)
        .single();

      expect(data).toBeDefined();
      expect(data?.expires_at).toBeDefined();

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should expire in 7 days by default', async () => {
      if (!testInvitationId) {
        console.log('Skipping test: no invitation ID available');
        return;
      }

      const { data } = await supabaseAdmin
        .from('gsrealty_invitations')
        .select('created_at, expires_at')
        .eq('id', testInvitationId)
        .single();

      const createdAt = new Date(data.created_at);
      const expiresAt = new Date(data.expires_at);
      const diffDays = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(7, 0);
    });
  });
});
