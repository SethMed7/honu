import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../.cache/vite-site', import.meta.url)),
  base: process.env.HONU_SITE_BASE ?? '/honu/',
  plugins: [tailwindcss(), {
    name: 'honu-site-origin',
    transformIndexHtml(html) {
      const configured = process.env.HONU_SITE_ORIGIN;
      if (!configured) return html;
      const origin = new URL(configured);
      if (origin.protocol !== 'https:') throw new Error('HONU_SITE_ORIGIN must use HTTPS');
      return html.replaceAll('https://sethmedina.com/honu/', `${origin.origin}/`);
    },
  }],
  server: { port: 1421, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
