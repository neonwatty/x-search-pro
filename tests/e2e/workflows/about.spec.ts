import { test, expect } from '../../fixtures/extension';

test.describe('About Tab', () => {
  test('should display About tab and content', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    // Click About tab
    const aboutTab = page.locator('[data-tab="about"]');
    await aboutTab.click();

    // Verify tab content is visible
    const aboutContent = page.locator('#about-tab');
    await expect(aboutContent).toBeVisible();

    // Verify header
    const header = aboutContent.locator('h2');
    await expect(header).toHaveText('X Search Pro');

    const tagline = aboutContent.locator('.about-tagline');
    await expect(tagline).toContainText('Advanced search made simple');
  });

  test('should display social links', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const aboutTab = page.locator('[data-tab="about"]');
    await aboutTab.click();

    // Verify X/Twitter link
    const xLink = page.locator('a[href="https://x.com/neonwatty"]').first();
    await expect(xLink).toBeVisible();
    await expect(xLink).toContainText('@neonwatty');

    // Verify GitHub link
    const githubLink = page.locator('a[href="https://github.com/neonwatty/x-search-tabs"]');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toContainText('GitHub');

    // Verify Blog link
    const blogLink = page.locator('a[href="https://neonwatty.com/"]');
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toContainText('Blog');
  });

  test('should display creator attribution with correct link', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const aboutTab = page.locator('[data-tab="about"]');
    await aboutTab.click();

    // Verify "Made with ❤️ by neonwatty" with link to X profile
    const creator = page.locator('.about-creator');
    await expect(creator).toContainText('Made with ❤️ by');

    const creatorLink = creator.locator('a[href="https://x.com/neonwatty"]');
    await expect(creatorLink).toBeVisible();
    await expect(creatorLink).toContainText('neonwatty');
  });

  test('should have correct link attributes for security', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const aboutTab = page.locator('[data-tab="about"]');
    await aboutTab.click();

    // Check all external links have proper security attributes
    const links = page.locator('.about-content a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('should display connection message', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const aboutTab = page.locator('[data-tab="about"]');
    await aboutTab.click();

    const message = page.locator('.about-message');
    await expect(message).toContainText('Connect on social');
    await expect(message).toContainText('Report bugs');
    await expect(message).toContainText('Request features');
  });
});