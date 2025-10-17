import { test, expect } from '@playwright/test';
import { signInAsClient, signOut, verifyProtectedRoute } from '../helpers/auth';
import { TEST_CLIENT_CREDENTIALS } from '../helpers/data';

/**
 * Client Authentication E2E Tests
 *
 * Tests client sign in, sign out, session persistence, and protected route access
 */

test.describe('Client Authentication', () => {
  test.describe('Sign In', () => {
    test('should successfully sign in with valid client credentials', async ({ page }) => {
      await page.goto('/signin');

      // Fill in credentials
      await page.fill('input[name="email"]', TEST_CLIENT_CREDENTIALS.email);
      await page.fill('input[name="password"]', TEST_CLIENT_CREDENTIALS.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to client dashboard
      await page.waitForURL('/client', { timeout: 10000 });
      await expect(page).toHaveURL('/client');

      // Verify client dashboard content is visible
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should show error with invalid client credentials', async ({ page }) => {
      await page.goto('/signin');

      // Fill in invalid credentials
      await page.fill('input[name="email"]', 'wrongclient@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(
        page.locator('text=/Invalid credentials|Login failed|Incorrect email or password/i')
      ).toBeVisible({ timeout: 5000 });

      // Should still be on signin page
      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('Sign Out', () => {
    test('should successfully sign out', async ({ page }) => {
      // Sign in first
      await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);

      // Sign out
      await signOut(page);

      // Should be on signin page
      await expect(page).toHaveURL('/signin');

      // Should not be able to access client pages
      await page.goto('/client');
      await page.waitForURL('/signin', { timeout: 5000 });
      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain client session after page reload', async ({ page }) => {
      // Sign in
      await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);

      // Verify we're on client page
      await expect(page).toHaveURL('/client');

      // Reload page
      await page.reload();

      // Should still be on client page (session persisted)
      await expect(page).toHaveURL('/client');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to signin when accessing client dashboard without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/client');
    });

    test('should redirect to signin when accessing client properties without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/client/properties');
    });

    test('should redirect to signin when accessing client files without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/client/files');
    });

    test('should redirect to signin when accessing client profile without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/client/profile');
    });
  });
});
