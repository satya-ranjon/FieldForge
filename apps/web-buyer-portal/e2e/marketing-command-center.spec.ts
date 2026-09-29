import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1536, 2172]) {
  test(`command center reference composition at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/marketing#command-center');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#command-center');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText(
      'One command center for every field operation.'
    );
    const summary = section.getByRole('list', { name: 'Operations summary' });
    await expect(summary.getByRole('listitem')).toHaveCount(4);
    for (const value of ['18', '04', '09', '$42K']) {
      await expect(summary.getByText(value, { exact: true })).toBeVisible();
    }
    const map = section.getByRole('region', { name: 'New York demo operations map' });
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator('img, image')).toHaveCount(0);
    await expect(
      map.getByRole('list', { name: 'Demo technician statuses' }).getByRole('listitem')
    ).toHaveCount(4);
    const zoomIn = map.getByRole('button', { name: 'Zoom in', exact: true });
    const zoomOut = map.getByRole('button', { name: 'Zoom out', exact: true });
    const canvas = map.getByRole('group', { name: /Interactive technician map/ });
    await expect(zoomOut).toBeDisabled();
    const initial = await canvas.getAttribute('viewBox');
    await zoomIn.click();
    await expect(canvas).not.toHaveAttribute('viewBox', initial!);
    await canvas.focus();
    const zoomed = await canvas.getAttribute('viewBox');
    await canvas.press('ArrowRight');
    await expect(canvas).not.toHaveAttribute('viewBox', zoomed!);
    await map.getByRole('button', { name: 'Reset map view' }).click();
    await expect(canvas).toHaveAttribute('viewBox', initial!);
    await map.getByRole('button', { name: 'Daniel Lee, Available', exact: true }).click();
    await expect(map.getByText('Upper East Side, NY')).toBeVisible();
    await expect(
      map.getByRole('button', { name: 'Daniel Lee, Available', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    for (let step = 0; step < 3; step++) await zoomIn.click();
    await expect(zoomIn).toBeDisabled();
    await map.getByRole('button', { name: 'Reset map view' }).click();
    await expect(map.getByText('1200 Market St, NY')).toBeVisible();
    await expect(map.getByRole('link', { name: 'View All Technicians' })).toHaveAttribute(
      'href',
      '/technicians'
    );
    const alerts = section.getByRole('region', { name: 'Operational Alerts' });
    const technicians = section.getByRole('region', { name: 'Technicians Nearby' });
    const benefits = section.getByRole('list', { name: 'Command center benefits' });
    await expect(alerts.getByRole('listitem')).toHaveCount(3);
    await expect(technicians.getByRole('listitem')).toHaveCount(3);
    await expect(benefits.getByRole('listitem')).toHaveCount(4);
    for (const panel of [summary, map, alerts, technicians, benefits]) {
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
    const sidebar = section.getByRole('complementary', { name: 'Dashboard navigation preview' });
    if (width >= 1024) {
      await expect(sidebar).toBeVisible();
      const [sideBox, mapBox, alertsBox, techBox] = await Promise.all(
        [sidebar, map, alerts, technicians].map((node) => node.boundingBox())
      );
      expect(sideBox!.x + sideBox!.width).toBeLessThan(mapBox!.x);
      expect(sideBox!.y).toBeLessThan(mapBox!.y);
      expect(mapBox!.x + mapBox!.width).toBeLessThan(alertsBox!.x);
      expect(alertsBox!.y).toBeCloseTo(mapBox!.y, 0);
      expect(alertsBox!.y + alertsBox!.height).toBeLessThan(techBox!.y);
      const benefitBoxes = await benefits
        .getByRole('listitem')
        .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().y));
      expect(new Set(benefitBoxes).size).toBe(1);
    } else {
      await expect(sidebar).toBeHidden();
    }
    await section.screenshot({ path: testInfo.outputPath(`command-center-${width}.png`) });
  });
}
