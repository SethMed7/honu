import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Render the existing brand as code so fonts, layout, and future updates are
// reproducible. No remote service, runtime image generation, or CDN is used.
let html = await readFile('site/social-card.html', 'utf8');
const assets = [
  ['__FONT__', new URL(import.meta.resolve('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')), 'font/woff2'],
  ['__TURTLE__', 'public/turtle.svg', 'image/svg+xml'],
  ['__BACKGROUND__', 'site/src/assets/aetheria-184729.webp', 'image/webp'],
] as const;
for (const [placeholder, path, type] of assets) {
  html = html.replaceAll(placeholder, `data:${type};base64,${(await readFile(path)).toString('base64')}`);
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const bytes = await sharp(await page.screenshot({ type: 'png' })).png({ compressionLevel: 9 }).toBuffer();
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== 1200 || metadata.height !== 630 || bytes.length > 5_000_000) throw new Error('Invalid social-card dimensions or size');
  await mkdir('site/public/social', { recursive: true });
  await writeFile('site/public/social/honu-preview.png', bytes);
  console.log(`Social preview: 1200×630 PNG, ${Math.round(bytes.length / 1024)} KB`);
} finally {
  await browser.close();
}
