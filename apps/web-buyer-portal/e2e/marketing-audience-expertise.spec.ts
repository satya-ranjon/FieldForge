import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`audience and expertise reference composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#audience-pathways');
    await page.evaluate(() => document.fonts.ready);
    const audience = page.locator('#audience-pathways');
    const expertise = page.locator('#expertise');
    const business = audience.getByRole('article', { name: 'For Businesses' });
    const technician = audience.getByRole('article', { name: 'For Technicians' });
    for (const card of [business, technician]) {
      await expect(card.getByRole('listitem')).toHaveCount(4);
      const bounds = (await card.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await card.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      if (width >= 1024) {
        const title = (await card.getByRole('heading', { level: 2 }).boundingBox())!;
        const steps = (await card.getByRole('list').boundingBox())!;
        expect(title.x + title.width).toBeLessThan(steps.x);
      }
    }
    await expect(business.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/create-wo'
    );
    await expect(technician.getByRole('link', { name: 'Join as a Technician' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    const cards = expertise.getByRole('link');
    await expect(cards).toHaveCount(7);
    for (const category of [
      'IT INFRASTRUCTURE',
      'CABLING & INFRASTRUCTURE',
      'RETAIL & HOSPITALITY',
      'SECURITY',
      'COMPUTER HARDWARE',
      'AUDIO VISUAL',
      'ENTERPRISE'
    ]) {
      await expect(expertise.getByText(category, { exact: true })).toBeVisible();
    }
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute('href', '/solutions');
      const image = card.getByRole('img');
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('src', /service-.*-v2/);
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      const bounds = (await card.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    if (width >= 1024) {
      const businessBox = (await business.boundingBox())!;
      const technicianBox = (await technician.boundingBox())!;
      expect(businessBox.y).toBeCloseTo(technicianBox.y, 0);
      const cardTops = await cards.evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect().top)
      );
      expect(new Set(cardTops.slice(0, 3)).size).toBe(1);
      expect(new Set(cardTops.slice(3)).size).toBe(1);
      expect(cardTops[3]).toBeGreaterThan(cardTops[0]);
      const titleBox = (await expertise.getByRole('heading', { level: 2 }).boundingBox())!;
      expect(titleBox.y - (businessBox.y + businessBox.height)).toBeLessThan(80);
    }
    await audience
      .locator('..')
      .screenshot({ path: testInfo.outputPath(`audience-expertise-${width}.png`) });
  });
}
