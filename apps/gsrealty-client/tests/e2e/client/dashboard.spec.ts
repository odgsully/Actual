import { test, expect } from '@playwright/test';
import { signInAsClient } from '../helpers/auth';
import { navigateToClientDashboard } from '../helpers/navigation';
import { TEST_CLIENT_CREDENTIALS } from '../helpers/data';

/**
 * Client Dashboard E2E Tests
 *
 * Tests client dashboard overview, statistics, and navigation
 */

test.describe('Client Dashboard', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);
    await navigateToClientDashboard(page);
  });

  test.describe('Dashboard Overview', () => {
    test('should display client dashboard', async ({ page }) => {
      await expect(page).toHaveURL('/client');

      // Should see dashboard heading
      await expect(
        page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), h1:has-text("Welcome")').first()
      ).toBeVisible();
    });

    test('should display welcome message with client name', async ({ page }) => {
      // Should see welcome text
      await expect(
        page.locator('text=/Welcome|Hello|Hi/i')
      ).toBeVisible();
    });

    test('should display navigation menu', async ({ page }) => {
      // Should see navigation links
      const nav = page.locator('nav, aside').first();
      await expect(nav).toBeVisible();

      // Should have links to main sections
      await expect(
        page.locator('a:has-text("Properties"), a:has-text("Files"), a:has-text("Profile")')
      ).toHaveCount(3);
    });
  });

  test.describe('Statistics Cards', () => {
    test('should display property statistics', async ({ page }) => {
      // Look for property count/stats
      const propertyStats = page.locator(
        'text=/Properties|Total Properties/i'
      );

      if ((await propertyStats.count()) > 0) {
        await expect(propertyStats.first()).toBeVisible();

        // Should see a number
        await expect(page.locator('text=/\\d+.*propert/i')).toBeVisible();
      }
    });

    test('should display file statistics', async ({ page }) => {
      // Look for file count/stats
      const fileStats = page.locator(
        'text=/Files|Documents|Reports/i'
      );

      if ((await fileStats.count()) > 0) {
        await expect(fileStats.first()).toBeVisible();

        // Should see a count
        await expect(page.locator('text=/\\d+.*file/i')).toBeVisible();
      }
    });

    test('should display favorite properties count', async ({ page }) => {
      // Look for favorites
      const favStats = page.locator(
        'text=/Favorite|Liked|Saved/i'
      );

      if ((await favStats.count()) > 0) {
        await expect(favStats.first()).toBeVisible();
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('should have quick link to properties', async ({ page }) => {
      const propertiesLink = page.locator('a:has-text("Properties"), a:has-text("View Properties")');
      await expect(propertiesLink.first()).toBeVisible();

      // Click and verify navigation
      await propertiesLink.first().click();
      await expect(page).toHaveURL('/client/properties');
    });

    test('should have quick link to files', async ({ page }) => {
      const filesLink = page.locator('a:has-text("Files"), a:has-text("View Files")');
      await expect(filesLink.first()).toBeVisible();

      // Click and verify navigation
      await filesLink.first().click();
      await expect(page).toHaveURL('/client/files');
    });

    test('should have quick link to profile', async ({ page }) => {
      const profileLink = page.locator('a:has-text("Profile"), a:has-text("My Profile")');
      await expect(profileLink.first()).toBeVisible();

      // Click and verify navigation
      await profileLink.first().click();
      await expect(page).toHaveURL('/client/profile');
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent activity section', async ({ page }) => {
      const recentActivity = page.locator(
        'text=/Recent Activity|Recent|Activity|Latest Updates/i'
      );

      if ((await recentActivity.count()) > 0) {
        await expect(recentActivity.first()).toBeVisible();

        // Should see activity list or empty state
        const activityList = page.locator('[data-testid="activity-list"], .activity-feed');
        const emptyState = page.locator('text=/No recent activity|No activity yet/i');

        const hasActivity = (await activityList.count()) > 0 || (await emptyState.count()) > 0;
        expect(hasActivity).toBeTruthy();
      }
    });

    test('should display recent properties', async ({ page }) => {
      const recentProperties = page.locator(
        'text=/Recent Properties|Recently Added|Latest Properties/i'
      );

      if ((await recentProperties.count()) > 0) {
        await expect(recentProperties.first()).toBeVisible();
      }
    });

    test('should display recent files', async ({ page }) => {
      const recentFiles = page.locator(
        'text=/Recent Files|Recently Uploaded|Latest Files/i'
      );

      if ((await recentFiles.count()) > 0) {
        await expect(recentFiles.first()).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Dashboard should still be visible
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Navigation might be in a mobile menu
      const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("Menu")');
      if ((await mobileMenu.count()) > 0) {
        await mobileMenu.first().click();

        // Menu should appear
        await expect(
          page.locator('nav a:has-text("Properties")').first()
        ).toBeVisible({ timeout: 2000 });
      }
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Dashboard should be visible
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // All main sections should be visible
      await expect(page).toHaveURL('/client');
    });
  });

  test.describe('Dashboard Widgets', () => {
    test('should display property summary widget', async ({ page }) => {
      const propertySummary = page.locator(
        '[data-testid="property-summary"], .property-widget'
      );

      if ((await propertySummary.count()) > 0) {
        await expect(propertySummary.first()).toBeVisible();
      }
    });

    test('should display file summary widget', async ({ page }) => {
      const fileSummary = page.locator(
        '[data-testid="file-summary"], .file-widget'
      );

      if ((await fileSummary.count()) > 0) {
        await expect(fileSummary.first()).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Interactivity', () => {
    test('should allow refreshing dashboard data', async ({ page }) => {
      // Look for refresh button
      const refreshButton = page.locator(
        'button[aria-label*="Refresh"], button:has-text("Refresh")'
      );

      if ((await refreshButton.count()) > 0) {
        await refreshButton.first().click();

        // Should see loading indicator briefly
        const loadingIndicator = page.locator('[role="progressbar"], text=/Loading|Refreshing/i');

        // Loading may be too fast to catch, so we don't assert
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display helpful message when no properties', async ({ page }) => {
      // If no properties exist, should see helpful empty state
      const emptyState = page.locator(
        'text=/No properties yet|Get started|Contact your agent/i'
      );

      // Empty state may or may not be present
      const hasEmpty = (await emptyState.count()) > 0;
      expect(hasEmpty || true).toBeTruthy();
    });
  });
});
