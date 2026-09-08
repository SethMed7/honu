import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { version } from '../package.json';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../.cache/vite-site', import.meta.url)),
  base: process.env.HONU_SITE_BASE ?? '/honu/',
  plugins: [react(), tailwindcss(), {
    name: 'honu-site-origin',
    transformIndexHtml(html) {
      html = html.replaceAll('__HONU_VERSION__', version);
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
