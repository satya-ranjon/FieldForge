import { test, expect } from '@playwright/test';

test.describe('SOW Builder & Work Order Publishing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to SOW Studio
    await page.getByRole('button', { name: /SOW Studio/i }).click();
    await expect(page.getByText('Enterprise SOW Template Presets')).toBeVisible();
  });

  test('applies template preset and walks through the multi-step stepper', async ({ page }) => {
    // Apply Fiber preset
    const presetCard = page.getByText('Fiber Optic Splice & SFP+ Replacement');
    if (await presetCard.isVisible()) {
      await presetCard.click();
    }

    // Step 1: Add step to SOP checklist
    const input = page.getByPlaceholder('Add an SOP step...');
    await input.fill('Perform final signal attenuation test');
    await page.getByRole('button', { name: 'Add' }).click({ force: true });
    await expect(page.getByText('Perform final signal attenuation test')).toBeVisible();

    // Step 1 -> Step 2
    await page.getByRole('button', { name: 'Continue' }).click({ force: true });
    await expect(page.getByText('Site Street Address')).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole('button', { name: 'Continue' }).click({ force: true });
    await expect(page.getByText('Budget Billing Model')).toBeVisible();

    // Step 3 -> Step 4
    await page.getByRole('button', { name: 'Continue' }).click({ force: true });
    await expect(page.getByText(/Mandatory Proof-of-Work Deliverables/i)).toBeVisible();

    // Publish Work Order
    const publishBtn = page.getByRole('button', { name: /Publish & Lock Escrow/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click({ force: true });

    // Verify success notification toast
    await expect(page.getByText(/published to dispatch queue/i)).toBeVisible();
  });
});
