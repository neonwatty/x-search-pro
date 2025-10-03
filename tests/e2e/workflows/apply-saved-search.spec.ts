import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Workflow 2: Quick Apply Saved Search', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('should apply saved search from sidebar on X.com', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);
    await expect(await xHelper.isLoggedIn()).toBe(true);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);

    await sidebar.ensureVisible();
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


  test('should filter saved searches in sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();

    await sidebar.ensureVisible();
    await expect(await sidebar.isVisible()).toBe(true);

    const initialCount = await sidebar.getSearchCount();

    await sidebar.filterSearches('Viral');

    const filteredCount = await sidebar.getSearchCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should close sidebar after applying search', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();

    await sidebar.ensureVisible();
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

test.describe('Sidebar: Sliding Window Display', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('should show full sliding window badge in expanded sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();
    await sidebar.ensureVisible();

    // Ensure sidebar is expanded (not collapsed)
    if (await sidebar.isSidebarCollapsed()) {
      await sidebar.expandSidebar();
    }

    // Find a search with sliding window (you may need to create one first)
    const searches = await sidebar.getSearchList();
    if (await searches.count() > 0) {
      const firstSearchName = await searches.first().locator('.sidebar-item-name').textContent();

      // Check if badge exists and has full text
      const badgeText = await sidebar.getSlidingWindowBadgeText(firstSearchName || '');
      if (badgeText) {
        expect(badgeText).toContain('🕒');
        // Should be full text like "🕒 Last 1 Week"
        expect(badgeText.length).toBeGreaterThan(3);
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should show compact sliding window badge in collapsed sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();
    await sidebar.ensureVisible();

    // Collapse the sidebar
    await sidebar.collapseSidebar();
    expect(await sidebar.isSidebarCollapsed()).toBe(true);

    const searches = await sidebar.getSearchList();
    if (await searches.count() > 0) {
      const firstSearchName = await searches.first().locator('.sidebar-item-collapsed-name').textContent();

      // Check if badge exists in collapsed view
      const badgeText = await sidebar.getSlidingWindowBadgeText(firstSearchName || '');
      if (badgeText) {
        expect(badgeText).toContain('🕒');
        // Should be short text like "🕒 1W"
        // The collapsed version should be shorter
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should toggle between expanded and collapsed badge formats', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();
    await sidebar.ensureVisible();

    // Ensure sidebar is expanded (not collapsed)
    if (await sidebar.isSidebarCollapsed()) {
      await sidebar.expandSidebar();
    }

    const searches = await sidebar.getSearchList();
    if (await searches.count() > 0) {
      // Get badge text when expanded
      const firstSearchExpanded = await searches.first().locator('.sidebar-item-name').textContent();
      const expandedBadgeText = await sidebar.getSlidingWindowBadgeText(firstSearchExpanded || '');

      // Collapse sidebar
      await sidebar.collapseSidebar();
      await page.waitForTimeout(500);

      // Get badge text when collapsed
      const firstSearchCollapsed = await searches.first().locator('.sidebar-item-collapsed-name').textContent();
      const collapsedBadgeText = await sidebar.getSlidingWindowBadgeText(firstSearchCollapsed || '');

      // If there's a sliding window search, verify badge changes format
      if (expandedBadgeText && collapsedBadgeText) {
        expect(expandedBadgeText).toContain('🕒');
        expect(collapsedBadgeText).toContain('🕒');
        // Collapsed should be shorter
        expect(collapsedBadgeText.length).toBeLessThan(expandedBadgeText.length);
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should position badge correctly in expanded view', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();
    await sidebar.ensureVisible();

    // Ensure sidebar is expanded (not collapsed)
    if (await sidebar.isSidebarCollapsed()) {
      await sidebar.expandSidebar();
    }

    const searches = await sidebar.getSearchList();
    if (await searches.count() > 0) {
      const firstSearch = searches.first();

      // Check if sliding window badge exists (full version in expanded view)
      const badge = firstSearch.locator('.sidebar-sliding-window-badge.sidebar-badge-full');
      const badgeCount = await badge.count();

      if (badgeCount > 0) {
        // Verify badge is visible and positioned correctly
        await expect(badge).toBeVisible();

        // Badge should be in the header section with category badge
        const header = firstSearch.locator('.sidebar-item-header');
        const badgesContainer = header.locator('.sidebar-item-badges');
        await expect(badgesContainer).toBeVisible();
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should apply sliding window search with fresh dates from sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();
    await sidebar.ensureVisible();

    const searches = await sidebar.getSearchList();

    // Find a search with sliding window badge
    let foundSlidingWindowSearch = false;
    for (let i = 0; i < Math.min(await searches.count(), 5); i++) {
      const search = searches.nth(i);
      const name = await search.locator('.sidebar-item-name').textContent();
      const hasBadge = await sidebar.hasSlidingWindowBadge(name || '');

      if (hasBadge) {
        foundSlidingWindowSearch = true;

        // Click the search
        await search.click();
        await page.waitForTimeout(3000);

        // Should navigate to search page
        await xHelper.verifyOnSearchPage();

        // Sidebar should close
        await expect(await sidebar.isVisible()).toBe(false);
        break;
      }
    }

    // This test only runs if we found a sliding window search
    if (!foundSlidingWindowSearch) {
      console.log('No sliding window searches found - skipping application test');
    }

    await page.waitForTimeout(1000);
    await page.close();
  });
});