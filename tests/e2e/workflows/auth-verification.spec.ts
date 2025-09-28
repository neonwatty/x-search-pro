import { test, expect } from '../../fixtures/extension';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Authentication Verification', () => {
  test('should be authenticated on X.com', async ({ context, extensionId }) => {
    console.log('Extension ID:', extensionId);

    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    console.log('Navigating to X.com home...');
    await page.goto('https://x.com/home');

    console.log('Waiting for page to load...');
    await page.waitForTimeout(5000);

    const isLoggedIn = await xHelper.isLoggedIn();
    console.log('Is logged in?', isLoggedIn);

    expect(isLoggedIn).toBe(true);

    await page.screenshot({ path: 'test-results/auth-verification-success.png' });

    await page.close();
  });
});