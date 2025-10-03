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
      use: { ...devices['Desktop Chrome'] },
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
      testIgnore: ['**/apply-saved-search.spec.ts', '**/auth-verification.spec.ts', '**/drag-and-drop-reorder.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'e2e-with-auth',
      testMatch: /tests\/e2e\/(workflows\/apply-saved-search|workflows\/auth-verification|workflows\/drag-and-drop-reorder).*\.spec\.ts$/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
    },
  ],
});