import { test, expect } from '@playwright/test';

test.use({ video: 'off', trace: 'off' });

for (const viewport of [
  { width: 1536, height: 1024 },
  { width: 988, height: 659 },
  { width: 1440, height: 960 },
  { width: 2020, height: 1350 },
  { width: 2560, height: 1440 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 740 }
]) {
  test(`marketing hero remains complete at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/marketing');
    const hero = page.getByRole('region', {
      name: 'Field service without the field-service chaos.'
    });
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
    const photo = hero
      .getByRole('img', {
        name: 'FieldForge technician using a tablet beside a service van'
      })
      .filter({ visible: true });
    await expect(photo).toBeVisible();
    await expect(hero.locator('img')).toHaveCount(7);
    await expect
      .poll(() =>
        hero
          .locator('img')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0)
          )
      )
      .toBe(true);
    await expect(photo).toHaveAttribute('src', '/marketing/hero-technician-refined.png');
    await expect(hero).toHaveCSS('background-image', 'none');
    expect((await hero.boundingBox())!.width).toBeLessThanOrEqual(viewport.width);
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    for (const title of [
      'Live Job Tracking',
      'Security Camera Install',
      'Digital Signage Repair',
      'POS Terminal Offline',
      '4 Active Service Jobs',
      'Verified Technician'
    ]) {
      const heading = hero.getByRole('heading', { name: title, exact: true });
      await expect(heading).toBeVisible();
      const bounds = await heading.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    }
    const photoSize = await photo.evaluate((img: HTMLImageElement) => ({
      source: img.naturalWidth,
      displayed: img.getBoundingClientRect().width
    }));
    expect(photoSize.displayed).toBeLessThanOrEqual(photoSize.source);
    // No small UI element may bring back the blurry screenshot sprites.
    expect(
      await hero.evaluate((el) =>
        [...el.querySelectorAll('*')].some((child) =>
          getComputedStyle(child).backgroundImage.includes('hero-reference')
        )
      )
    ).toBe(false);
    await expect(hero.getByRole('definition')).toHaveCount(8);
    const stats = hero.getByRole('definition').filter({ hasText: '10K+' });
    await expect(stats).toBeVisible();
    const cta = hero.getByRole('link', { name: 'Get Started' });
    await expect(cta).toHaveAttribute('href', '/create-wo');
    if (viewport.width < 900) {
      expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
      await expect(page.getByRole('link', { name: 'Platform', exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    } else {
      const titleBounds = (await hero.getByRole('heading', { level: 1 }).boundingBox())!;
      expect(titleBounds.x).toBeGreaterThan(0);
      const brandBounds = (await page
        .getByRole('link', { name: 'FieldForge home' })
        .boundingBox())!;
      expect(brandBounds.x).toBeCloseTo(titleBounds.x, 0);
      await expect(page.getByRole('link', { name: 'Join as Technician', exact: true })).toHaveCSS(
        'white-space',
        'nowrap'
      );
      const rail = await hero.locator('dl[aria-label="Platform highlights"]').boundingBox();
      expect(rail!.y + rail!.height).toBeLessThanOrEqual(viewport.height);
    }
    if (viewport.width === 1536) {
      // Keep the established appearance when changing the styling implementation.
      await expect(hero.getByRole('heading', { level: 1 })).toHaveCSS('font-weight', '900');
      await expect(hero.getByText('without the', { exact: true })).toHaveCSS(
        'color',
        'rgb(90, 157, 47)'
      );
      await expect(hero.getByText('Urgent', { exact: true }).locator('..')).toHaveCSS(
        'background-color',
        'rgb(253, 234, 234)'
      );
      await expect(cta).toHaveCSS('background-color', 'rgb(139, 235, 50)');
      const title = (await hero.getByRole('heading', { level: 1 }).boundingBox())!;
      expect(Math.abs(title.x - 94)).toBeLessThan(5);
      expect(Math.abs(title.y - 203)).toBeLessThan(5);
      const ctaBounds = (await cta.boundingBox())!;
      expect(Math.abs(ctaBounds.y - 691)).toBeLessThan(5);
      const railBounds = (await hero
        .locator('dl[aria-label="Platform highlights"]')
        .boundingBox())!;
      expect(Math.abs(railBounds.x - 635)).toBeLessThan(5);
      expect(Math.abs(railBounds.y - 865)).toBeLessThan(5);
      for (const expected of [
        { name: 'Live Job Tracking', levels: 1, x: 664, y: 175, width: 270 },
        { name: 'Security Camera Install', levels: 2, x: 1165, y: 226, width: 242 },
        { name: 'POS Terminal Offline', levels: 2, x: 621, y: 409, width: 237 },
        { name: 'Digital Signage Repair', levels: 2, x: 1206, y: 417, width: 238 },
        { name: '4 Active Service Jobs', levels: 2, x: 643, y: 635, width: 362 },
        { name: 'Verified Technician', levels: 2, x: 1238, y: 718, width: 223 }
      ]) {
        const card = await hero
          .getByRole('heading', { name: expected.name, exact: true })
          .evaluate((heading, levels) => {
            let card = heading;
            for (let i = 0; i < levels; i++) card = card.parentElement!;
            const box = card.getBoundingClientRect();
            return { x: box.x, y: box.y, width: box.width };
          }, expected.levels);
        expect(Math.abs(card.x - expected.x), expected.name).toBeLessThan(5);
        expect(Math.abs(card.y - expected.y), expected.name).toBeLessThan(5);
        expect(Math.abs(card.width - expected.width), expected.name).toBeLessThan(5);
      }
    }
    await page.screenshot({ path: testInfo.outputPath(`hero-${viewport.width}.png`) });
  });
}

test('hero calls to action retain their existing destinations', async ({ page }) => {
  await page.goto('/marketing');
  const hero = page.getByRole('region', { name: 'Field service without the field-service chaos.' });
  await hero.getByRole('link', { name: 'Watch Demo' }).click();
  await expect(page).toHaveURL(/\/resources$/);
  await page.goto('/marketing');
  await hero.getByRole('link', { name: 'View All' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

// Desktop page zoom reduces the CSS viewport and scales each CSS pixel. Model both
// effects (not pinch zoom / Emulation.setPageScaleFactor, which does not reflow).
test('hero grows and shrinks under browser zoom geometry', async ({ browser }) => {
  const renderedSizes = new Map<number, number>();
  for (const zoom of [1, 0.8, 1.25, 2, 4]) {
    const context = await browser.newContext({
      viewport: { width: Math.round(1600 / zoom), height: Math.round(1000 / zoom) },
      deviceScaleFactor: zoom
    });
    const page = await context.newPage();
    await page.goto('/marketing');
    const hero = page.getByRole('region', {
      name: 'Field service without the field-service chaos.'
    });
    const size = await hero
      .getByRole('heading', { level: 1 })
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    renderedSizes.set(zoom, size * zoom);
    const titleBounds = (await hero.getByRole('heading', { level: 1 }).boundingBox())!;
    expect(titleBounds.x).toBeGreaterThanOrEqual(0);
    expect(titleBounds.x + titleBounds.width).toBeLessThanOrEqual(Math.round(1600 / zoom));
    await expect(hero.getByRole('link', { name: 'Get Started' })).toBeVisible();
    await context.close();
  }
  expect(renderedSizes.get(0.8)!).toBeLessThan(renderedSizes.get(1)! * 0.95);
  expect(renderedSizes.get(1.25)!).toBeGreaterThan(renderedSizes.get(1)! * 1.02);
  expect(renderedSizes.get(2)!).toBeGreaterThan(renderedSizes.get(1.25)!);
  expect(renderedSizes.get(4)!).toBeGreaterThan(renderedSizes.get(2)!);
});
