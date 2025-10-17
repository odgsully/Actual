import { Page, expect } from '@playwright/test';

/**
 * Authentication Helper Functions
 *
 * Provides reusable authentication utilities for E2E tests
 */

/**
 * Sign in as admin user
 * Email: gbsullivan@mac.com
 * Password: chicago1
 */
export async function signInAsAdmin(page: Page) {
  await page.goto('/signin');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[name="email"]', 'gbsullivan@mac.com');
  await page.fill('input[name="password"]', 'chicago1');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin', { timeout: 10000 });

  // Verify we're on admin page
  await expect(page).toHaveURL('/admin');
}

/**
 * Sign in as client user
 */
export async function signInAsClient(page: Page, email: string, password: string) {
  await page.goto('/signin');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to client dashboard
  await page.waitForURL('/client', { timeout: 10000 });

  // Verify we're on client page
  await expect(page).toHaveURL('/client');
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page) {
  // Look for sign out button (could be in header, dropdown menu, etc.)
  const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")').first();

  // If sign out is in a dropdown, open it first
  const userMenuButton = page.locator('button[aria-label="User menu"], button:has-text("Menu")').first();
  const userMenuExists = await userMenuButton.count() > 0;

  if (userMenuExists) {
    await userMenuButton.click();
    await page.waitForTimeout(500); // Wait for dropdown to open
  }

  // Click sign out
  await signOutButton.click();

  // Wait for redirect to signin page
  await page.waitForURL('/signin', { timeout: 5000 });

  // Verify we're on signin page
  await expect(page).toHaveURL('/signin');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check if we're redirected away from signin page
  const currentUrl = page.url();
  return !currentUrl.includes('/signin') && !currentUrl.includes('/signup');
}

/**
 * Verify protected route redirects to signin
 */
export async function verifyProtectedRoute(page: Page, protectedUrl: string) {
  await page.goto(protectedUrl);

  // Should redirect to signin
  await page.waitForURL('/signin', { timeout: 5000 });
  await expect(page).toHaveURL('/signin');
}

/**
 * Create a test client account (for testing purposes)
 * Returns the created client email and password
 */
export async function createTestClient(page: Page, suffix: string = Date.now().toString()) {
  const testEmail = `test-client-${suffix}@example.com`;
  const testPassword = 'TestPassword123!';

  await page.goto('/signup');
  await page.waitForLoadState('networkidle');

  // Fill in registration form
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', `Client ${suffix}`);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success (adjust based on your flow)
  await page.waitForTimeout(2000);

  return { email: testEmail, password: testPassword };
}

/**
 * Wait for authentication state to be ready
 */
export async function waitForAuthReady(page: Page) {
  // Wait for auth context to be initialized
  await page.waitForTimeout(1000);

  // Check if any auth loading indicators are present
  const loadingIndicator = page.locator('[data-testid="auth-loading"], .loading-auth');
  if (await loadingIndicator.count() > 0) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
