import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1280, 1920]) {
  test(`industries reference and navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/industries');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Industries | FieldForge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Built for the industries that keep the world running.'
    );
    await expect(page.locator('#industries article')).toHaveCount(8);
    for (const name of [
      'Retail & POS',
      'Restaurants & Cafés',
      'Hospitality',
      'Offices & Corporate',
      'Warehouses & Logistics',
      'Healthcare & Clinics',
      'Facilities & Property Management',
      'Multi-location Chains'
    ]) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: `Learn more about ${name}` })).toHaveAttribute(
        'href',
        /\/solutions#(marketplace|dispatch|proof-payments)/
      );
    }
    const cta = page.getByRole('region', { name: 'Find the right technicians for your industry.' });
    await cta.getByRole('button', { name: 'Get started', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Organization Identity' })).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await cta.getByRole('button', { name: 'Talk to sales', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Talk to sales' })).toContainText(
      'Sales booking is not available yet.'
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Talk to sales' })).not.toBeVisible();
    if (width < 900) {
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
      await expect(
        page
          .getByRole('navigation', { name: 'Mobile navigation' })
          .getByRole('link', { name: 'Industries', exact: true })
      ).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    } else {
      await expect(
        page
          .getByRole('navigation', { name: 'Primary navigation' })
          .getByRole('link', { name: 'Industries', exact: true })
      ).toHaveAttribute('aria-current', 'page');
    }
    await page
      .locator('#marketing-footer')
      .getByLabel('Email address', { exact: true })
      .fill('preview@example.com');
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Newsletter subscriptions are not available yet.' })
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(
        0
      );
    }
    await page.screenshot({ path: testInfo.outputPath(`industries-${width}.png`), fullPage: true });
  });
}
