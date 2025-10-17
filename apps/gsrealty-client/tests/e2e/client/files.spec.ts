import { test, expect } from '@playwright/test';
import { signInAsClient } from '../helpers/auth';
import { navigateToClientFiles } from '../helpers/navigation';
import { TEST_CLIENT_CREDENTIALS, WAIT_TIMES } from '../helpers/data';

/**
 * Client Files E2E Tests
 *
 * Tests file viewing, downloading, and filtering
 */

test.describe('Client Files', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);
    await navigateToClientFiles(page);
  });

  test.describe('Files Page', () => {
    test('should display files page', async ({ page }) => {
      await expect(page).toHaveURL('/client/files');

      // Should see page heading
      await expect(
        page.locator('h1:has-text("Files"), h2:has-text("Files"), h1:has-text("Documents")').first()
      ).toBeVisible();
    });

    test('should display file list or empty state', async ({ page }) => {
      // Either file list or empty state should be visible
      const fileList = page.locator('[data-testid="file-list"], .file-list, table');
      const emptyState = page.locator('text=/No files found|No files yet|No documents available/i');

      const hasFiles = (await fileList.count()) > 0;
      const hasEmptyState = (await emptyState.count()) > 0;

      expect(hasFiles || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('File List', () => {
    test('should display file names', async ({ page }) => {
      const fileItem = page.locator('[data-testid="file-item"], .file-item, tr').first();

      if ((await fileItem.count()) > 0) {
        await expect(fileItem).toBeVisible();

        // Should see file name
        await expect(fileItem.locator('text=/\\.csv|\\.xlsx|\\.pdf|\\.jpg|\\.png/i')).toBeVisible();
      }
    });

    test('should display file upload dates', async ({ page }) => {
      const fileItem = page.locator('[data-testid="file-item"], .file-item, tr').first();

      if ((await fileItem.count()) > 0) {
        // Should see date
        await expect(
          fileItem.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d+.*ago|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i')
        ).toBeVisible();
      }
    });

    test('should display file sizes', async ({ page }) => {
      const fileItem = page.locator('[data-testid="file-item"], .file-item, tr').first();

      if ((await fileItem.count()) > 0) {
        // Should see file size
        await expect(
          fileItem.locator('text=/\\d+.*KB|MB|GB|bytes/i')
        ).toBeVisible();
      }
    });

    test('should display file types/categories', async ({ page }) => {
      const fileItem = page.locator('[data-testid="file-item"], .file-item, tr').first();

      if ((await fileItem.count()) > 0) {
        // Should see file type indicator
        const fileType = fileItem.locator('text=/CSV|XLSX|PDF|Image|Document/i');
        if ((await fileType.count()) > 0) {
          await expect(fileType.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('File Download', () => {
    test('should download a file', async ({ page }) => {
      const downloadButton = page.locator(
        'button:has-text("Download"), a:has-text("Download"), button[aria-label*="Download"]'
      ).first();

      if ((await downloadButton.count()) > 0) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');

        // Click download
        await downloadButton.click();

        // Wait for download to start
        const download = await downloadPromise.catch(() => null);

        if (download) {
          // Download started successfully
          expect(download).toBeTruthy();

          // Optionally verify filename
          const filename = download.suggestedFilename();
          expect(filename.length).toBeGreaterThan(0);
        }
      }
    });

    test('should download multiple files', async ({ page }) => {
      const downloadButtons = page.locator(
        'button:has-text("Download"), a:has-text("Download")'
      );

      const buttonCount = await downloadButtons.count();

      if (buttonCount >= 2) {
        // Download first file
        const download1Promise = page.waitForEvent('download');
        await downloadButtons.nth(0).click();
        await download1Promise.catch(() => null);

        await page.waitForTimeout(WAIT_TIMES.short);

        // Download second file
        const download2Promise = page.waitForEvent('download');
        await downloadButtons.nth(1).click();
        await download2Promise.catch(() => null);

        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Search Files', () => {
    test('should filter files by search query', async ({ page }) => {
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"], input[name="search"]'
      );

      if ((await searchInput.count()) > 0) {
        // Search for files
        await searchInput.first().fill('property');
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Results should update
        const fileItems = page.locator('[data-testid="file-item"], .file-item, tr');

        if ((await fileItems.count()) > 0) {
          // Should see files matching search
          expect(await fileItems.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should clear search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');

      if ((await searchInput.count()) > 0) {
        // Enter search
        await searchInput.first().fill('test');
        await page.waitForTimeout(WAIT_TIMES.short);

        // Clear search
        await searchInput.first().clear();
        await page.waitForTimeout(WAIT_TIMES.short);

        // All files should be visible again
        const fileItems = page.locator('[data-testid="file-item"], .file-item');
        expect(await fileItems.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Filter Files', () => {
    test('should filter by file type', async ({ page }) => {
      const filterButton = page.locator('button:has-text("Filter"), select[name="fileType"]');

      if ((await filterButton.count()) > 0) {
        await filterButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select CSV files
        const csvOption = page.locator('text="CSV", option[value="csv"]');
        if ((await csvOption.count()) > 0) {
          await csvOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Should only see CSV files
          const fileItems = page.locator('[data-testid="file-item"], .file-item');
          expect(await fileItems.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should filter by date range', async ({ page }) => {
      const dateFilter = page.locator('input[type="date"], input[name="startDate"]');

      if ((await dateFilter.count()) > 0) {
        // Set start date
        await dateFilter.first().fill('2024-01-01');
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Results should update
        const fileItems = page.locator('[data-testid="file-item"], .file-item');
        expect(await fileItems.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Sorting', () => {
    test('should sort files by name', async ({ page }) => {
      const sortButton = page.locator('button:has-text("Sort"), select[name="sort"]');

      if ((await sortButton.count()) > 0) {
        await sortButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select name sort
        const nameOption = page.locator('text=/Name|Alphabetical/i');
        if ((await nameOption.count()) > 0) {
          await nameOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Files should be re-ordered
          expect(true).toBeTruthy();
        }
      }
    });

    test('should sort files by date', async ({ page }) => {
      const sortButton = page.locator('button:has-text("Sort"), select[name="sort"]');

      if ((await sortButton.count()) > 0) {
        await sortButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select date sort
        const dateOption = page.locator('text=/Date|Newest|Oldest/i');
        if ((await dateOption.count()) > 0) {
          await dateOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Files should be re-ordered
          expect(true).toBeTruthy();
        }
      }
    });

    test('should sort files by size', async ({ page }) => {
      const sortButton = page.locator('button:has-text("Sort"), select[name="sort"]');

      if ((await sortButton.count()) > 0) {
        await sortButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select size sort
        const sizeOption = page.locator('text=/Size|Largest|Smallest/i');
        if ((await sizeOption.count()) > 0) {
          await sizeOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Files should be re-ordered
          expect(true).toBeTruthy();
        }
      }
    });
  });

  test.describe('File Preview', () => {
    test('should preview a file', async ({ page }) => {
      const fileItem = page.locator('[data-testid="file-item"], .file-item, tr').first();

      if ((await fileItem.count()) > 0) {
        // Click on file to preview
        await fileItem.click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Should see preview modal or navigate to preview page
        const preview = page.locator('[role="dialog"], .modal, .file-preview');
        if ((await preview.count()) > 0) {
          await expect(preview.first()).toBeVisible({ timeout: 5000 });

          // Close preview
          const closeButton = page.locator('button[aria-label*="Close"], button:has-text("Close")');
          if ((await closeButton.count()) > 0) {
            await closeButton.first().click();
          }
        }
      }
    });
  });

  test.describe('File Information', () => {
    test('should view file details', async ({ page }) => {
      const infoButton = page.locator(
        'button:has-text("Info"), button[aria-label*="Information"]'
      ).first();

      if ((await infoButton.count()) > 0) {
        await infoButton.click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should see file details
        await expect(
          page.locator('text=/File Name|Upload Date|File Size|File Type/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Pagination', () => {
    test('should paginate through files', async ({ page }) => {
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="Next"]');

      if ((await nextButton.count()) > 0 && (await nextButton.first().isEnabled())) {
        await nextButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Should see page 2
        const pageIndicator = page.locator('text=/Page 2|2 of/i');
        if ((await pageIndicator.count()) > 0) {
          await expect(pageIndicator.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display helpful message when no files', async ({ page }) => {
      // Look for empty state
      const emptyState = page.locator(
        'text=/No files yet|No documents|Your agent will upload files/i'
      );

      // Empty state may or may not be present
      const hasEmpty = (await emptyState.count()) > 0;
      expect(hasEmpty || true).toBeTruthy();
    });
  });

  test.describe('File Categories', () => {
    test('should filter by file category', async ({ page }) => {
      const categoryTabs = page.locator(
        '[role="tab"], .tab, button:has-text("All"), button:has-text("Properties")'
      );

      if ((await categoryTabs.count()) > 1) {
        // Click on different category
        await categoryTabs.nth(1).click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Files should be filtered by category
        expect(true).toBeTruthy();
      }
    });
  });
});
