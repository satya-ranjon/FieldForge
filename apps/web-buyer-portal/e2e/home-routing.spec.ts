import { expect, test } from '@playwright/test';

test('opens the marketing page at the root and keeps the existing marketing URL', async ({
  page
}) => {
  for (const route of ['/', '/marketing']) {
    await page.goto(route);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Field service without the field-service chaos.'
      })
    ).toBeVisible();
    if (await page.getByRole('button', { name: 'Toggle navigation menu' }).isVisible()) {
      await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'FieldForge home' }).first()).toHaveAttribute(
      'href',
      '/'
    );
    await expect(page.getByRole('button', { name: 'Live Operations' })).toHaveCount(0);
  }
});

test('keeps the buyer dashboard on its own route and links back to the public home', async ({
  page
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'View All' }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('button', { name: /Live Operations/i })).toBeVisible();
  await expect(page.getByText('Active Work Orders')).toBeVisible();
  const publicWebsiteLink = page.getByRole('link', { name: 'Public Website' });
  if (await publicWebsiteLink.isVisible()) {
    await publicWebsiteLink.click();
  } else {
    await page.getByRole('link', { name: 'FieldForge home' }).click();
  }
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Field service without the field-service chaos.' })
  ).toBeVisible();
});
