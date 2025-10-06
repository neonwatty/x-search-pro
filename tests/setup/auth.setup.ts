import { test as setup, expect, chromium } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

dotenv.config();

const authFile = 'tests/.auth/user.json';
const userDataDir = path.join(__dirname, '../.auth/user-data');

setup('authenticate with X.com', async ({ }) => {
  // Skip if auth file already exists
  if (fs.existsSync(authFile)) {
    console.log('✓ Auth file already exists, skipping authentication');
    console.log('  (Delete tests/.auth/user.json to re-authenticate)');
    setup.skip();
    return;
  }

  // Ensure user data directory exists
  fs.mkdirSync(userDataDir, { recursive: true });

  if (!process.env.TEST_X_USERNAME || !process.env.TEST_X_PASSWORD) {
    throw new Error('TEST_X_USERNAME and TEST_X_PASSWORD must be set in .env file');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  X.com Automated Authentication');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔐 Logging in to X.com...');
  console.log(`   Username: ${process.env.TEST_X_USERNAME}`);

  // Launch persistent context (same as E2E tests but without extension)
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  // Check if already logged in
  await page.goto('https://x.com/home');
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  const isLoggedIn = await page.locator('[data-testid="SideNav_AccountSwitcher_Button"]')
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isLoggedIn) {
    console.log('✓ Already logged in, saving current session...');
  } else {
    console.log('Not logged in, performing login...');

    // Navigate to login page
    await page.goto('https://x.com/login');
    await page.waitForTimeout(2000);

    // Fill username
    const usernameInput = page.locator('input[name="text"]');
    await expect(usernameInput).toBeVisible({ timeout: 20000 });
    await usernameInput.fill(process.env.TEST_X_USERNAME);
    console.log('✓ Entered username');

    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);

    // Check for password field
    const passwordInput = page.locator('input[name="password"]');
    const passwordVisible = await passwordInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!passwordVisible) {
      // Check for error message
      const errorMsg = await page.locator('text=/Could not log you in|Please try again/i')
        .textContent()
        .catch(() => null);

      if (errorMsg) {
        throw new Error(`X.com rejected login: ${errorMsg}\n\nSuggestion: Wait a few minutes and try again, or use manual login.`);
      }

      throw new Error('Password field not found. X.com may have changed their login flow or requires additional verification.');
    }

    // Fill password
    await passwordInput.fill(process.env.TEST_X_PASSWORD);
    console.log('✓ Entered password');

    // Click login button
    await page.click('button[data-testid="LoginForm_Login_Button"]');
    console.log('✓ Clicked login button');

    // Wait for navigation to home
    await page.waitForURL('**/home', { timeout: 60000 });
    console.log('✓ Logged in successfully');
  }

  // Wait for page to fully load
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    console.log('⚠ Network idle timeout, continuing anyway...');
  });
  await page.waitForTimeout(3000);

  // Verify login state
  console.log('🔐 Verifying authentication...');

  const loginIndicators = [
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid="AppTabBar_Profile_Link"]',
    '[aria-label="Profile"]',
    '[data-testid="primaryColumn"]',
    'nav[aria-label="Primary"]',
  ];

  let verified = false;
  for (const selector of loginIndicators) {
    try {
      await page.locator(selector).waitFor({ state: 'visible', timeout: 20000 });
      console.log(`✓ Verified login using: ${selector}`);
      verified = true;
      break;
    } catch {
      console.log(`  ✗ Not found: ${selector}`);
      continue;
    }
  }

  if (!verified) {
    throw new Error('Could not verify login state - page may still be loading');
  }

  // Save authentication state
  console.log('💾 Saving authentication state...');
  await context.storageState({ path: authFile });
  console.log(`✓ Authentication state saved to ${authFile}`);
  console.log(`✓ Session saved to persistent userDataDir: ${userDataDir}`);

  // Close the context
  await context.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ Authentication Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('  All E2E tests will now use this authenticated session.\n');
});
