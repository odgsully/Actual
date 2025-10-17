import { test, expect } from '@playwright/test';
import { signInAsAdmin, signOut, verifyProtectedRoute } from '../helpers/auth';
import { ADMIN_CREDENTIALS } from '../helpers/data';

/**
 * Admin Authentication E2E Tests
 *
 * Tests admin sign in, sign out, session persistence, and protected route access
 */

test.describe('Admin Authentication', () => {
  test.describe('Sign In', () => {
    test('should successfully sign in with valid credentials', async ({ page }) => {
      await page.goto('/signin');

      // Fill in credentials
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to admin dashboard
      await page.waitForURL('/admin', { timeout: 10000 });
      await expect(page).toHaveURL('/admin');

      // Verify admin dashboard content is visible
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/signin');

      // Fill in invalid credentials
      await page.fill('input[name="email"]', 'wrong@example.com');
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

    test('should show validation error with empty email', async ({ page }) => {
      await page.goto('/signin');

      // Leave email empty, fill password
      await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should show validation error
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should show validation error with empty password', async ({ page }) => {
      await page.goto('/signin');

      // Fill email, leave password empty
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);

      // Submit form
      await page.click('button[type="submit"]');

      // Should show validation error
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/signin');

      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('button[aria-label*="password"], button:has-text("Show")');

      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button if it exists
      if (await toggleButton.count() > 0) {
        await toggleButton.first().click();

        // Password should now be visible
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click toggle again
        await toggleButton.first().click();

        // Password should be hidden again
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  test.describe('Sign Out', () => {
    test('should successfully sign out', async ({ page }) => {
      // Sign in first
      await signInAsAdmin(page);

      // Sign out
      await signOut(page);

      // Should be on signin page
      await expect(page).toHaveURL('/signin');

      // Should not be able to access admin pages
      await page.goto('/admin');
      await page.waitForURL('/signin', { timeout: 5000 });
      await expect(page).toHaveURL('/signin');
    });

    test('should clear session on sign out', async ({ page }) => {
      // Sign in
      await signInAsAdmin(page);

      // Verify we're on admin page
      await expect(page).toHaveURL('/admin');

      // Sign out
      await signOut(page);

      // Try to go back to admin page
      await page.goto('/admin');

      // Should redirect to signin (session cleared)
      await page.waitForURL('/signin', { timeout: 5000 });
      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page reload', async ({ page }) => {
      // Sign in
      await signInAsAdmin(page);

      // Verify we're on admin page
      await expect(page).toHaveURL('/admin');

      // Reload page
      await page.reload();

      // Should still be on admin page (session persisted)
      await expect(page).toHaveURL('/admin');
    });

    test('should maintain session across navigation', async ({ page }) => {
      // Sign in
      await signInAsAdmin(page);

      // Navigate to clients page
      await page.goto('/admin/clients');
      await expect(page).toHaveURL('/admin/clients');

      // Navigate to upload page
      await page.goto('/admin/upload');
      await expect(page).toHaveURL('/admin/upload');

      // Navigate back to dashboard
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');

      // Session should still be active
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to signin when accessing admin dashboard without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/admin');
    });

    test('should redirect to signin when accessing admin clients without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/admin/clients');
    });

    test('should redirect to signin when accessing admin upload without auth', async ({
      page,
    }) => {
      await verifyProtectedRoute(page, '/admin/upload');
    });

    test('should redirect to signin when accessing admin MCAO without auth', async ({ page }) => {
      await verifyProtectedRoute(page, '/admin/mcao');
    });

    test('should allow access to admin routes after authentication', async ({ page }) => {
      // Sign in
      await signInAsAdmin(page);

      // Should be able to access all admin routes
      const adminRoutes = ['/admin', '/admin/clients', '/admin/upload', '/admin/mcao'];

      for (const route of adminRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
      }
    });
  });

  test.describe('Admin Role Authorization', () => {
    test('should verify admin user has correct role', async ({ page }) => {
      await signInAsAdmin(page);

      // Check if admin-only UI elements are visible
      await page.goto('/admin');

      // Admin should see admin navigation items
      const adminNav = page.locator(
        'nav a:has-text("Clients"), nav a:has-text("Upload"), nav a:has-text("MCAO")'
      );
      await expect(adminNav.first()).toBeVisible({ timeout: 5000 });
    });
  });
});
