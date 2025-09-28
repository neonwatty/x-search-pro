import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { PopupPage } from '../../page-objects/PopupPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Workflow 2: Quick Apply Saved Search', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('should apply saved search from sidebar on X.com', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);
    await expect(await xHelper.isLoggedIn()).toBe(true);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);

    await sidebar.toggle();
    await expect(await sidebar.isVisible()).toBe(true);

    const searches = await sidebar.getSearchList();
    const count = await searches.count();
    expect(count).toBeGreaterThan(0);

    const firstSearch = searches.first();
    const searchName = await firstSearch.locator('.sidebar-item-name').textContent();
    console.log('Clicking search:', searchName);

    await firstSearch.click();

    await page.waitForTimeout(3000);

    await expect(await sidebar.isVisible()).toBe(false);

    await xHelper.verifyOnSearchPage();

    await page.waitForTimeout(2000);
    await page.close();
  });


  test('should filter saved searches in sidebar', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();

    await sidebar.toggle();
    await expect(await sidebar.isVisible()).toBe(true);

    const initialCount = await sidebar.getSearchCount();

    await sidebar.filterSearches('Viral');

    const filteredCount = await sidebar.getSearchCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should close sidebar after applying search', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();

    await sidebar.toggle();
    await expect(await sidebar.isVisible()).toBe(true);

    const searches = await sidebar.getSearchList();
    if (await searches.count() > 0) {
      await searches.first().click();
      await page.waitForTimeout(2000);
      await expect(await sidebar.isVisible()).toBe(false);
    }

    await page.waitForTimeout(1000);
    await page.close();
  });
});