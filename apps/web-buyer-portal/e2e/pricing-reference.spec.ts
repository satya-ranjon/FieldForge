import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1153, 1920]) {
  test(`pricing reference and interactions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/pricing');
    await expect(page).toHaveTitle('Pricing | FieldForge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Simple, transparent pricing that works for everyone'
    );
    await expect(page.getByTestId('platform-fee')).toHaveText('$12');
    await expect(page.getByTestId('technician-earnings')).toHaveText('$100');
    await expect(page.getByTestId('customer-total')).toHaveText('$112');
    await page.getByLabel('Example job amount in dollars').fill('250.50');
    await expect(page.getByTestId('platform-fee')).toHaveText('$30.06');
    await expect(page.getByTestId('technician-earnings')).toHaveText('$250.50');
    await expect(page.getByTestId('customer-total')).toHaveText('$280.56');
    await page.getByLabel('Example job amount in dollars').fill('-1');
    await expect(page.getByLabel('Example job amount in dollars')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(page.getByTestId('customer-total')).toHaveText('—');
    await expect(page.locator('#pricing-example-error')).toContainText('Enter an amount');
    const faq = page.getByRole('button', { name: 'When do I pay the 12% fee?' });
    await expect(faq).toHaveAttribute('aria-expanded', 'true');
    await faq.click();
    await expect(page.locator('#pricing-answer-0')).toBeHidden();
    await faq.click();
    await expect(page.locator('#pricing-answer-0')).toBeVisible();
    await page.getByRole('button', { name: 'Join as a Technician' }).first().click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Technician', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Enterprise Buyer', exact: true })
    ).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Contact us', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Pricing questions' })).toContainText(
      'not configured yet'
    );
    await page.getByRole('button', { name: 'Close pricing contact' }).click();
    await page.getByLabel('Newsletter email address').fill('preview@example.com');
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Newsletter subscriptions are not available yet.' })
    ).toBeVisible();
    if (width < 1024) await page.getByRole('button', { name: 'Toggle navigation' }).click();
    const nav = page.getByRole('navigation', {
      name: width < 1024 ? 'Mobile navigation' : 'Primary navigation'
    });
    await expect(nav.getByRole('link', { name: 'Pricing', exact: true })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await page.goto('/pricing');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(
        0
      );
    }
    await page.screenshot({ path: testInfo.outputPath(`pricing-${width}.png`), fullPage: true });
  });
}
