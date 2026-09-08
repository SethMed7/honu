import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../.cache/vite-site', import.meta.url)),
  base: process.env.HONU_SITE_BASE ?? '/honu/',
  plugins: [tailwindcss()],
  server: { port: 1421, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
