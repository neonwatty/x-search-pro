import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

/**
 * Prepare test extension directory with manifest.test.json
 * This allows the extension to inject into file:// URLs for testing
 *
 * @param workerIndex - Unique index for the worker (enables parallel execution)
 */
function prepareTestExtension(workerIndex: number): string {
  // Use absolute path resolution to work correctly in CI
  const sourceDir = path.resolve(__dirname, '../..');
  const testExtensionDir = path.join(os.tmpdir(), `x-search-pro-test-extension-worker-${workerIndex}`);

  // Remove old test extension directory if it exists
  if (fs.existsSync(testExtensionDir)) {
    fs.rmSync(testExtensionDir, { recursive: true, force: true });
  }

  // Create fresh test extension directory
  fs.mkdirSync(testExtensionDir, { recursive: true });

  // Copy all extension files to test directory
  const filesToCopy = ['assets', 'background', 'content', 'lib', 'popup'];
  for (const item of filesToCopy) {
    const sourcePath = path.join(sourceDir, item);
    const destPath = path.join(testExtensionDir, item);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source directory not found: ${sourcePath}`);
    }
    fs.cpSync(sourcePath, destPath, { recursive: true });
  }

  // Copy manifest.test.json as manifest.json
  const manifestTestPath = path.join(sourceDir, 'manifest.test.json');
  const manifestDestPath = path.join(testExtensionDir, 'manifest.json');

  if (!fs.existsSync(manifestTestPath)) {
    throw new Error(`manifest.test.json not found at: ${manifestTestPath}\nSource dir: ${sourceDir}\nContents: ${fs.readdirSync(sourceDir).join(', ')}`);
  }

  fs.copyFileSync(manifestTestPath, manifestDestPath);

  console.log(`Test extension prepared at: ${testExtensionDir}`);
  return testExtensionDir;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({ }, use, testInfo) => {
    // Use worker-specific directories to enable parallel execution
    const workerIndex = testInfo.parallelIndex;
    const pathToExtension = prepareTestExtension(workerIndex);
    const userDataDir = path.join(__dirname, `../.auth/user-data-worker-${workerIndex}`);

    console.log(`Worker ${workerIndex}: userDataDir = ${userDataDir}`);
    console.log(`Worker ${workerIndex}: pathToExtension = ${pathToExtension}`);

    // Clean up any stale lock files from previous runs
    const lockFile = path.join(userDataDir, 'SingletonLock');
    if (fs.existsSync(lockFile)) {
      console.log(`Worker ${workerIndex}: Removing stale lock file: ${lockFile}`);
      fs.rmSync(lockFile, { force: true });
    }

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
        '--allow-file-access-from-files', // Allow extension to access file:// URLs
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
        // Navigate to test page to trigger content script injection
        // This avoids X.com authentication issues
        const testPagePath = path.join(__dirname, '../fixtures/test-page.html');
        const testPageUrl = `file://${testPagePath}`;
        await page.goto(testPageUrl, { timeout: 10000, waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load', { timeout: 5000 });
      } catch (error) {
        console.warn('Navigation warning:', error);
      }

      // Wait a bit for extension to fully initialize
      await page.waitForTimeout(2000);

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
