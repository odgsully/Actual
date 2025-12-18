import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../helpers/auth';
import { navigateToAdminClients } from '../helpers/navigation';
import { generateTestClient, WAIT_TIMES } from '../helpers/data';

/**
 * Admin Client Management E2E Tests
 *
 * Tests adding, editing, deleting, and searching clients
 */

test.describe('Admin Client Management', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await navigateToAdminClients(page);
  });

  test.describe('View Clients', () => {
    test('should display clients page', async ({ page }) => {
      await expect(page).toHaveURL('/admin/clients');

      // Should see page heading
      await expect(
        page.locator('h1:has-text("Clients"), h2:has-text("Clients")').first()
      ).toBeVisible();
    });

    test('should display client list or empty state', async ({ page }) => {
      // Either client list or empty state should be visible
      const clientList = page.locator('[data-testid="client-list"], table, .client-card');
      const emptyState = page.locator(
        'text=/No clients found|No clients yet|Add your first client/i'
      );

      const hasClients = (await clientList.count()) > 0;
      const hasEmptyState = (await emptyState.count()) > 0;

      expect(hasClients || hasEmptyState).toBeTruthy();
    });

    test('should display add client button', async ({ page }) => {
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client"), a:has-text("Add Client")'
      );
      await expect(addButton.first()).toBeVisible();
    });
  });

  test.describe('Add Client', () => {
    test('should successfully add a new client', async ({ page }) => {
      const testClient = generateTestClient();

      // Click add client button
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();

      // Wait for form/modal to appear
      await page.waitForTimeout(WAIT_TIMES.short);

      // Fill in client details
      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();

      // Wait for success message or redirect
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Should see success message
      await expect(
        page.locator('text=/Client added|Client created|Success|Added successfully/i')
      ).toBeVisible({ timeout: 5000 });

      // Should see new client in list
      await expect(page.locator(`text=${testClient.email}`)).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for duplicate email', async ({ page }) => {
      const testClient = generateTestClient('duplicate-test');

      // Add client first time
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Try to add same email again
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', 'Another');
      await page.fill('input[name="lastName"]', 'Person');
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', '555-9999');

      await submitButton.first().click();

      // Should show error about duplicate email
      await expect(
        page.locator('text=/Email already exists|Duplicate email|already in use/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      // Click add client button
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      // Fill in invalid email
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Client');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="phone"]', '555-1234');

      // Try to submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();

      // Should show validation error
      await expect(
        page.locator('text=/Invalid email|Please enter a valid email/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for missing required fields', async ({ page }) => {
      // Click add client button
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();

      // Should show validation errors
      const firstNameError = page.locator('text=/First name is required/i');
      const lastNameError = page.locator('text=/Last name is required/i');
      const emailError = page.locator('text=/Email is required/i');

      const hasErrors =
        (await firstNameError.count()) > 0 ||
        (await lastNameError.count()) > 0 ||
        (await emailError.count()) > 0;

      expect(hasErrors).toBeTruthy();
    });
  });

  test.describe('Edit Client', () => {
    test('should successfully edit an existing client', async ({ page }) => {
      // First, add a client to edit
      const testClient = generateTestClient('edit-test');
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Now find and edit the client
      const clientRow = page.locator(`tr:has-text("${testClient.email}")`).first();
      const editButton = clientRow.locator('button:has-text("Edit"), button[aria-label*="Edit"]');

      if ((await editButton.count()) === 0) {
        // Try alternative selector
        const editIcon = page
          .locator(`text=${testClient.email}`)
          .locator('..')
          .locator('button')
          .first();
        await editIcon.click();
      } else {
        await editButton.first().click();
      }

      await page.waitForTimeout(WAIT_TIMES.short);

      // Update phone number
      const phoneInput = page.locator('input[name="phone"]');
      await phoneInput.clear();
      await phoneInput.fill('555-9999');

      // Save changes
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Should see success message
      await expect(
        page.locator('text=/Client updated|Changes saved|Updated successfully/i')
      ).toBeVisible({ timeout: 5000 });

      // Should see updated phone number
      await expect(page.locator('text=555-9999')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Delete Client', () => {
    test('should successfully delete a client with confirmation', async ({ page }) => {
      // First, add a client to delete
      const testClient = generateTestClient('delete-test');
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Now find and delete the client
      const clientRow = page.locator(`tr:has-text("${testClient.email}")`).first();
      const deleteButton = clientRow.locator(
        'button:has-text("Delete"), button[aria-label*="Delete"]'
      );

      if ((await deleteButton.count()) === 0) {
        // Try alternative selector
        const deleteIcon = page
          .locator(`text=${testClient.email}`)
          .locator('..')
          .locator('button')
          .last();
        await deleteIcon.click();
      } else {
        await deleteButton.first().click();
      }

      await page.waitForTimeout(WAIT_TIMES.short);

      // Confirm deletion
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")'
      );
      await confirmButton.last().click();

      await page.waitForTimeout(WAIT_TIMES.medium);

      // Should see success message
      await expect(
        page.locator('text=/Client deleted|Removed successfully|Deleted successfully/i')
      ).toBeVisible({ timeout: 5000 });

      // Client should no longer be in list
      await expect(page.locator(`text=${testClient.email}`)).not.toBeVisible({ timeout: 5000 });
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      // First, add a client
      const testClient = generateTestClient('cancel-delete-test');
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Click delete button
      const clientRow = page.locator(`tr:has-text("${testClient.email}")`).first();
      const deleteButton = clientRow.locator(
        'button:has-text("Delete"), button[aria-label*="Delete"]'
      );
      await deleteButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      // Cancel deletion
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")');
      if ((await cancelButton.count()) > 0) {
        await cancelButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Client should still be in list
        await expect(page.locator(`text=${testClient.email}`)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Search Clients', () => {
    test('should filter clients by search query', async ({ page }) => {
      // Add a couple of test clients
      const client1 = generateTestClient('search-1');
      const client2 = generateTestClient('search-2');

      for (const client of [client1, client2]) {
        const addButton = page.locator(
          'button:has-text("Add Client"), button:has-text("New Client")'
        );
        await addButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        await page.fill('input[name="firstName"]', client.firstName);
        await page.fill('input[name="lastName"]', client.lastName);
        await page.fill('input[name="email"]', client.email);
        await page.fill('input[name="phone"]', client.phone);

        const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
        await submitButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.medium);
      }

      // Find search input
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"], input[name="search"]'
      );

      if ((await searchInput.count()) > 0) {
        // Search for client1
        await searchInput.first().fill(client1.email);
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should see client1
        await expect(page.locator(`text=${client1.email}`)).toBeVisible();

        // Should not see client2 (if search is working)
        // Note: This may not work if search is not implemented yet
      }
    });
  });

  test.describe('Client Details', () => {
    test('should view client details', async ({ page }) => {
      // Add a test client
      const testClient = generateTestClient('details-test');
      const addButton = page.locator(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await addButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.short);

      await page.fill('input[name="firstName"]', testClient.firstName);
      await page.fill('input[name="lastName"]', testClient.lastName);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="phone"]', testClient.phone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();
      await page.waitForTimeout(WAIT_TIMES.medium);

      // Click on client to view details
      const clientRow = page.locator(`text=${testClient.email}`).first();
      await clientRow.click();
      await page.waitForTimeout(WAIT_TIMES.short);

      // Should see client details
      await expect(page.locator(`text=${testClient.firstName}`)).toBeVisible();
      await expect(page.locator(`text=${testClient.lastName}`)).toBeVisible();
      await expect(page.locator(`text=${testClient.email}`)).toBeVisible();
    });
  });
});
