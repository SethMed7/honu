import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: [
    { command: 'bunx vite preview --host 127.0.0.1 --port 1420 --strictPort', url: 'http://127.0.0.1:1420', reuseExistingServer: false },
    { command: 'bunx vite preview --config site/vite.config.ts --host 127.0.0.1 --port 1421 --strictPort', url: 'http://127.0.0.1:1421/honu/', reuseExistingServer: false },
  ],
});
