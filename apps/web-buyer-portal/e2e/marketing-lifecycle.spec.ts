import { expect, test } from '@playwright/test';

const stages = ['CREATE', 'MATCH', 'DISPATCH', 'EXECUTE', 'VERIFY', 'APPROVE', 'PAY'];

for (const width of [2172, 1536, 1024, 768, 390, 320]) {
  test(`lifecycle reference layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/marketing');
    const section = page.getByRole('region', { name: 'One platform. Every step of the job.' });
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const list = section.getByRole('list', { name: 'Work order lifecycle' });
    await expect(list.getByRole('listitem')).toHaveCount(7);
    await expect(section.getByRole('definition')).toHaveText(['07', '1']);
    await expect(list.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(list.locator('[aria-current="step"]')).toContainText('DISPATCH');
    await expect(list.locator('[aria-current="step"] > div')).toHaveCSS(
      'background-color',
      'rgb(198, 248, 121)'
    );
    const boxes = [];
    for (const title of stages) {
      const heading = section.getByRole('heading', { name: title, exact: true });
      await expect(heading).toBeVisible();
      const box = (await heading.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      boxes.push(box);
    }
    const summary = (await section.locator('dl').boundingBox())!;
    const row = (await list.boundingBox())!;
    const title = (await section.getByRole('heading', { level: 2 }).boundingBox())!;
    if (width >= 1024) {
      for (const box of boxes) expect(box.y).toBeCloseTo(boxes[0]!.y, 0);
      expect(row.x).toBeGreaterThan(title.x + 200);
      expect(summary.y + summary.height).toBeLessThan(row.y);
      expect(summary.x + summary.width).toBeCloseTo(row.x + row.width, 0);
      for (let i = 0; i < boxes.length - 1; i++) {
        expect(boxes[i]!.x + boxes[i]!.width).toBeLessThan(boxes[i + 1]!.x);
      }
    } else {
      expect(boxes[6]!.y).toBeGreaterThan(boxes[0]!.y);
      expect(summary.y).toBeGreaterThan(title.y + title.height);
    }
    const bounds = (await section.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await section.screenshot({ path: testInfo.outputPath(`lifecycle-${width}.png`) });
  });
}
