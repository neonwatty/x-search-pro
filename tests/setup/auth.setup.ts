import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const authFile = 'tests/.auth/user.json';

setup('authenticate with X.com', async ({ page }) => {
  console.log('Starting X.com authentication...');

  if (!process.env.TEST_X_USERNAME || !process.env.TEST_X_PASSWORD) {
    throw new Error('TEST_X_USERNAME and TEST_X_PASSWORD must be set in .env file');
  }

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