import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`smart dispatch reference layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#smart-dispatch');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#smart-dispatch');
    await expect(section.getByRole('heading', { level: 2 })).toContainText('Dispatch faster.');
    const panel = section.locator('[aria-labelledby="dispatch-candidates-title"]');
    await expect(panel.getByRole('listitem')).toHaveCount(3);
    await expect(panel.getByText('BEST MATCH', { exact: true })).toHaveCount(1);
    const best = panel.getByRole('listitem').filter({ hasText: 'Alex Morgan' });
    await expect(best).toHaveCSS('background-color', 'rgb(198, 248, 121)');
    const features = section.getByRole('list', { name: 'Smart dispatch features' });
    await expect(features.getByRole('listitem')).toHaveCount(4);
    const pills = await features.getByRole('listitem').all();
    const first = (await pills[0]!.boundingBox())!;
    const second = (await pills[1]!.boundingBox())!;
    const third = (await pills[2]!.boundingBox())!;
    expect(first.y).toBeCloseTo(second.y, 0);
    expect(third.y).toBeGreaterThan(first.y);
    const map = section.getByRole('img', { name: /San Francisco dispatch map/ });
    await map.scrollIntoViewIfNeeded();
    await expect(map).toHaveJSProperty('complete', true);
    expect(await map.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const mapBounds = (await map.boundingBox())!;
    const panelBounds = (await panel.boundingBox())!;
    const featureBounds = (await features.boundingBox())!;
    expect(featureBounds.y).toBeGreaterThan(panelBounds.y + panelBounds.height);
    if (width >= 1024) {
      expect(mapBounds.x + mapBounds.width).toBeLessThan(panelBounds.x);
      expect(mapBounds.y).toBeCloseTo(panelBounds.y, 0);
      expect(featureBounds.x).toBeCloseTo(panelBounds.x, 0);
      expect(featureBounds.width).toBeCloseTo(panelBounds.width, 0);
    } else {
      expect(panelBounds.y).toBeGreaterThan(mapBounds.y + mapBounds.height);
    }
    for (const item of [...(await panel.getByRole('listitem').all()), ...pills]) {
      const bounds = (await item.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await item.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
    await section.screenshot({ path: testInfo.outputPath(`smart-dispatch-${width}.png`) });
  });
}
