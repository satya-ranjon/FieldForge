import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`compliance reference composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#compliance-trust');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#compliance-trust');
    const profile = section.getByRole('article', {
      name: 'Marcus Lee verified technician profile'
    });
    const title = section.getByRole('heading', { level: 2 });
    await expect(title).toHaveText('Send people you can trust.');
    await expect(
      profile.getByRole('list', { name: 'Verified credentials' }).getByRole('listitem')
    ).toHaveCount(5);
    const portrait = profile.getByRole('img', { name: 'Marcus Lee', exact: true });
    await portrait.scrollIntoViewIfNeeded();
    await expect(portrait).toHaveJSProperty('complete', true);
    expect(await portrait.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(portrait).toHaveAttribute('src', /marcus-lee-v2/);
    await expect(profile.getByRole('link', { name: 'Invite to job' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    const verification = section.getByRole('region', { name: 'Verification & Compliance' });
    const credentials = section.getByRole('region', { name: 'Credentials & Experience' });
    const reliability = section.getByRole('region', { name: 'Job Fit & Reliability' });
    await expect(verification.getByRole('listitem')).toHaveCount(5);
    await expect(reliability.getByRole('listitem')).toHaveCount(4);
    await expect(credentials.getByRole('heading', { name: 'Work History' })).toBeVisible();
    const boxes = await Promise.all(
      [profile, verification, credentials, reliability].map((item) => item.boundingBox())
    );
    for (const box of boxes) {
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    if (width >= 1024) {
      const titleBounds = (await title.boundingBox())!;
      expect(boxes[0]!.x + boxes[0]!.width).toBeLessThan(titleBounds.x);
      expect(titleBounds.y + titleBounds.height).toBeLessThan(boxes[1]!.y);
      for (const box of boxes.slice(1)) expect(box!.y).toBeCloseTo(boxes[1]!.y, 0);
      expect(boxes[1]!.x + boxes[1]!.width).toBeLessThan(boxes[2]!.x);
      expect(boxes[2]!.x + boxes[2]!.width).toBeLessThan(boxes[3]!.x);
    }
    for (const panel of [profile, verification, credentials, reliability]) {
      expect(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
    await section.screenshot({ path: testInfo.outputPath(`compliance-${width}.png`) });
  });
}
