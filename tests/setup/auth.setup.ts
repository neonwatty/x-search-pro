import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const authFile = 'tests/.auth/user.json';

setup('authenticate with X.com', async ({ page }) => {
  console.log('Starting X.com authentication...');

  await page.goto('https://x.com/login');

  await page.fill('input[name="text"]', process.env.TEST_X_USERNAME!);
  console.log('✓ Entered username');

  await page.click('button:has-text("Next")');
  await page.waitForTimeout(2000);

  const passwordInput = page.locator('input[name="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await passwordInput.fill(process.env.TEST_X_PASSWORD!);
  console.log('✓ Entered password');

  await page.click('button[data-testid="LoginForm_Login_Button"]');

  await page.waitForURL('**/home', { timeout: 30000 });
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