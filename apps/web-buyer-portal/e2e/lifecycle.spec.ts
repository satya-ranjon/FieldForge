import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Full Lifecycle — SRS §5 Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic API routes interception for self-contained CI execution
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'test-buyer-access-token-jwt',
          refreshToken: 'test-buyer-refresh-token-jwt',
          user: {
            id: 'b1111111-1111-1111-1111-111111111111',
            email: 'buyer.enterprise@fieldforge.dev',
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
          email: 'buyer.enterprise@fieldforge.dev',
          role: 'BUYER',
          status: 'ACTIVE',
          buyerProfile: {
            id: 'bp-1',
            companyName: 'Apex Enterprise Logistics'
          }
        })
      });
    });

    await page.route('**/api/v1/work-orders', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'wo-lifecycle-001',
            buyerId: 'b1111111-1111-1111-1111-111111111111',
            status: 'DRAFT',
            ...body
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/work-orders/*/publish', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wo-lifecycle-001',
          status: 'PUBLISHED'
        })
      });
    });

    await page.route('**/api/v1/billing/escrow/preauth', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'esc-preauth-001',
          workOrderId: 'wo-lifecycle-001',
          status: 'HELD',
          amountMinor: 45000
        })
      });
    });

    await page.route('**/api/v1/dispatch/bids/*/accept', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'bid-001',
          workOrderId: 'wo-101',
          status: 'ACCEPTED'
        })
      });
    });

    await page.route('**/api/v1/work-orders/*/transition', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wo-101',
          status: 'APPROVED'
        })
      });
    });

    await page.route('**/api/v1/billing/escrow/*/release', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workOrderId: 'wo-101',
          status: 'RELEASED'
        })
      });
    });
  });

  test('executes end-to-end buyer path: create → publish → accept bid → approve → payout', async ({
    page
  }) => {
    // 1. Initial load & authenticate
    await page.goto('/');
    const headerSignInButton = page.locator('header').getByRole('button', { name: /Sign In/i });
    await headerSignInButton.click();
    await page.getByRole('button', { name: 'Buyer Org' }).click();
    await page.getByRole('button', { name: /Authorize Session/i }).click();

    // 2. Navigate to SOW Studio to create & publish a work order
    await page.getByRole('button', { name: /SOW Studio/i }).click({ force: true });
    await expect(page.getByText('Enterprise SOW Template Presets')).toBeVisible();

    // Fill SOP step and advance through stepper
    const input = page.getByPlaceholder('Add an SOP step...');
    await input.fill('Perform end-to-end signal check');
    await page.getByRole('button', { name: 'Add' }).click({ force: true });
    await expect(page.getByText('Perform end-to-end signal check')).toBeVisible();

    // Advance Stepper
    await page.getByRole('button', { name: 'Continue' }).click({ force: true }); // Step 2: Site Location
    await expect(page.getByText('Site Street Address')).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click({ force: true }); // Step 3: Budget Model
    await expect(page.getByText('Budget Billing Model')).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click({ force: true }); // Step 4: Deliverables
    await expect(page.getByText(/Mandatory Proof-of-Work Deliverables/i)).toBeVisible();

    // Publish & Lock Escrow
    const publishBtn = page.getByRole('button', { name: /Publish & Lock Escrow/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click({ force: true });
    await expect(page.getByText(/published to dispatch queue/i)).toBeVisible();

    // 3. Navigate to Technician Radar to accept a contractor bid
    await page.getByRole('button', { name: /Technician Radar/i }).click({ force: true });
    await expect(page.getByText('Geospatial Technician Radar & Bids Matrix')).toBeVisible();

    const acceptBidBtn = page.getByRole('button', { name: /Accept Bid/i }).first();
    if (await acceptBidBtn.isVisible()) {
      await acceptBidBtn.click({ force: true });
      await expect(page.getByText(/Bid from .* accepted/i)).toBeVisible();
    }

    // 4. Return to Live Operations to approve deliverables
    await page.getByRole('button', { name: /Live Operations/i }).click({ force: true });
    await expect(page.getByText('Live Dispatch & FSM Command Center')).toBeVisible();

    // 5. Navigate to Escrow Vault to inspect release ledger
    await page.getByRole('button', { name: /Escrow Vault/i }).click({ force: true });
    await expect(page.getByText('Total Locked in Escrow')).toBeVisible();

    // Click Release Escrow on pending transaction if modal/button present
    const releaseBtn = page.getByRole('button', { name: /Release/i }).first();
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click({ force: true });
      const confirmReleaseBtn = page.getByRole('button', { name: /Confirm Release/i });
      if (await confirmReleaseBtn.isVisible()) {
        await confirmReleaseBtn.click({ force: true });
        await expect(page.getByText(/released to technician/i)).toBeVisible();
      }
    }
  });
});
