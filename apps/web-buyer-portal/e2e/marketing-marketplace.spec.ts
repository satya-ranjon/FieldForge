import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`marketplace reference composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#technician-marketplace');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#technician-marketplace');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText(
      'The righttechnician forevery job.'
    );
    await expect(section.getByRole('article')).toHaveCount(4);
    const marcus = section.getByRole('article', { name: 'Marcus Lee' });
    await expect(marcus).toContainText('126 reviews');
    await expect(marcus.getByRole('link', { name: 'View profile' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    await expect(section.getByRole('link', { name: 'Explore Technician Network' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    const filters = section.getByRole('navigation', { name: 'Browse technician network' });
    await expect(filters.getByRole('link')).toHaveCount(5);
    const filterBounds = (await filters.boundingBox())!;
    for (const card of await section.getByRole('article').all()) {
      const bounds = (await card.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y + bounds.height).toBeLessThan(filterBounds.y);
      expect(await card.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
    if (width >= 1024) {
      const center = (await marcus.boundingBox())!;
      const left = (await section.getByRole('article', { name: 'Priya Shah' }).boundingBox())!;
      const upper = (await section.getByRole('article', { name: 'Daniel Carter' }).boundingBox())!;
      const lower = (await section.getByRole('article', { name: 'Alex Rivera' }).boundingBox())!;
      expect(left.x + left.width).toBeLessThan(center.x);
      expect(center.x + center.width).toBeLessThan(upper.x);
      expect(upper.y + upper.height).toBeLessThan(lower.y);
      expect(center.width).toBeGreaterThan(upper.width);
    }
    for (const img of await section.locator('img').all()) {
      await expect(img).toHaveJSProperty('complete', true);
      expect(await img.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
    }
    await section.screenshot({ path: testInfo.outputPath(`marketplace-${width}.png`) });
  });
}
