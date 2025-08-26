import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'node server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});

