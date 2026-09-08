import { expect, test } from '@playwright/test';

test('canvas is transparent, clears without undo, retains pen only in memory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:1420');
  await expect(page.getByRole('button', { name: 'Pen (P)', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Seafoam', exact: true }).click();
  await page.getByRole('button', { name: '4px stroke', exact: true }).click();
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(600, 500, { steps: 16 });
  await page.mouse.up();
  const pixels = () => page.locator('canvas.excalidraw__canvas.static').evaluate((element: HTMLCanvasElement) => {
    const data = element.getContext('2d')!.getImageData(200, 200, 600, 400).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
  await expect.poll(pixels).toBeGreaterThan(100);
  await page.keyboard.press('c');
  await expect.poll(pixels).toBe(0);
  await page.keyboard.press('Meta+z');
  await expect.poll(pixels).toBe(0);
  await expect(page.getByRole('button', { name: 'Seafoam', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '4px stroke', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Show Honu preview' }).click();
  await expect(page.getByRole('button', { name: 'Seafoam', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(pixels).toBe(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ocean blue', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/hud.png' });
  expect(errors).toEqual([]);
});

test('typing C does not wipe a text annotation', async ({ page }) => {
  await page.goto('http://127.0.0.1:1420');
  await page.getByRole('button', { name: 'Text (T)', exact: true }).click();
  await page.mouse.click(400, 300);
  const text = page.locator('textarea.excalidraw-wysiwyg');
  await expect(text).toBeVisible();
  await text.fill('A quick ');
  await page.keyboard.type('circle');
  await expect(text).toHaveValue('A quick circle');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Show Honu preview' })).toBeVisible();
});

test('landing preview draws, toggles, clears and fits desktop/mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:1421/honu/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Zero-bloat');
  await page.locator('#clear-preview').click();
  const canvas = page.locator('#drawing-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + 150, bounds.y + 100);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 220, bounds.y + 180, { steps: 10 });
  await page.mouse.up();
  const hasInk = () => canvas.evaluate((element: HTMLCanvasElement) => element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data.some((v, i) => i % 4 === 3 && v > 0));
  expect(await hasInk()).toBe(true);
  await page.locator('#toggle-preview').click();
  await expect(canvas).toBeHidden();
  await page.locator('#toggle-preview').click();
  expect(await hasInk()).toBe(true);
  await page.locator('#clear-preview').click();
  expect(await hasInk()).toBe(false);
  await page.locator('#hide-preview').click();
  await expect(canvas).toBeHidden();
  await page.locator('#toggle-preview').click();
  await page.reload();
  for (const width of [1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if ([1440, 390].includes(width)) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/site-${width}.png`, fullPage: true, animations: 'disabled' });
    }
  }
  await expect(page.getByRole('link', { name: 'Download for Apple Silicon' })).toHaveAttribute('href', /Honu_aarch64\.dmg$/);
  await expect(page.getByRole('link', { name: 'Download for Intel' })).toHaveAttribute('href', /Honu_x86_64\.dmg$/);
  expect(errors).toEqual([]);
});
