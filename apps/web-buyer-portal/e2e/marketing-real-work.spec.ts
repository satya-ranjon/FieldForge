import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`real work reference layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#real-work');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#real-work');
    const title = section.getByRole('heading', { level: 2 });
    await expect(title).toBeVisible();
    const jobs = section.getByLabel('Example active jobs');
    await expect(jobs.getByRole('listitem')).toHaveCount(4);
    for (const name of ['Faster resolution', 'Full visibility', 'Trusted & compliant']) {
      await expect(section.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    const photo = section.getByRole('img', {
      name: 'FieldForge technician using a tablet at a customer site'
    });
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveAttribute('src', /real-work-technician-v2/);
    await expect(section.getByText(/Technician\s*dispatched/)).toBeVisible();
    const services = section.getByRole('list', { name: 'Industries served' });
    await expect(services.getByRole('listitem')).toHaveCount(6);
    for (const label of [
      'Security',
      'Networking',
      'POS Systems',
      'Cabling',
      'IT Hardware',
      'AV & Digital Signage'
    ]) {
      await expect(services.getByText(label, { exact: true })).toBeVisible();
    }
    for (const image of await services.getByRole('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('src', /real-work-.*-v2/);
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(
        0
      );
    }
    await expect(section.getByRole('img')).toHaveCount(7);
    await expect(photo).toHaveJSProperty('complete', true);
    expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const bounds = (await section.boundingBox())!;
    const heading = (await title.boundingBox())!;
    const jobBounds = (await jobs.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(jobBounds.x).toBeGreaterThanOrEqual(bounds.x);
    expect(jobBounds.x + jobBounds.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    expect(jobBounds.y + jobBounds.height).toBeLessThanOrEqual(bounds.y + bounds.height);
    if (width >= 1024) {
      expect(jobBounds.x).toBeGreaterThanOrEqual(heading.x + heading.width);
      expect(bounds.width / bounds.height).toBeGreaterThan(2.5);
      const serviceBounds = (await services.boundingBox())!;
      expect(serviceBounds.x).toBeGreaterThan(jobBounds.x + jobBounds.width);
      expect(serviceBounds.y + serviceBounds.height).toBeLessThanOrEqual(bounds.y + bounds.height);
      const tiles = await services.getByRole('listitem').evaluateAll((items) =>
        items.map((item) => ({
          x: item.getBoundingClientRect().x,
          y: item.getBoundingClientRect().y
        }))
      );
      for (let index = 0; index < tiles.length; index += 2) {
        expect(tiles[index].y).toBeCloseTo(tiles[index + 1].y, 0);
        expect(tiles[index].x).toBeLessThan(tiles[index + 1].x);
      }
      const lifecycle = (await page.locator('#lifecycle').boundingBox())!;
      expect(bounds.y - lifecycle.y - lifecycle.height).toBeLessThanOrEqual(2);
    } else {
      expect(jobBounds.y).toBeGreaterThan(heading.y + heading.height);
    }
    for (const row of await jobs.getByRole('listitem').all()) {
      expect(await row.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true
      );
    }
    await section.screenshot({ path: testInfo.outputPath(`real-work-${width}.png`) });
  });
}
