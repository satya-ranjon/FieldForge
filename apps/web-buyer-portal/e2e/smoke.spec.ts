import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the buyer portal application with enterprise header', async ({ page, isMobile }) => {
    // Check main title / header elements
    await expect(page.locator('header').getByText('FieldForge', { exact: true })).toBeVisible();
    await expect(page.locator('header').getByText('Enterprise', { exact: true })).toBeVisible();
    if (!isMobile) {
      await expect(page.getByText('Apex Retail Corp').first()).toBeVisible();
    }
  });

  test('renders top KPI telemetry bar cards', async ({ page }) => {
    await expect(page.getByText('Active Work Orders')).toBeVisible();
    await expect(page.getByText('Tech Radar & Matching')).toBeVisible();
    await expect(page.getByText('SLA SLO Adherence')).toBeVisible();
    await expect(page.getByText('Escrow Protected Vault')).toBeVisible();
  });

  test('renders footer security and status telemetry', async ({ page }) => {
    await expect(page.getByText('FieldForge Enterprise v1.0.0')).toBeVisible();
    await expect(page.getByText(/99.98% SLO Target/i)).toBeVisible();
    await expect(page.getByText(/AES-256 Escrow Vault/i)).toBeVisible();
  });
});
