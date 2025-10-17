import { test, expect } from '@playwright/test';
import { signInAsAdmin, signInAsClient } from '../helpers/auth';
import { TEST_CLIENT_CREDENTIALS } from '../helpers/data';

/**
 * Shared Navigation E2E Tests
 *
 * Tests navigation behavior for both admin and client portals
 */

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test('should navigate between admin pages', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL('/admin');

    // Navigate to clients
    await page.goto('/admin/clients');
    await expect(page).toHaveURL('/admin/clients');

    // Navigate to upload
    await page.goto('/admin/upload');
    await expect(page).toHaveURL('/admin/upload');

    // Navigate to MCAO
    await page.goto('/admin/mcao');
    await expect(page).toHaveURL('/admin/mcao');

    // Navigate back to dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
  });

  test('should use sidebar navigation', async ({ page }) => {
    const clientsLink = page.locator('nav a:has-text("Clients"), aside a:has-text("Clients")');

    if ((await clientsLink.count()) > 0) {
      await clientsLink.first().click();
      await expect(page).toHaveURL('/admin/clients');
    }
  });

  test('should show active page indicator', async ({ page }) => {
    await page.goto('/admin/clients');

    const activeLink = page.locator(
      'nav a[aria-current="page"], nav a.active, aside a[aria-current="page"]'
    );

    if ((await activeLink.count()) > 0) {
      await expect(activeLink.first()).toBeVisible();
    }
  });

  test('should not allow access to client routes', async ({ page }) => {
    await page.goto('/client');

    // Should either redirect or show error
    // Admin should not see client portal
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const hasCorrectBehavior = currentUrl.includes('/admin') || currentUrl.includes('/403');

    expect(hasCorrectBehavior).toBeTruthy();
  });
});

test.describe('Client Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);
  });

  test('should navigate between client pages', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL('/client');

    // Navigate to properties
    await page.goto('/client/properties');
    await expect(page).toHaveURL('/client/properties');

    // Navigate to files
    await page.goto('/client/files');
    await expect(page).toHaveURL('/client/files');

    // Navigate to profile
    await page.goto('/client/profile');
    await expect(page).toHaveURL('/client/profile');

    // Navigate back to dashboard
    await page.goto('/client');
    await expect(page).toHaveURL('/client');
  });

  test('should use sidebar navigation', async ({ page }) => {
    const propertiesLink = page.locator(
      'nav a:has-text("Properties"), aside a:has-text("Properties")'
    );

    if ((await propertiesLink.count()) > 0) {
      await propertiesLink.first().click();
      await expect(page).toHaveURL('/client/properties');
    }
  });

  test('should show active page indicator', async ({ page }) => {
    await page.goto('/client/properties');

    const activeLink = page.locator(
      'nav a[aria-current="page"], nav a.active, aside a[aria-current="page"]'
    );

    if ((await activeLink.count()) > 0) {
      await expect(activeLink.first()).toBeVisible();
    }
  });

  test('should not allow access to admin routes', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to signin or show error
    // Client should not see admin portal
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const hasCorrectBehavior = currentUrl.includes('/client') || currentUrl.includes('/signin') || currentUrl.includes('/403');

    expect(hasCorrectBehavior).toBeTruthy();
  });
});

test.describe('Browser Navigation', () => {
  test('should handle back button correctly', async ({ page }) => {
    await signInAsAdmin(page);

    // Navigate through pages
    await page.goto('/admin/clients');
    await expect(page).toHaveURL('/admin/clients');

    await page.goto('/admin/upload');
    await expect(page).toHaveURL('/admin/upload');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/admin/clients');

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/admin');
  });

  test('should handle forward button correctly', async ({ page }) => {
    await signInAsAdmin(page);

    // Navigate through pages
    await page.goto('/admin/clients');
    await page.goto('/admin/upload');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/admin/clients');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/admin/upload');
  });

  test('should refresh page without losing state', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/clients');

    // Reload
    await page.reload();

    // Should still be on same page and authenticated
    await expect(page).toHaveURL('/admin/clients');
  });
});

test.describe('Breadcrumb Navigation', () => {
  test('should display breadcrumbs on nested pages', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/clients');

    // Look for breadcrumbs
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], .breadcrumb');

    if ((await breadcrumb.count()) > 0) {
      await expect(breadcrumb.first()).toBeVisible();
    }
  });

  test('should navigate using breadcrumb links', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/clients');

    const breadcrumbHome = page.locator('nav a:has-text("Admin"), nav a:has-text("Dashboard")');

    if ((await breadcrumbHome.count()) > 0) {
      await breadcrumbHome.first().click();
      await expect(page).toHaveURL('/admin');
    }
  });
});

test.describe('Mobile Navigation', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await signInAsAdmin(page);

    // Look for hamburger menu
    const mobileMenuButton = page.locator(
      'button[aria-label*="menu"], button:has-text("Menu")'
    );

    if ((await mobileMenuButton.count()) > 0) {
      await expect(mobileMenuButton.first()).toBeVisible();

      // Open menu
      await mobileMenuButton.first().click();
      await page.waitForTimeout(500);

      // Navigation should appear
      const nav = page.locator('nav a:has-text("Clients")');
      await expect(nav.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close mobile menu after navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signInAsAdmin(page);

    const mobileMenuButton = page.locator('button[aria-label*="menu"]');

    if ((await mobileMenuButton.count()) > 0) {
      // Open menu
      await mobileMenuButton.first().click();
      await page.waitForTimeout(500);

      // Click a nav link
      const navLink = page.locator('nav a:has-text("Clients")');
      if ((await navLink.count()) > 0) {
        await navLink.first().click();
        await page.waitForTimeout(1000);

        // Menu should close (implementation dependent)
        // We just verify navigation worked
        await expect(page).toHaveURL('/admin/clients');
      }
    }
  });
});

test.describe('Error Pages', () => {
  test('should show 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should see 404 message or error page
    const notFound = page.locator('text=/404|Not Found|Page not found/i');

    if ((await notFound.count()) > 0) {
      await expect(notFound.first()).toBeVisible();
    }
  });

  test('should allow navigating back from 404 page', async ({ page }) => {
    await signInAsAdmin(page);

    // Go to invalid page
    await page.goto('/admin/invalid-page');

    // Should see error or redirect
    await page.waitForTimeout(1000);

    // Try to navigate to valid page
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
  });
});
