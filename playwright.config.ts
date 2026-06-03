import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// load .env.test locally; in CI variables come from GitHub Secrets
config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,        // max time per test - 30 sec
  retries: 1,             // one retry on failure (network can be flaky)
  reporter: 'html',       // HTML report after run

  use: {
    baseURL: process.env.BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    // grant microphone - without this startSession fails on getUserMedia
    permissions: ['microphone'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
