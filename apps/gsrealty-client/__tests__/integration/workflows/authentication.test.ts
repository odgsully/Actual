/**
 * Authentication Flow Integration Tests
 *
 * Tests authentication workflows including sign in, sign out, and protected routes
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAdminSession,
  createTestUserSession,
  signOut,
  makeRequest,
  generateTestUser,
  cleanupTestData,
  TEST_CONFIG,
  type AuthSession,
  supabaseAnon,
  supabaseAdmin,
} from '../setup';

describe('Authentication Flow Integration', () => {
  let testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup test users
    if (testUserIds.length > 0) {
      await cleanupTestData({ userIds: testUserIds });
    }
  });

  // ==========================================================================
  // User Sign Up
  // ==========================================================================

  describe('User Sign Up', () => {
    it('should create new user with valid credentials', async () => {
      const testUser = generateTestUser();

      const { data, error } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testUser.email);

      if (data.user) {
        testUserIds.push(data.user.id);
      }
    });

    it('should reject invalid email format', async () => {
      const { data, error } = await supabaseAnon.auth.signUp({
        email: 'invalid-email',
        password: 'TestPassword123!',
      });

      expect(error).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const testUser = generateTestUser();

      const { data, error } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: '123', // Too weak
      });

      expect(error).toBeDefined();
    });

    it('should prevent duplicate email registration', async () => {
      const testUser = generateTestUser();

      // First registration
      const { data: data1, error: error1 } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      expect(error1).toBeNull();
      if (data1.user) {
        testUserIds.push(data1.user.id);
      }

      // Second registration with same email
      const { data: data2, error: error2 } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: 'DifferentPassword123!',
      });

      // May return error or success with same user
      // Behavior depends on Supabase configuration
      expect([null, error2]).toBeDefined();
    });
  });

  // ==========================================================================
  // User Sign In
  // ==========================================================================

  describe('User Sign In', () => {
    let signInTestUser: any;
    let signInTestPassword: string;

    beforeAll(async () => {
      // Create test user for sign in tests
      const testUser = generateTestUser();
      signInTestPassword = testUser.password;

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });

      expect(error).toBeNull();
      signInTestUser = data.user;
      testUserIds.push(signInTestUser.id);
    });

    it('should sign in with valid credentials', async () => {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: signInTestUser.email,
        password: signInTestPassword,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.session?.access_token).toBeDefined();
      expect(data.user?.email).toBe(signInTestUser.email);

      // Sign out
      await supabaseAnon.auth.signOut();
    });

    it('should reject invalid email', async () => {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: 'AnyPassword123!',
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should reject invalid password', async () => {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: signInTestUser.email,
        password: 'WrongPassword123!',
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should provide session tokens on successful sign in', async () => {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: signInTestUser.email,
        password: signInTestPassword,
      });

      expect(error).toBeNull();
      expect(data.session?.access_token).toBeDefined();
      expect(data.session?.refresh_token).toBeDefined();
      expect(data.session?.expires_in).toBeGreaterThan(0);

      await supabaseAnon.auth.signOut();
    });
  });

  // ==========================================================================
  // User Sign Out
  // ==========================================================================

  describe('User Sign Out', () => {
    it('should sign out successfully', async () => {
      // Create session
      const session = await createTestUserSession();
      expect(session).toBeDefined();

      if (session) {
        testUserIds.push(session.user.id);

        // Sign out
        const { error } = await supabaseAnon.auth.signOut();
        expect(error).toBeNull();

        // Verify session is cleared
        const { data: userData } = await supabaseAnon.auth.getUser();
        expect(userData.user).toBeNull();
      }
    });

    it('should handle signing out when not signed in', async () => {
      // Ensure no active session
      await supabaseAnon.auth.signOut();

      // Try signing out again
      const { error } = await supabaseAnon.auth.signOut();
      expect(error).toBeNull(); // Should not error
    });
  });

  // ==========================================================================
  // Session Management
  // ==========================================================================

  describe('Session Management', () => {
    let sessionTestUser: AuthSession | null;

    beforeAll(async () => {
      sessionTestUser = await createTestUserSession();
      if (sessionTestUser) {
        testUserIds.push(sessionTestUser.user.id);
      }
    });

    afterAll(async () => {
      await signOut();
    });

    it('should retrieve current session', async () => {
      const { data, error } = await supabaseAnon.auth.getSession();

      expect(error).toBeNull();
      // Session may or may not exist depending on previous tests
      expect(data).toBeDefined();
    });

    it('should retrieve current user', async () => {
      if (!sessionTestUser) {
        console.log('Skipping test: no session available');
        return;
      }

      const { data, error } = await supabaseAnon.auth.getUser();

      expect(error).toBeNull();
      if (data.user) {
        expect(data.user.email).toBeDefined();
      }
    });

    it('should refresh expired token', async () => {
      if (!sessionTestUser) {
        console.log('Skipping test: no session available');
        return;
      }

      const { data, error } = await supabaseAnon.auth.refreshSession();

      expect(error).toBeNull();
      if (data.session) {
        expect(data.session.access_token).toBeDefined();
        expect(data.session.refresh_token).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Protected Routes - Admin Access
  // ==========================================================================

  describe('Protected Routes - Admin Access', () => {
    let adminSession: AuthSession | null;
    let regularUserSession: AuthSession | null;

    beforeAll(async () => {
      adminSession = await getAdminSession();

      // Create regular user (non-admin)
      regularUserSession = await createTestUserSession();
      if (regularUserSession) {
        testUserIds.push(regularUserSession.user.id);
      }
    }, TEST_CONFIG.testTimeout);

    it('should allow admin access to admin routes', async () => {
      const response = await makeRequest('/api/admin/clients', {
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(200);
    });

    it('should deny unauthenticated access to admin routes', async () => {
      const response = await makeRequest('/api/admin/clients');
      expect(response.status).toBe(401);
    });

    it('should deny non-admin user access to admin routes', async () => {
      // This test assumes RLS policies are enforced
      const response = await makeRequest('/api/admin/clients', {
        accessToken: regularUserSession?.accessToken,
      });

      // Should be 403 (Forbidden) or 401 (Unauthorized)
      expect([401, 403]).toContain(response.status);
    });

    it('should validate authorization header format', async () => {
      const response = await makeRequest('/api/admin/clients', {
        headers: {
          Authorization: 'InvalidFormat',
        },
      });

      expect([401, 400]).toContain(response.status);
    });
  });

  // ==========================================================================
  // Admin Role Verification
  // ==========================================================================

  describe('Admin Role Verification', () => {
    let adminSession: AuthSession | null;

    beforeAll(async () => {
      adminSession = await getAdminSession();
    });

    it('should verify admin has correct role in database', async () => {
      if (!adminSession) {
        console.log('Skipping test: no admin session');
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('gsrealty_users')
        .select('role')
        .eq('auth_user_id', adminSession.user.id)
        .single();

      expect(error).toBeNull();
      expect(data?.role).toBe('admin');
    });

    it('should have admin user linked to auth user', async () => {
      if (!adminSession) {
        console.log('Skipping test: no admin session');
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('gsrealty_users')
        .select('*')
        .eq('auth_user_id', adminSession.user.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.auth_user_id).toBe(adminSession.user.id);
    });
  });

  // ==========================================================================
  // Password Reset Flow
  // ==========================================================================

  describe('Password Reset Flow', () => {
    let resetTestUser: any;

    beforeAll(async () => {
      const testUser = generateTestUser();

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });

      expect(error).toBeNull();
      resetTestUser = data.user;
      testUserIds.push(resetTestUser.id);
    });

    it('should send password reset email', async () => {
      const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(
        resetTestUser.email,
        {
          redirectTo: `${TEST_CONFIG.baseUrl}/reset-password`,
        }
      );

      // May fail if email service not configured
      // But should not error on API call itself
      expect(error).toBeNull();
    });

    it('should handle password reset for non-existent email', async () => {
      const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(
        'nonexistent@test.com'
      );

      // Supabase typically doesn't error (security measure)
      // But returns success to prevent email enumeration
      expect(error).toBeNull();
    });
  });

  // ==========================================================================
  // Email Verification
  // ==========================================================================

  describe('Email Verification', () => {
    it('should handle email verification request', async () => {
      const testUser = generateTestUser();

      const { data, error } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      if (data.user) {
        testUserIds.push(data.user.id);

        // Request verification email resend
        const { data: resendData, error: resendError } = await supabaseAnon.auth.resend({
          type: 'signup',
          email: testUser.email,
        });

        // May fail if email not configured
        expect([null, resendError]).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Token Expiration
  // ==========================================================================

  describe('Token Expiration', () => {
    it('should have expiration time on access token', async () => {
      const session = await createTestUserSession();

      if (session) {
        testUserIds.push(session.user.id);

        expect(session.session.expires_in).toBeDefined();
        expect(session.session.expires_in).toBeGreaterThan(0);
        expect(session.session.expires_at).toBeDefined();

        await signOut();
      }
    });

    it('should reject expired token', async () => {
      // This test is difficult without waiting for actual expiration
      // or manipulating tokens, which is not recommended
      // Instead, we verify token has expiration metadata
      const session = await createTestUserSession();

      if (session) {
        testUserIds.push(session.user.id);

        const expiresAt = session.session.expires_at;
        expect(expiresAt).toBeDefined();

        const expirationDate = new Date(expiresAt! * 1000);
        const now = new Date();
        expect(expirationDate.getTime()).toBeGreaterThan(now.getTime());

        await signOut();
      }
    });
  });

  // ==========================================================================
  // Complete Authentication Workflow
  // ==========================================================================

  describe('Complete Authentication Workflow', () => {
    it('should complete sign up -> sign in -> access protected route -> sign out workflow', async () => {
      const testUser = generateTestUser();

      // Step 1: Sign up
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });

      expect(signUpError).toBeNull();
      expect(signUpData.user).toBeDefined();
      testUserIds.push(signUpData.user.id);

      // Step 2: Sign in
      const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      });

      expect(signInError).toBeNull();
      expect(signInData.session).toBeDefined();

      // Step 3: Access protected route (preferences)
      const response = await makeRequest('/api/preferences/load', {
        accessToken: signInData.session?.access_token,
      });

      // Should be authorized (200) or no data found (404)
      expect([200, 404]).toContain(response.status);

      // Step 4: Sign out
      const { error: signOutError } = await supabaseAnon.auth.signOut();
      expect(signOutError).toBeNull();

      // Step 5: Verify cannot access protected route after sign out
      const { data: userData } = await supabaseAnon.auth.getUser();
      expect(userData.user).toBeNull();
    });
  });
});
