import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1368, 1920]) {
  test(`platform reference and interactions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/platform');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Platform | FieldForge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'One platform for connected field operations.'
    );
    for (const title of [
      'Technician Marketplace',
      'Smart Dispatch',
      'Live Tracking',
      'Proof & Verification',
      'Payments'
    ]) {
      await expect(
        page.locator('#capabilities').getByRole('heading', { name: title, exact: true })
      ).toBeVisible();
    }
    const preview = page.getByLabel('Platform desktop and mobile preview', { exact: true });
    await expect(preview).toBeVisible();
    const table = page.getByRole('table');
    await expect(table.getByRole('row')).toHaveCount(6);
    await page.getByLabel('Search sample work orders').fill('  marcus  ');
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByText('WO-2847')).toBeVisible();
    await page.getByLabel('Search sample work orders').fill('does-not-exist');
    await expect(
      page.getByRole('status').filter({ hasText: 'No sample work orders match your search.' })
    ).toBeVisible();
    await page.getByLabel('Search sample work orders').fill('');
    await page.getByLabel('Filter sample work orders').selectOption('Scheduled');
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Scheduled (2)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: 'All (5)' }).click();
    await expect(table.getByRole('row')).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'New Work Order', exact: true })).toHaveAttribute(
      'href',
      '/create-wo'
    );
    for (const link of await page
      .getByRole('link', { name: 'View command center', exact: true })
      .all()) {
      await expect(link).toHaveAttribute('href', '/operations');
    }
    await page
      .locator('#marketing-footer')
      .getByLabel('Email address', { exact: true })
      .fill('design-review@example.com');
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Newsletter subscriptions are not available yet.' })
    ).toBeVisible();
    if (width < 900) {
      const menu = page.getByRole('button', { name: 'Toggle navigation menu' });
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(
        page
          .getByRole('navigation', { name: 'Mobile navigation' })
          .getByRole('link', { name: 'Platform', exact: true })
      ).toHaveAttribute('aria-current', 'page');
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    } else {
      await expect(
        page
          .getByRole('navigation', { name: 'Primary navigation' })
          .getByRole('link', { name: 'Platform', exact: true })
      ).toHaveAttribute('aria-current', 'page');
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(
        0
      );
    }
    await page.screenshot({ path: testInfo.outputPath(`platform-${width}.png`), fullPage: true });
  });
}
