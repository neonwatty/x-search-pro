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

  const accountSwitcher = page.locator('[data-testid="SideNav_AccountSwitcher_Button"]');
  await expect(accountSwitcher).toBeVisible({ timeout: 10000 });
  console.log('✓ Verified login state');

  await page.context().storageState({ path: authFile });
  console.log('✓ Authentication state saved to', authFile);
});