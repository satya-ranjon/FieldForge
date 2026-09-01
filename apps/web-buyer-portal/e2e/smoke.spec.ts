import { test, expect } from '@playwright/test';

test.describe('Buyer Portal Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the buyer portal application with enterprise header', async ({ page }) => {
    // Check main title / header elements
    await expect(page.locator('header').getByText('FieldForge', { exact: true })).toBeVisible();
    await expect(page.getByText('ENTERPRISE BUYER HUB')).toBeVisible();
    await expect(page.getByText('Apex Retail Corp')).toBeVisible();
  });

  test('renders top KPI telemetry bar cards', async ({ page }) => {
    await expect(page.getByText('Active Work Orders')).toBeVisible();
    await expect(page.getByText('Technicians on Radar')).toBeVisible();
    await expect(page.getByText('SLA Adherence Rate')).toBeVisible();
    await expect(page.getByText('Escrow Locked Vault')).toBeVisible();
  });

  test('renders footer security and status telemetry', async ({ page }) => {
    await expect(page.getByText('FieldForge Enterprise v1.0.0')).toBeVisible();
    await expect(page.getByText('99.98% SLO Target Met')).toBeVisible();
    await expect(page.getByText('AES-256 Encrypted Escrow Vault')).toBeVisible();
  });
});
