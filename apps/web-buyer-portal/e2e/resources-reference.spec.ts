import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1153, 1920]) {
  test(`resources design and library interactions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/resources');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Resources | FieldForge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Field knowledge for real operations.'
    );
    await expect(page.locator('#featured-resources article')).toHaveCount(3);
    await expect(page.locator('#resource-library article')).toHaveCount(4);
    await page
      .getByRole('button', { name: 'Read the guide: How to reduce technician response time' })
      .click();
    await expect(page.getByRole('dialog')).toContainText(
      'Choose for readiness, not distance alone'
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByRole('button', { name: /Read the case study:/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Illustrative case study.');
    await page.getByRole('button', { name: 'Close resource' }).click();
    const downloadEvent = page.waitForEvent('download');
    await page
      .getByRole('link', { name: 'Download Field operations reporting workbook CSV' })
      .click();
    expect((await downloadEvent).suggestedFilename()).toBe('field-operations-reporting.csv');
    await page.getByLabel('Search resources', { exact: true }).fill('  technician response  ');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('#resource-library article')).toHaveCount(1);
    await expect(page.locator('#resource-library')).toContainText(
      'How to reduce technician response time'
    );
    await page.getByLabel('Search resources', { exact: true }).fill('no-such-resource');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No resources found' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.locator('#resource-library article')).toHaveCount(8);
    await page
      .getByRole('group', { name: 'Resource types' })
      .getByRole('button', { name: 'Templates', exact: true })
      .click();
    await expect(page.locator('#resource-library article')).toHaveCount(2);
    await page.getByRole('button', { name: 'Technician Success', exact: true }).click();
    await expect(page.locator('#resource-library article')).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: 'Technician Success', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Newsletter email address').fill('preview@example.com');
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
          .getByRole('link', { name: 'Resources', exact: true })
      ).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
    } else {
      await expect(
        page
          .getByRole('navigation', { name: 'Primary navigation' })
          .getByRole('link', { name: 'Resources', exact: true })
      ).toHaveAttribute('aria-current', 'page');
    }
    await page
      .getByRole('group', { name: 'Resource types' })
      .getByRole('button', { name: 'All', exact: true })
      .click();
    await page.goto('/resources');
    await page.evaluate(() => document.fonts.ready);
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
    await page.screenshot({ path: testInfo.outputPath(`resources-${width}.png`), fullPage: true });
  });
}
