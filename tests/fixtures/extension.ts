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
    const authStatePath = path.join(__dirname, '../.auth/user.json');

    fs.mkdirSync(userDataDir, { recursive: true });

    const isHeadless = process.env.HEADLESS !== 'false';
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        '--disable-extensions-except=' + pathToExtension,
        '--load-extension=' + pathToExtension,
      ],
    });

    if (fs.existsSync(authStatePath)) {
      const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));
      await context.addCookies(authState.cookies);

      for (const origin of authState.origins) {
        await context.addInitScript((storageData) => {
          if (storageData.localStorage) {
            for (const [key, value] of storageData.localStorage) {
              window.localStorage.setItem(key, value);
            }
          }
        }, origin);
      }
    }

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';