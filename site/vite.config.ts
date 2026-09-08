import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const base = process.env.HONU_SITE_BASE ?? '/honu/';
const origin = new URL(process.env.HONU_SITE_ORIGIN ?? 'https://sethmedina.com');
if (origin.protocol !== 'https:') throw new Error('HONU_SITE_ORIGIN must use HTTPS');
const siteUrl = new URL(base, origin.origin).href;
const socialImage = readFileSync(new URL('./public/social/honu-preview.png', import.meta.url));
const socialHash = createHash('sha256').update(socialImage).digest('hex').slice(0, 12);
const socialPath = `social/honu-preview-${socialHash}.png`;

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../.cache/vite-site', import.meta.url)),
  base,
  plugins: [react(), tailwindcss(), {
    name: 'honu-sharing-metadata',
    transformIndexHtml(html) {
      return html.replaceAll('__HONU_SITE_URL__', siteUrl)
        .replaceAll('__HONU_SOCIAL_IMAGE__', new URL(socialPath, siteUrl).href);
    },
    generateBundle() {
      // Image content changes get a new URL, even without an app release.
      this.emitFile({ type: 'asset', fileName: socialPath, source: socialImage });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n` });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}</loc></url></urlset>\n` });
    },
  }],
  server: { port: 1421, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
