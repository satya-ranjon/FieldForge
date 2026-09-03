import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Authentication & Storage Persistence Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept login API endpoint to provide deterministic auth response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'test-access-token-xyz',
          refreshToken: 'test-refresh-token-xyz',
          user: {
            id: 'b1111111-1111-1111-1111-111111111111',
            email: 'buyer.portal@fieldforge.dev',
            role: 'BUYER',
            status: 'ACTIVE'
          }
        })
      });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b1111111-1111-1111-1111-111111111111',
          email: 'buyer.portal@fieldforge.dev',
          role: 'BUYER',
          status: 'ACTIVE',
          buyerProfile: {
            id: 'bp-1',
            companyName: 'Apex Logistics Corp'
          }
        })
      });
    });
  });

  test('loads unauthenticated on clean storage and does not auto-login after logout and localStorage clear', async ({
    page
  }) => {
    // 1. Initial load with clean storage
    await page.goto('/');

    // Verify Sign In button is present in header and Sign Out / user menu is not visible
    const headerSignInButton = page.locator('header').getByRole('button', { name: /Sign In/i });
    await expect(headerSignInButton).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Out/i })).not.toBeVisible();

    // 2. Open Auth Modal and log in
    await headerSignInButton.click();
    const modalHeading = page.getByRole('heading', { name: /FieldForge Identity/i });
    await expect(modalHeading).toBeVisible();

    // Click Quick Demo Auto-Fill "Buyer Org"
    await page.getByRole('button', { name: 'Buyer Org' }).click();

    // Submit login form
    await page.getByRole('button', { name: /Authorize Session/i }).click();

    // Wait for modal to close and session to be established
    await expect(modalHeading).not.toBeVisible();
    await expect(headerSignInButton).not.toBeVisible();
    const userMenuButton = page.locator('header').locator('button[aria-haspopup="true"]');
    await expect(userMenuButton).toBeVisible();

    // 3. Reload the page - session should persist from localStorage
    await page.reload();
    await expect(userMenuButton).toBeVisible();
    await expect(headerSignInButton).not.toBeVisible();

    // 4. Log out
    await userMenuButton.click();
    const signOutButton = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Verify logged out state
    await expect(headerSignInButton).toBeVisible();
    await expect(userMenuButton).not.toBeVisible();

    // 5. Clear localStorage (the exact bug scenario reported)
    await page.evaluate(() => localStorage.clear());

    // 6. Reload page
    await page.reload();

    // Verify user is NOT auto-logged in: "Sign In" button must remain visible
    await expect(headerSignInButton).toBeVisible();
    await expect(userMenuButton).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Out/i })).not.toBeVisible();
  });
});
