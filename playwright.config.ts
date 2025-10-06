import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'https://x.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
      timeout: 120000, // 2 minutes for auth setup
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Use real Chrome instead of Chromium
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled', // Hide automation
          ],
          headless: false, // Always run setup in headed mode
        },
      },
    },
    {
      name: 'unit',
      testMatch: /tests\/unit\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'e2e',
      testMatch: /tests\/e2e\/.*\.spec\.ts$/,
      testIgnore: ['**/auth-verification.spec.ts'],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Extension fixture handles browser launch, auth, and extension loading
      },
    },
  ],
});