import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const authFile = 'tests/.auth/user.json';

setup.skip('authenticate with X.com', async ({ page }) => {
  // Skip if auth file already exists or credentials not provided
  if (fs.existsSync(authFile)) {
    console.log('✓ Auth file already exists, skipping authentication');
    setup.skip();
    return;
  }

  if (!process.env.TEST_X_USERNAME || !process.env.TEST_X_PASSWORD) {
    console.log('⚠ TEST_X_USERNAME and TEST_X_PASSWORD not set in .env file');
    console.log('⚠ Skipping authentication - will use existing auth file if available');
    setup.skip();
    return;
  }

  console.log('Starting X.com authentication...');

  await page.goto('https://x.com/login');

  // Wait for and fill username
  const usernameInput = page.locator('input[name="text"]');
  await expect(usernameInput).toBeVisible({ timeout: 20000 });
  await usernameInput.fill(process.env.TEST_X_USERNAME!);
  console.log('✓ Entered username');

  // Click Next and wait for navigation
  await page.click('button:has-text("Next")');

  // Wait for either password field or error message
  const passwordInput = page.locator('input[name="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 30000 });
  await passwordInput.fill(process.env.TEST_X_PASSWORD!);
  console.log('✓ Entered password');

  await page.click('button[data-testid="LoginForm_Login_Button"]');

  await page.waitForURL('**/home', { timeout: 60000 });
  console.log('✓ Logged in successfully');

  // Try multiple selectors to verify login state, with longer timeouts
  const loginIndicators = [
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid="AppTabBar_Profile_Link"]',
    '[aria-label="Profile"]',
    '[data-testid="primaryColumn"]',
    'nav[aria-label="Primary"]',
    '[role="main"]'
  ];

  let verified = false;
  for (const selector of loginIndicators) {
    try {
      await page.locator(selector).waitFor({ state: 'visible', timeout: 15000 });
      console.log(`✓ Verified login state using selector: ${selector}`);
      verified = true;
      break;
    } catch {
      continue;
    }
  }

  if (!verified) {
    throw new Error('Could not verify login state - none of the expected elements were found');
  }

  await page.context().storageState({ path: authFile });
  console.log('✓ Authentication state saved to', authFile);
});