import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`operations and payments composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#field-operations');
    await page.evaluate(() => document.fonts.ready);
    const operations = page.locator('#field-operations');
    const assignment = operations.getByLabel('Technician assignment preview');
    const completion = operations.getByLabel('Completed job summary preview');
    const dashboard = operations.getByLabel('Live technician dashboard preview');
    const replacements = [
      {
        name: 'Map showing technician locations, job statuses, and a network issue',
        path: 'map-field-operations-v2'
      },
      { name: 'Server racks at the job site', path: 'photo-server-rack-v2' },
      { name: 'Priya Shah', path: 'priya-shah-field-v3' }
    ];
    for (const replacement of replacements) {
      const image = dashboard.getByRole('img', { name: replacement.name, exact: true });
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('src', new RegExp(replacement.path));
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(
        0
      );
    }
    await expect(dashboard.getByText('Live', { exact: true })).toHaveCount(1);
    await expect(assignment.getByRole('listitem')).toHaveCount(5);
    await expect(completion.getByRole('listitem')).toHaveCount(3);
    await expect(
      operations.getByRole('list', { name: 'Field operation capabilities' }).getByRole('listitem')
    ).toHaveCount(5);
    await expect(
      operations.getByRole('list', { name: 'Field operations benefits' }).getByRole('listitem')
    ).toHaveCount(4);
    await expect(completion.getByRole('link', { name: 'View Report' })).toHaveAttribute(
      'href',
      '/audit'
    );
    const assignmentBounds = (await assignment.boundingBox())!;
    const completionBounds = (await completion.boundingBox())!;
    const dashboardBounds = (await dashboard.boundingBox())!;
    if (width >= 1024) {
      expect(assignmentBounds.x + assignmentBounds.width).toBeLessThan(dashboardBounds.x);
      expect(dashboardBounds.x + dashboardBounds.width).toBeLessThan(completionBounds.x);
      expect(assignmentBounds.y + assignmentBounds.height).toBeCloseTo(
        dashboardBounds.y + dashboardBounds.height,
        0
      );
    }
    for (const locator of [assignment, completion, dashboard]) {
      const bounds = (await locator.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await locator.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
    await operations.screenshot({ path: testInfo.outputPath(`operations-${width}.png`) });
    const payments = page.locator('#secure-payments');
    await payments.scrollIntoViewIfNeeded();
    const steps = payments.getByRole('list', { name: 'Payment workflow' });
    const benefits = payments.getByRole('list', { name: 'Payment benefits' });
    await expect(steps.getByRole('listitem')).toHaveCount(4);
    await expect(benefits.getByRole('listitem')).toHaveCount(3);
    await expect(steps.getByRole('listitem').filter({ hasText: 'You Get Paid' })).toHaveCSS(
      'background-color',
      'rgb(198, 248, 121)'
    );
    if (width >= 1024) {
      const title = (await payments.getByRole('heading', { level: 2 }).boundingBox())!;
      const row = (await steps.boundingBox())!;
      expect(row.x).toBeGreaterThan(title.x + title.width);
      const boxes = await Promise.all(
        (await benefits.getByRole('listitem').all()).map((item) => item.boundingBox())
      );
      for (const box of boxes) expect(box!.y).toBeCloseTo(boxes[0]!.y, 0);
    }
    expect(await payments.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await payments.screenshot({ path: testInfo.outputPath(`payments-${width}.png`) });
  });
}
