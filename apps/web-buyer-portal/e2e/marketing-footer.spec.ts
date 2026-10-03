import { expect, test } from '@playwright/test';

for (const route of ['marketing', 'platform', 'solutions', 'industries', 'resources', 'pricing']) {
  for (const width of [320, 390, 768, 1024, 1536, 2172]) {
    test(`${route} shared marketing footer at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${route}#marketing-footer`);
      await expect(page.locator('footer')).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      const footer = page.locator('#marketing-footer');
      await footer.scrollIntoViewIfNeeded();
      for (const title of ['Product', 'Resources', 'Company', 'Legal', 'Stay Updated']) {
        await expect(footer.getByRole('heading', { name: title, exact: true })).toBeVisible();
      }
      for (const name of ['LinkedIn', 'Twitter / X', 'Instagram', 'YouTube', 'Facebook']) {
        await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute(
          'target',
          '_blank'
        );
      }
      await expect(footer.getByRole('link', { name: 'FieldForge home' })).toHaveAttribute(
        'href',
        '/marketing'
      );
      await expect(
        footer.getByRole('navigation', { name: 'Footer Product' }).getByRole('link')
      ).toHaveCount(5);
      await expect(
        footer.getByRole('navigation', { name: 'Footer Resources' }).getByRole('link')
      ).toHaveCount(5);
      await expect(footer.getByRole('button', { name: 'App Store — coming soon' })).toBeDisabled();
      await expect(
        footer.getByRole('button', { name: 'Google Play — coming soon' })
      ).toBeDisabled();
      await expect(footer.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
      const form = footer.getByRole('form', { name: 'Newsletter subscription' });
      const email = form.getByRole('textbox', { name: 'Email address' });
      await email.fill('invalid-email');
      await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
      expect(await email.evaluate((node: HTMLInputElement) => node.validity.typeMismatch)).toBe(
        true
      );
      await expect(footer.getByRole('status')).toHaveCount(0);
      await email.fill('preview@example.com');
      await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
      await expect(footer.getByRole('status')).toHaveText(
        'Newsletter subscriptions are not available yet. Please check back soon.'
      );
      expect(await footer.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      for (const node of [form, footer.getByRole('navigation', { name: 'Footer Company' })]) {
        const bounds = (await node.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
      if (width >= 1024) {
        const headings = await Promise.all(
          ['Product', 'Resources', 'Company', 'Legal', 'Stay Updated'].map((name) =>
            footer.getByRole('heading', { name, exact: true }).boundingBox()
          )
        );
        for (const heading of headings) expect(heading!.y).toBeCloseTo(headings[0]!.y, 0);
        for (let index = 1; index < headings.length; index++)
          expect(headings[index]!.x).toBeGreaterThan(headings[index - 1]!.x);
      }
      await footer.screenshot({ path: testInfo.outputPath(`${route}-footer-${width}.png`) });
    });
  }
}
