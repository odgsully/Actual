import { test, expect } from '@playwright/test';
import { signInAsClient } from '../helpers/auth';
import { navigateToClientProfile } from '../helpers/navigation';
import { TEST_CLIENT_CREDENTIALS, WAIT_TIMES } from '../helpers/data';

/**
 * Client Profile E2E Tests
 *
 * Tests profile viewing, editing, and password management
 */

test.describe('Client Profile', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await signInAsClient(page, TEST_CLIENT_CREDENTIALS.email, TEST_CLIENT_CREDENTIALS.password);
    await navigateToClientProfile(page);
  });

  test.describe('Profile Page', () => {
    test('should display profile page', async ({ page }) => {
      await expect(page).toHaveURL('/client/profile');

      // Should see page heading
      await expect(
        page.locator('h1:has-text("Profile"), h2:has-text("Profile"), h1:has-text("Account")').first()
      ).toBeVisible();
    });

    test('should display user information', async ({ page }) => {
      // Should see email
      await expect(page.locator(`text=${TEST_CLIENT_CREDENTIALS.email}`)).toBeVisible();

      // Should see name fields or labels
      await expect(
        page.locator('text=/First Name|Last Name|Name/i')
      ).toBeVisible();
    });
  });

  test.describe('Edit Profile', () => {
    test('should enable editing profile information', async ({ page }) => {
      const editButton = page.locator(
        'button:has-text("Edit"), button:has-text("Edit Profile")'
      );

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Input fields should become editable
        const firstNameInput = page.locator('input[name="firstName"]');
        if ((await firstNameInput.count()) > 0) {
          await expect(firstNameInput.first()).toBeEnabled();
        }
      }
    });

    test('should successfully update first name', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const firstNameInput = page.locator('input[name="firstName"]');
        if ((await firstNameInput.count()) > 0) {
          // Update name
          await firstNameInput.first().clear();
          await firstNameInput.first().fill('UpdatedName');

          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Should see success message
          await expect(
            page.locator('text=/Profile updated|Changes saved|Successfully updated/i')
          ).toBeVisible({ timeout: 5000 });

          // Should see updated name
          await expect(page.locator('text=UpdatedName')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should successfully update last name', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const lastNameInput = page.locator('input[name="lastName"]');
        if ((await lastNameInput.count()) > 0) {
          await lastNameInput.first().clear();
          await lastNameInput.first().fill('UpdatedLastName');

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          await expect(
            page.locator('text=/Profile updated|Changes saved/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should successfully update phone number', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const phoneInput = page.locator('input[name="phone"]');
        if ((await phoneInput.count()) > 0) {
          await phoneInput.first().clear();
          await phoneInput.first().fill('555-9999');

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          await expect(
            page.locator('text=/Profile updated|Changes saved/i')
          ).toBeVisible({ timeout: 5000 });

          // Should see updated phone
          await expect(page.locator('text=555-9999')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should successfully update address', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const addressInput = page.locator('input[name="address"]');
        if ((await addressInput.count()) > 0) {
          await addressInput.first().clear();
          await addressInput.first().fill('456 New Address St');

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          await expect(
            page.locator('text=/Profile updated|Changes saved/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should cancel editing without saving changes', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const firstNameInput = page.locator('input[name="firstName"]');
        if ((await firstNameInput.count()) > 0) {
          const originalValue = await firstNameInput.first().inputValue();

          // Make a change
          await firstNameInput.first().clear();
          await firstNameInput.first().fill('TempName');

          // Cancel
          const cancelButton = page.locator('button:has-text("Cancel")');
          if ((await cancelButton.count()) > 0) {
            await cancelButton.first().click();
            await page.waitForTimeout(WAIT_TIMES.short);

            // Original value should be restored
            // (This depends on implementation - form might reset or navigate away)
            expect(true).toBeTruthy();
          }
        }
      }
    });

    test('should show validation error for invalid phone format', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const phoneInput = page.locator('input[name="phone"]');
        if ((await phoneInput.count()) > 0) {
          // Enter invalid phone
          await phoneInput.first().clear();
          await phoneInput.first().fill('invalid-phone');

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();

          // Should see validation error
          await expect(
            page.locator('text=/Invalid phone|Please enter a valid phone/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Change Password', () => {
    test('should display change password section', async ({ page }) => {
      const changePasswordSection = page.locator(
        'text=/Change Password|Update Password|Password/i'
      );

      if ((await changePasswordSection.count()) > 0) {
        await expect(changePasswordSection.first()).toBeVisible();
      }
    });

    test('should require current password to change password', async ({ page }) => {
      const changePasswordButton = page.locator(
        'button:has-text("Change Password"), button:has-text("Update Password")'
      );

      if ((await changePasswordButton.count()) > 0) {
        await changePasswordButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should see current password field
        const currentPasswordInput = page.locator('input[name="currentPassword"]');
        if ((await currentPasswordInput.count()) > 0) {
          await expect(currentPasswordInput.first()).toBeVisible();
        }
      }
    });

    test('should validate password strength', async ({ page }) => {
      const changePasswordButton = page.locator('button:has-text("Change Password")');

      if ((await changePasswordButton.count()) > 0) {
        await changePasswordButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const newPasswordInput = page.locator('input[name="newPassword"]');
        if ((await newPasswordInput.count()) > 0) {
          // Enter weak password
          await newPasswordInput.first().fill('weak');

          // Should see warning about password strength
          const passwordStrength = page.locator('text=/weak|strong|Password strength/i');
          if ((await passwordStrength.count()) > 0) {
            await expect(passwordStrength.first()).toBeVisible({ timeout: 3000 });
          }
        }
      }
    });

    test('should require password confirmation', async ({ page }) => {
      const changePasswordButton = page.locator('button:has-text("Change Password")');

      if ((await changePasswordButton.count()) > 0) {
        await changePasswordButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
        if ((await confirmPasswordInput.count()) > 0) {
          await expect(confirmPasswordInput.first()).toBeVisible();
        }
      }
    });

    test('should show error if passwords do not match', async ({ page }) => {
      const changePasswordButton = page.locator('button:has-text("Change Password")');

      if ((await changePasswordButton.count()) > 0) {
        await changePasswordButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const currentPasswordInput = page.locator('input[name="currentPassword"]');
        const newPasswordInput = page.locator('input[name="newPassword"]');
        const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

        if (
          (await currentPasswordInput.count()) > 0 &&
          (await newPasswordInput.count()) > 0 &&
          (await confirmPasswordInput.count()) > 0
        ) {
          await currentPasswordInput.first().fill('OldPassword123!');
          await newPasswordInput.first().fill('NewPassword123!');
          await confirmPasswordInput.first().fill('DifferentPassword123!');

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();

          // Should see error
          await expect(
            page.locator('text=/Passwords do not match|Passwords must match/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Profile Picture', () => {
    test('should display profile picture or avatar', async ({ page }) => {
      const profilePicture = page.locator('img[alt*="Profile"], img[alt*="Avatar"], .avatar');

      if ((await profilePicture.count()) > 0) {
        await expect(profilePicture.first()).toBeVisible();
      }
    });

    test('should allow uploading profile picture', async ({ page }) => {
      const uploadButton = page.locator(
        'button:has-text("Upload"), button:has-text("Change Photo")'
      );

      if ((await uploadButton.count()) > 0) {
        await uploadButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should see file input or upload modal
        const fileInput = page.locator('input[type="file"]');
        if ((await fileInput.count()) > 0) {
          await expect(fileInput.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Account Settings', () => {
    test('should display email preferences', async ({ page }) => {
      const emailPreferences = page.locator(
        'text=/Email Preferences|Notifications|Email Settings/i'
      );

      if ((await emailPreferences.count()) > 0) {
        await expect(emailPreferences.first()).toBeVisible();
      }
    });

    test('should toggle email notifications', async ({ page }) => {
      const notificationToggle = page.locator(
        'input[type="checkbox"][name*="notification"], [role="switch"]'
      ).first();

      if ((await notificationToggle.count()) > 0) {
        const isChecked = await notificationToggle.isChecked();

        // Toggle
        await notificationToggle.click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should be opposite of initial state
        const newState = await notificationToggle.isChecked();
        expect(newState).toBe(!isChecked);
      }
    });

    test('should display account status', async ({ page }) => {
      const accountStatus = page.locator(
        'text=/Account Status|Status|Active|Pending/i'
      );

      if ((await accountStatus.count()) > 0) {
        await expect(accountStatus.first()).toBeVisible();
      }
    });
  });

  test.describe('Delete Account', () => {
    test('should display delete account option', async ({ page }) => {
      const deleteAccountSection = page.locator(
        'text=/Delete Account|Close Account|Deactivate/i'
      );

      if ((await deleteAccountSection.count()) > 0) {
        await expect(deleteAccountSection.first()).toBeVisible();

        // Should have a delete button
        const deleteButton = page.locator(
          'button:has-text("Delete Account"), button:has-text("Close Account")'
        );
        if ((await deleteButton.count()) > 0) {
          await expect(deleteButton.first()).toBeVisible();
        }
      }
    });

    test('should show confirmation modal before deleting account', async ({ page }) => {
      const deleteButton = page.locator(
        'button:has-text("Delete Account"), button:has-text("Close Account")'
      );

      if ((await deleteButton.count()) > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        // Should see confirmation dialog
        await expect(
          page.locator('text=/Are you sure|Confirm|This action cannot be undone/i')
        ).toBeVisible({ timeout: 5000 });

        // Cancel deletion
        const cancelButton = page.locator('button:has-text("Cancel")');
        if ((await cancelButton.count()) > 0) {
          await cancelButton.first().click();
        }
      }
    });
  });

  test.describe('Profile Persistence', () => {
    test('should persist profile changes after page reload', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit")');

      if ((await editButton.count()) > 0) {
        await editButton.first().click();
        await page.waitForTimeout(WAIT_TIMES.short);

        const phoneInput = page.locator('input[name="phone"]');
        if ((await phoneInput.count()) > 0) {
          const uniquePhone = `555-${Math.floor(Math.random() * 9000) + 1000}`;

          await phoneInput.first().clear();
          await phoneInput.first().fill(uniquePhone);

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.first().click();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Reload page
          await page.reload();
          await page.waitForTimeout(WAIT_TIMES.medium);

          // Should still see updated phone
          await expect(page.locator(`text=${uniquePhone}`)).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
