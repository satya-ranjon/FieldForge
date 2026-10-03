import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1228, 1920]) {
  test(`solutions reference and interactions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/solutions');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Solutions | FieldForge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Solutions built for connected field operations.'
    );
    await expect(page.locator('#our-solutions h3')).toHaveCount(6);
    await expect(page.getByLabel('Solutions laptop preview', { exact: true })).toBeVisible();
    const marketplace = page.getByLabel('Technician marketplace preview', { exact: true });
    await expect(marketplace.getByRole('link', { name: /^Invite / })).toHaveCount(3);
    await page.getByLabel('Search sample technicians').fill('networking');
    await expect(marketplace.getByRole('link', { name: /^Invite / })).toHaveCount(1);
    await expect(marketplace.getByRole('link', { name: 'Invite Priya Shah' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    await page.getByLabel('Search sample technicians').fill('no-such-technician');
    await expect(marketplace.getByRole('status')).toHaveText(
      'No sample technicians match your search.'
    );
    await page.getByLabel('Search sample technicians').fill('');
    const dispatch = page.getByLabel('Dispatch preview', { exact: true });
    await dispatch.getByRole('button', { name: /Unassigned\s*3/ }).click();
    await expect(dispatch.getByRole('button', { name: /WO-/ })).toHaveCount(3);
    await dispatch.getByRole('button', { name: /WO-2849/ }).click();
    await expect(page.getByLabel('Sample job details')).toContainText('Security Camera Setup');
    await dispatch.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.getByLabel('Sample job details')).toContainText('Store Repair');
    await page.getByRole('button', { name: 'Talk to sales', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Talk to sales' });
    await expect(dialog).toContainText('Sales booking is not available yet.');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await page.getByLabel('Your email address').fill('preview@example.com');
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Newsletter subscriptions are not available yet.' })
    ).toBeVisible();
    if (width < 1024) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await expect(
        page
          .getByRole('navigation', { name: 'Mobile navigation' })
          .getByRole('link', { name: 'Solutions', exact: true })
      ).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
    } else {
      await expect(
        page
          .getByRole('navigation', { name: 'Primary navigation' })
          .getByRole('link', { name: 'Solutions', exact: true })
      ).toHaveAttribute('aria-current', 'page');
    }
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
    await page.screenshot({ path: testInfo.outputPath(`solutions-${width}.png`), fullPage: true });
  });
}
