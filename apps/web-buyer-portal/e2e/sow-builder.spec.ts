import { test, expect } from '@playwright/test';

test.describe('SOW Builder & Work Order Publishing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to SOW Studio
    await page.getByRole('button', { name: /SOW Studio & Create/i }).click();
    await expect(page.getByText('Scope of Work (SOW) Standard & Work Order Creator')).toBeVisible();
  });

  test('applies template preset and walks through the multi-step stepper', async ({ page }) => {
    // Apply Fiber preset
    const presetBtn = page.getByRole('button', { name: /Fiber Optic/i });
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
    }

    // Step 1 -> Step 2
    await page.getByRole('button', { name: /Continue to Step 2/i }).click({ force: true });
    await expect(page.getByText('Site Physical Address')).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole('button', { name: /Continue to Step 3/i }).click({ force: true });
    await expect(page.getByText('Budget Compensation Model')).toBeVisible();
    await expect(page.getByText(/Escrow Vault Guarantee/i)).toBeVisible();

    // Step 3 -> Step 4
    await page.getByRole('button', { name: /Continue to Step 4/i }).click({ force: true });
    await expect(page.getByText(/Mandatory Technician Accreditation/i)).toBeVisible();

    // Add a custom step to checklist
    const input = page.getByPlaceholder('Add step to SOW checklist...');
    await input.fill('Perform final signal attenuation test');
    await page.getByRole('button', { name: 'Add' }).click({ force: true });
    await expect(page.getByText('Perform final signal attenuation test')).toBeVisible();

    // Step 4 -> Step 5
    await page.getByRole('button', { name: /Continue to Step 5/i }).click({ force: true });
    await expect(page.getByText('WORK ORDER PREVIEW')).toBeVisible();

    // Publish Work Order
    const publishBtn = page.getByRole('button', { name: /Publish to Dispatch/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click({ force: true });

    // Verify success notification toast
    await expect(page.getByText(/published to dispatch queue/i)).toBeVisible();
  });
});
