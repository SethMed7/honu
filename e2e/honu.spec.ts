import { expect, test } from '@playwright/test';

test('canvas is transparent, clears without undo, retains pen only in memory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:1420');
  await expect(page.getByRole('button', { name: 'Pen (P)', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
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
  await expect(page.getByRole('button', { name: 'Blue', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '4px stroke', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Show Honu preview' }).click();
  await expect(page.getByRole('button', { name: 'Blue', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(pixels).toBe(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Orange', exact: true })).toHaveAttribute('aria-pressed', 'true');
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


for (const [surface, url] of [['app', 'http://127.0.0.1:1420'], ['site', 'http://127.0.0.1:1421/honu/']] as const) {
  test(`${surface}: shapes, arrows, colors, selection and weight work`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    const host = page.locator('.honu-canvas');
    await host.scrollIntoViewIfNeeded();
    const clear = page.getByRole('button', { name: 'Clear C', exact: true });
    await expect(page.getByRole('button', { name: 'Rectangle (R)' })).toBeEnabled();
    const canvas = host.locator('canvas.excalidraw__canvas.static');
    const ink = (color?: 'white' | 'orange') => canvas.evaluate((element: HTMLCanvasElement, selected) => {
      const data = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 100) continue;
        if (!selected || (selected === 'white' && data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) ||
            (selected === 'orange' && data[i] > 230 && data[i + 1] > 130 && data[i + 1] < 210 && data[i + 2] < 120)) count++;
      }
      return count;
    }, color);
    for (const tool of ['Rectangle (R)', 'Ellipse (O)', 'Diamond (D)', 'Arrow (A)', 'Line (L)']) {
      await clear.click();
      await page.getByRole('button', { name: tool, exact: true }).click();
      await page.getByRole('button', { name: 'Orange', exact: true }).click();
      await page.getByRole('button', { name: '4px stroke', exact: true }).click();
      await expect(page.getByRole('button', { name: tool, exact: true })).toHaveAttribute('aria-pressed', 'true');
      const bounds = (await canvas.boundingBox())!;
      await page.mouse.move(bounds.x + 330, bounds.y + 200);
      await page.mouse.down();
      await page.mouse.move(bounds.x + 570, bounds.y + 340, { steps: 12 });
      await page.mouse.up();
      await expect.poll(() => ink('orange')).toBeGreaterThan(250);
      // Selected geometry is recolored in place, and the new color applies to
      // subsequent shapes too. This catches a toolbar that only changes a dot.
      await page.getByRole('button', { name: 'Select (V)' }).click();
      await page.mouse.click(bounds.x + 700, bounds.y + 420);
      await page.keyboard.press('Meta+a');
      await page.getByRole('button', { name: 'White', exact: true }).click();
      await expect.poll(() => ink('white')).toBeGreaterThan(250);
      await expect.poll(() => ink('orange')).toBe(0);
      await page.getByRole('button', { name: '1px stroke', exact: true }).click();
      await expect(page.getByRole('button', { name: '1px stroke' })).toHaveAttribute('aria-pressed', 'true');
    }
    await clear.click();
    await expect.poll(() => ink()).toBe(0);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    expect(errors).toEqual([]);
  });
}

test('landing preview retains settings across toggles, wipes on hide, and fits every width', async ({ page }) => {
  const failures: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()}: ${response.url()}`); });
  await page.goto('http://127.0.0.1:1421/honu/');
  await page.locator('#desktop').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Arrow (A)' })).toBeEnabled();
  await page.getByRole('button', { name: 'Arrow (A)' }).click();
  await page.getByRole('button', { name: 'Yellow', exact: true }).click();
  await page.locator('#toggle-preview').click();
  await expect(page.getByRole('button', { name: 'Arrow (A)' })).toBeHidden();
  await page.locator('#toggle-preview').click();
  await expect(page.getByRole('button', { name: 'Arrow (A)' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Yellow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#hide-preview').click();
  await page.locator('#toggle-preview').click();
  const alpha = await page.locator('canvas.excalidraw__canvas.static').evaluate((el: HTMLCanvasElement) => el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data.some((v, i) => i % 4 === 3 && v > 0));
  expect(alpha).toBe(false);
  await expect(page.getByRole('button', { name: 'Yellow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  for (const width of [1440, 1280, 1024, 768, 680, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#desktop').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const label of ['Arrow (A)', 'Rectangle (R)', 'Ellipse (O)', 'Orange', 'Yellow', 'White', 'Black', 'Blue', 'Red', '4px stroke']) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    }
    const clipped = await page.locator('.drawing-tools button').evaluateAll(buttons => buttons.some(button => {
      const rect = button.getBoundingClientRect();
      const parent = button.closest('.honu-canvas')!.getBoundingClientRect();
      return rect.left < parent.left || rect.right > parent.right || rect.top < parent.top || rect.bottom > parent.bottom;
    }));
    expect(clipped).toBe(false);
    if ([1440, 390].includes(width)) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/site-${width}.png`, fullPage: true, animations: 'disabled' });
    }
  }
  await expect(page.getByRole('link', { name: 'Download for Apple Silicon' })).toHaveAttribute('href', /Honu_aarch64\.dmg$/);
  await expect(page.getByRole('link', { name: 'Download for Intel' })).toHaveAttribute('href', /Honu_x86_64\.dmg$/);
  expect(failures).toEqual([]);
});
