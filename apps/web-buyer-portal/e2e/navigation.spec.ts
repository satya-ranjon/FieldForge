import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates across all 5 command center tabs', async ({ page }) => {
    // 1. Live Operations Tab (Default)
    await expect(page.getByRole('button', { name: /Live Operations/i })).toBeVisible();

    // 2. Switch to SOW Studio & Create
    await page.getByRole('button', { name: /SOW Studio & Create/i }).click({ force: true });
    await expect(page.getByText('Scope of Work (SOW) Standard & Work Order Creator')).toBeVisible();

    // 3. Switch to Technician Radar & Bids
    await page.getByRole('button', { name: /Technician Radar & Bids/i }).click({ force: true });
    await expect(page.getByText('Geospatial Technician Radar & Bids Matrix')).toBeVisible();

    // 4. Switch to Escrow Vault & Ledger
    await page.getByRole('button', { name: /Escrow Vault & Ledger/i }).click({ force: true });
    await expect(page.getByText('Total Locked in Escrow')).toBeVisible();

    // 5. Switch to SLA & Telemetry Audit
    await page.getByRole('button', { name: /SLA & Telemetry Audit/i }).click({ force: true });
    await expect(page.getByText('SLA Compliance & Observability Telemetry')).toBeVisible();

    // Return to Operations
    await page.getByRole('button', { name: /Live Operations/i }).click({ force: true });
    await expect(page.getByRole('button', { name: /Live Operations/i })).toHaveClass(/bg-blue-600/);
  });
});
