import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`reliability and closing banner composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/marketing#enterprise-reliability');
    await page.evaluate(() => document.fonts.ready);
    const reliability = page.locator('#enterprise-reliability');
    const banner = page.locator('#fieldwork-cta');
    const features = reliability.getByRole('list', { name: 'Enterprise reliability features' });
    await expect(features.getByRole('listitem')).toHaveCount(4);
    await expect(reliability.getByRole('heading', { level: 2 })).toHaveText(
      'Built for operations that cannot lose track of work.'
    );
    await expect(banner.getByRole('heading', { level: 2 })).toHaveText(
      'Your next field job should not take hours to staff.'
    );
    await expect(
      banner.getByRole('link', { name: 'Find Technicians', exact: true })
    ).toHaveAttribute('href', '/create-wo');
    await expect(banner.getByRole('link', { name: 'Book a Demo' })).toHaveAttribute(
      'href',
      '/resources'
    );
    await expect(banner.getByRole('link', { name: 'Assign Technician' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    await expect(
      banner.getByRole('list', { name: 'Dispatch summary' }).getByRole('listitem')
    ).toHaveCount(4);
    await expect(
      banner.getByRole('list', { name: 'Fieldwork benefits' }).getByRole('listitem')
    ).toHaveCount(3);
    await banner.scrollIntoViewIfNeeded();
    for (const image of await banner.locator('img').all()) {
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
    const dashboard = banner.getByLabel('Dispatch command center preview', { exact: true });
    for (const panel of [reliability, banner, dashboard]) {
      const bounds = (await panel.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
    if (width >= 1024) {
      const featureTops = await features
        .getByRole('listitem')
        .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().y));
      expect(new Set(featureTops).size).toBe(1);
      const [reliabilityBox, bannerBox, titleBox, dashboardBox] = await Promise.all(
        [reliability, banner, banner.getByRole('heading', { level: 2 }), dashboard].map((node) =>
          node.boundingBox()
        )
      );
      expect(bannerBox!.y - reliabilityBox!.y - reliabilityBox!.height).toBeLessThan(40);
      expect(titleBox!.x + titleBox!.width).toBeLessThan(dashboardBox!.x);
      expect(dashboardBox!.width / bannerBox!.width).toBeGreaterThan(0.5);
    }
    await reliability
      .locator('..')
      .screenshot({ path: testInfo.outputPath(`reliability-cta-${width}.png`) });
  });
}
