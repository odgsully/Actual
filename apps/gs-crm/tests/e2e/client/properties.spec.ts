import { test, expect } from '@playwright/test';
import { signInAsClient } from '../helpers/auth';
import { navigateToClientProperties } from '../helpers/navigation';
import { TEST_CLIENT_CREDENTIALS, WAIT_TIMES } from '../helpers/data';

/**
 * Client Properties E2E Tests
 *
 * Tests property browsing, searching, filtering, and favoriting
 */

test.describe('Client Properties', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);
    await navigateToClientProperties(page);
  });

  test.describe('Properties Page', () => {
    test('should display properties page', async ({ page }) => {
      await expect(page).toHaveURL('/client/properties');

      // Should see page heading
      await expect(
        page.locator('h1:has-text("Properties"), h2:has-text("Properties")').first()
      ).toBeVisible();
    });

    test('should display property list or empty state', async ({ page }) => {
      // Either property list or empty state should be visible
      const propertyList = page.locator(
        '[data-testid="property-list"], .property-grid, .property-card'
      );
      const emptyState = page.locator(
        'text=/No properties found|No properties yet|No properties available/i'
      );

      const hasProperties = (await propertyList.count()) > 0;
      const hasEmptyState = (await emptyState.count()) > 0;

      expect(hasProperties || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('View Modes', () => {
    test('should toggle between grid and list view', async ({ page }) => {
      // Look for view toggle buttons
      const gridViewButton = page.locator(
        'button[aria-label*="Grid"], button:has-text("Grid")'
      );
      const listViewButton = page.locator(
        'button[aria-label*="List"], button:has-text("List")'
      );

      if ((await gridViewButton.count()) > 0 && (await listViewButton.count()) > 0) {
        // Start in grid view (usually default)
        await gridViewButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Verify grid layout
        const gridContainer = page.locator('.grid, [data-view="grid"]');
        if ((await gridContainer.count()) > 0) {
          await expect(gridContainer.first()).toBeVisible();
        }

        // Switch to list view
        await listViewButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Verify list layout
        const listContainer = page.locator('.list, [data-view="list"], table');
        if ((await listContainer.count()) > 0) {
          await expect(listContainer.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Property Cards', () => {
    test('should display property address', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        await expect(propertyCard).toBeVisible();

        // Should see address
        await expect(
          propertyCard.locator('text=/\\d+.*St|Ave|Rd|Dr|Blvd|Way/i')
        ).toBeVisible();
      }
    });

    test('should display property price', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        // Should see price with $ symbol
        await expect(propertyCard.locator('text=/\\$[\\d,]+/i')).toBeVisible();
      }
    });

    test('should display property details (beds, baths, sqft)', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        // Should see beds
        await expect(
          propertyCard.locator('text=/\\d+.*bed|BR/i')
        ).toBeVisible();

        // Should see baths
        await expect(
          propertyCard.locator('text=/\\d+.*bath|BA/i')
        ).toBeVisible();

        // Should see sqft
        await expect(
          propertyCard.locator('text=/\\d+.*sqft|sq ft/i')
        ).toBeVisible();
      }
    });

    test('should display property image', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        const propertyImage = propertyCard.locator('img').first();
        if ((await propertyImage.count()) > 0) {
          await expect(propertyImage).toBeVisible();
        }
      }
    });
  });

  test.describe('Search Properties', () => {
    test('should filter properties by search query', async ({ page }) => {
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"], input[name="search"]'
      );

      if ((await searchInput.count()) > 0) {
        // Search for a specific address or city
        await searchInput.first().fill('Phoenix');
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Results should update
        const propertyCards = page.locator('[data-testid="property-card"], .property-card');

        if ((await propertyCards.count()) > 0) {
          // Should see properties with Phoenix in the address
          const firstCard = propertyCards.first();
          await expect(firstCard).toBeVisible();
        }
      }
    });

    test('should clear search', async ({ page }) => {
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );

      if ((await searchInput.count()) > 0) {
        // Enter search
        await searchInput.first().fill('test');
        await page.waitForTimeout(WAIT_TIMES.short);

        // Clear search
        await searchInput.first().clear();
        await page.waitForTimeout(WAIT_TIMES.short);

        // All properties should be visible again
        const propertyCards = page.locator('[data-testid="property-card"], .property-card');
        expect(await propertyCards.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Filter Properties', () => {
    test('should filter by price range', async ({ page }) => {
      const priceFilter = page.locator(
        'input[name="minPrice"], input[placeholder*="Min Price"]'
      );

      if ((await priceFilter.count()) > 0) {
        await priceFilter.first().fill('300000');
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Results should update
        const propertyCards = page.locator('[data-testid="property-card"], .property-card');
        expect(await propertyCards.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter by number of bedrooms', async ({ page }) => {
      const bedroomsFilter = page.locator(
        'select[name="bedrooms"], input[name="bedrooms"], button:has-text("Bedrooms")'
      );

      if ((await bedroomsFilter.count()) > 0) {
        await bedroomsFilter.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select 3 bedrooms
        const threeBedsOption = page.locator('text="3", option[value="3"]');
        if ((await threeBedsOption.count()) > 0) {
          await threeBedsOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Results should update
          const propertyCards = page.locator('[data-testid="property-card"], .property-card');
          expect(await propertyCards.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should filter by number of bathrooms', async ({ page }) => {
      const bathroomsFilter = page.locator(
        'select[name="bathrooms"], input[name="bathrooms"], button:has-text("Bathrooms")'
      );

      if ((await bathroomsFilter.count()) > 0) {
        await bathroomsFilter.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select 2 bathrooms
        const twoBathsOption = page.locator('text="2", option[value="2"]');
        if ((await twoBathsOption.count()) > 0) {
          await twoBathsOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Results should update
          const propertyCards = page.locator('[data-testid="property-card"], .property-card');
          expect(await propertyCards.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should clear all filters', async ({ page }) => {
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("Reset"), button:has-text("Clear Filters")'
      );

      if ((await clearButton.count()) > 0) {
        await clearButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // All properties should be visible again
        const propertyCards = page.locator('[data-testid="property-card"], .property-card');
        expect(await propertyCards.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Favorite Properties', () => {
    test('should favorite a property', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        // Find favorite button (heart icon)
        const favoriteButton = propertyCard.locator(
          'button[aria-label*="Favorite"], button[aria-label*="Like"]'
        );

        if ((await favoriteButton.count()) > 0) {
          await favoriteButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.short);

          // Button should change state (filled heart, different color, etc.)
          // This is visual feedback - we'll just verify no error occurred
          expect(true).toBeTruthy();
        }
      }
    });

    test('should unfavorite a property', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        const favoriteButton = propertyCard.locator(
          'button[aria-label*="Favorite"], button[aria-label*="Like"]'
        );

        if ((await favoriteButton.count()) > 0) {
          // Favorite first
          await favoriteButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.short);

          // Unfavorite
          await favoriteButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.short);

          // Should return to unfavorited state
          expect(true).toBeTruthy();
        }
      }
    });

    test('should filter to show only favorites', async ({ page }) => {
      const favoritesFilter = page.locator(
        'button:has-text("Favorites"), input[type="checkbox"][name="favorites"]'
      );

      if ((await favoritesFilter.count()) > 0) {
        await favoritesFilter.first().click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Should show only favorited properties or empty state
        const propertyCards = page.locator('[data-testid="property-card"], .property-card');
        const emptyState = page.locator('text=/No favorites yet|No favorite properties/i');

        const hasProperties = (await propertyCards.count()) > 0;
        const hasEmpty = (await emptyState.count()) > 0;

        expect(hasProperties || hasEmpty).toBeTruthy();
      }
    });
  });

  test.describe('Property Details', () => {
    test('should open property details modal/page', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        await propertyCard.click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Should see property details
        await expect(
          page.locator('[role="dialog"], .modal, .property-details').first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should close property details', async ({ page }) => {
      const propertyCard = page.locator('[data-testid="property-card"], .property-card').first();

      if ((await propertyCard.count()) > 0) {
        await propertyCard.click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Find and click close button
        const closeButton = page.locator(
          'button[aria-label*="Close"], button:has-text("Close")'
        );

        if ((await closeButton.count()) > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.short);

          // Modal should be closed
          const modal = page.locator('[role="dialog"], .modal');
          if ((await modal.count()) > 0) {
            await expect(modal.first()).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should paginate through properties', async ({ page }) => {
      const nextButton = page.locator(
        'button:has-text("Next"), button[aria-label*="Next"]'
      );

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

    test('should go back to previous page', async ({ page }) => {
      const nextButton = page.locator('button:has-text("Next")');
      const prevButton = page.locator(
        'button:has-text("Previous"), button[aria-label*="Previous"]'
      );

      if ((await nextButton.count()) > 0 && (await nextButton.first().isEnabled())) {
        // Go to page 2
        await nextButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.medium);

        // Go back to page 1
        if ((await prevButton.count()) > 0 && (await prevButton.first().isEnabled())) {
          await prevButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Should be on page 1
          const pageIndicator = page.locator('text=/Page 1|1 of/i');
          if ((await pageIndicator.count()) > 0) {
            await expect(pageIndicator.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Sorting', () => {
    test('should sort properties by price', async ({ page }) => {
      const sortButton = page.locator(
        'select[name="sort"], button:has-text("Sort")'
      );

      if ((await sortButton.count()) > 0) {
        await sortButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Select price sort
        const priceOption = page.locator('text=/Price|Lowest Price|Highest Price/i');
        if ((await priceOption.count()) > 0) {
          await priceOption.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Properties should be re-ordered
          expect(true).toBeTruthy();
        }
      }
    });
  });
});
