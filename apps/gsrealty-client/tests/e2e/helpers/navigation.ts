import { Page, expect } from '@playwright/test';

/**
 * Navigation Helper Functions
 *
 * Provides reusable navigation utilities for E2E tests
 */

/**
 * Navigate to admin dashboard
 */
export async function navigateToAdminDashboard(page: Page) {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin');
}

/**
 * Navigate to admin clients page
 */
export async function navigateToAdminClients(page: Page) {
  await page.goto('/admin/clients');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin/clients');
}

/**
 * Navigate to admin upload page
 */
export async function navigateToAdminUpload(page: Page) {
  await page.goto('/admin/upload');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin/upload');
}

/**
 * Navigate to admin MCAO lookup page
 */
export async function navigateToAdminMCAO(page: Page) {
  await page.goto('/admin/mcao');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin/mcao');
}

/**
 * Navigate to client dashboard
 */
export async function navigateToClientDashboard(page: Page) {
  await page.goto('/client');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/client');
}

/**
 * Navigate to client properties page
 */
export async function navigateToClientProperties(page: Page) {
  await page.goto('/client/properties');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/client/properties');
}

/**
 * Navigate to client files page
 */
export async function navigateToClientFiles(page: Page) {
  await page.goto('/client/files');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/client/files');
}

/**
 * Navigate to client profile page
 */
export async function navigateToClientProfile(page: Page) {
  await page.goto('/client/profile');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/client/profile');
}

/**
 * Navigate using sidebar link
 */
export async function navigateViaSidebar(page: Page, linkText: string) {
  const sidebarLink = page.locator(`nav a:has-text("${linkText}"), aside a:has-text("${linkText}")`).first();
  await sidebarLink.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate back
 */
export async function navigateBack(page: Page) {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional buffer for any animations
}
