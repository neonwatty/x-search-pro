import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<ExtensionFixtures>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../..');
    const userDataDir = path.join(__dirname, '../.auth/user-data');

    // Ensure user data directory exists
    fs.mkdirSync(userDataDir, { recursive: true });

    const isHeadless = process.env.HEADLESS !== 'false';

    // Launch persistent context with extension
    // Auth is already saved in userDataDir from auth.setup.ts
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-blink-features=AutomationControlled',
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let serviceWorker = context.serviceWorkers()[0];

    if (!serviceWorker) {
      console.log('Service worker not found, triggering extension load...');

      // Open a page to trigger extension loading
      const page = await context.newPage();

      try {
        // Navigate to x.com to trigger content script injection
        await page.goto('https://x.com', { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (error) {
        console.warn('Navigation warning:', error);
      }

      // Wait a bit for extension to fully initialize
      await page.waitForTimeout(3000);

      // Check for service worker again
      serviceWorker = context.serviceWorkers()[0];

      if (!serviceWorker) {
        console.log('Waiting for service worker event...');
        // Wait for service worker to register
        try {
          serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
        } catch (error) {
          throw new Error(`Extension service worker did not load. Make sure the extension is valid. Error: ${error}`);
        }
      }

      await page.close();
    }

    const extensionId = serviceWorker.url().split('/')[2];
    console.log(`Extension loaded with ID: ${extensionId}`);

    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
