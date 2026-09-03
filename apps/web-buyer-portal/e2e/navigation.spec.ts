import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates across all 5 command center tabs', async ({ page }) => {
    // 1. Live Operations Tab (Default)
    await expect(page.getByRole('button', { name: /Live Operations/i })).toBeVisible();

    // 2. Switch to SOW Studio
    await page.getByRole('button', { name: /SOW Studio/i }).click({ force: true });
    await expect(page.getByText('Enterprise SOW Template Presets')).toBeVisible();

    // 3. Switch to Technician Radar
    await page.getByRole('button', { name: /Technician Radar/i }).click({ force: true });
    await expect(page.getByText('Geospatial Technician Radar & Bids Matrix')).toBeVisible();

    // 4. Switch to Escrow Vault
    await page.getByRole('button', { name: /Escrow Vault/i }).click({ force: true });
    await expect(page.getByText('Total Locked in Escrow')).toBeVisible();

    // 5. Switch to SLA Telemetry
    await page.getByRole('button', { name: /SLA Telemetry/i }).click({ force: true });
    await expect(page.getByText('SLA Compliance & Observability Telemetry')).toBeVisible();

    // Return to Operations
    await page.getByRole('button', { name: /Live Operations/i }).click({ force: true });
    await expect(page.getByRole('button', { name: /Live Operations/i })).toHaveClass(/bg-blue-600/);
  });
});
