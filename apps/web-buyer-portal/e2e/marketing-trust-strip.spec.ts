import { expect, test } from '@playwright/test';

const labels = [
  'Verified Professionals',
  'GPS Verified Arrival',
  'Protected Payments',
  'Compliance Ready',
  'Real-Time Operations'
];

for (const width of [2560, 2172, 1612, 1440, 1280, 1024, 1023, 768, 390]) {
  test(`platform assurances match the reference layout at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing');
    const strip = page.getByRole('region', { name: 'Platform assurances' });
    await strip.scrollIntoViewIfNeeded();
    await expect(strip.getByRole('listitem')).toHaveCount(5);
    await expect(page.getByText('Create & Post Work', { exact: true })).toHaveCount(0);
    await expect(page.getByText('How It Works', { exact: true })).toHaveCount(0);
    const boxes = [];
    for (const label of labels) {
      const heading = strip.getByRole('heading', { name: label });
      await expect(heading).toBeVisible();
      const box = (await heading.boundingBox())!;
      boxes.push(box);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    if (width >= 1024) {
      const heroFrame = await page
        .locator('section[aria-labelledby="marketing-hero-title"] > div')
        .boundingBox();
      const list = (await strip.getByRole('list').boundingBox())!;
      expect(list.x).toBeCloseTo(heroFrame!.x, 0);
      expect(list.width).toBeCloseTo(heroFrame!.width, 0);
      const firstIcon = (await strip.locator('li > span').first().boundingBox())!;
      expect(firstIcon.x).toBeCloseTo(list.x, 0);
      expect(boxes[4]!.x + boxes[4]!.width).toBeCloseTo(list.x + list.width, 0);
      for (const box of boxes) expect(box.y).toBeCloseTo(boxes[0]!.y, 0);
      for (let i = 0; i < boxes.length - 1; i++) {
        expect(boxes[i]!.x + boxes[i]!.width).toBeLessThan(boxes[i + 1]!.x);
      }
      const clearances = await strip.locator('li:not(:last-child)').evaluateAll((items) =>
        items.map((item) => {
          const divider = getComputedStyle(item, '::after');
          const dividerX = item.getBoundingClientRect().right - parseFloat(divider.right);
          return dividerX - item.querySelector('h2')!.getBoundingClientRect().right;
        })
      );
      for (const clearance of clearances) expect(clearance).toBeGreaterThan(8);
    } else {
      expect(boxes[4]!.y).toBeGreaterThan(boxes[0]!.y);
    }
    await expect
      .poll(() =>
        strip
          .locator('img')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0)
          )
      )
      .toBe(true);
    const tones = await strip
      .locator('li > span')
      .evaluateAll((icons) => icons.map((icon) => getComputedStyle(icon).backgroundColor));
    expect(tones[0]).toBe(tones[2]);
    expect(tones[2]).toBe(tones[4]);
    expect(tones[1]).toBe(tones[3]);
    expect(tones[0]).not.toBe(tones[1]);
    await strip.screenshot({ path: testInfo.outputPath(`trust-strip-${width}.png`) });
    if (width === 1612) {
      await page.screenshot({ path: testInfo.outputPath('trust-strip-in-context.png') });
    }
  });
}
