import { expect, test } from '@playwright/test';

for (const route of ['marketing', 'platform', 'solutions', 'industries', 'resources', 'pricing']) {
  for (const width of [390, 768, 899, 900, 1199, 1200, 1440, 1499, 1500, 1708, 1920]) {
    test(`${route} shared navbar at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${route}`);
      const header = page.getByRole('banner');
      await expect(header).toHaveCount(1);
      await expect(header.getByRole('link', { name: 'FieldForge home' })).toHaveAttribute(
        'href',
        '/'
      );
      const menu = header.getByRole('button', { name: 'Toggle navigation menu' });
      if (width < 900) {
        await expect(menu).toBeVisible();
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
      } else {
        await expect(menu).toBeHidden();
      }
      const navigation = header.getByRole('navigation', {
        name: width < 900 ? 'Mobile navigation' : 'Primary navigation'
      });
      for (const destination of ['platform', 'solutions', 'industries', 'resources', 'pricing']) {
        const link = navigation.locator(`a[href="/${destination}"]`);
        await expect(link).toBeVisible();
        if (destination === route) await expect(link).toHaveAttribute('aria-current', 'page');
        else await expect(link).not.toHaveAttribute('aria-current');
      }
      await expect(
        header
          .getByRole('link', { name: 'Join as Technician', exact: true })
          .filter({ visible: true })
      ).toHaveAttribute('href', '/technicians');
      await header
        .getByRole('button', { name: 'Log in', exact: true })
        .filter({ visible: true })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      if (width < 900) {
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
        await menu.click();
        await header
          .getByRole('navigation', { name: 'Mobile navigation' })
          .getByRole('link', { name: 'Platform', exact: true })
          .click();
        await expect(page).toHaveURL(/\/platform$/);
        await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
      } else {
        await header.getByRole('button', { name: 'Search', exact: true }).click();
        await expect(page).toHaveURL(/\/technicians$/);
      }
      await page.goto(`/${route}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await header.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      const navBounds = (await header.locator(':scope > div').first().boundingBox())!;
      const frame = page
        .locator(
          route === 'pricing' ? 'main > section:first-child' : 'main > section:first-child > div'
        )
        .first();
      const frameBounds = (await frame.boundingBox())!;
      expect(Math.abs(frameBounds.x - navBounds.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(frameBounds.width - navBounds.width)).toBeLessThanOrEqual(1);
      if (route === 'platform') {
        const cards = page.locator('#capabilities > div');
        const cardsBounds = (await cards.boundingBox())!;
        expect(Math.abs(cardsBounds.x - navBounds.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(cardsBounds.width - navBounds.width)).toBeLessThanOrEqual(1);
        const preview = page.getByLabel('Platform desktop and mobile preview', { exact: true });
        for (const part of await preview.locator(':scope > div').all()) {
          const bounds = (await part.boundingBox())!;
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(navBounds.x + navBounds.width + 1);
        }
      }
      await header.screenshot({ path: testInfo.outputPath(`${route}-navbar-${width}.png`) });
    });
  }
}
