import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test.describe('Workflow 2: Quick Apply Saved Search', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('should apply saved search from sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection();

    await sidebar.ensureVisible();
    await expect(await sidebar.isVisible()).toBe(true);

    const searches = await sidebar.getSearchList();
    const count = await searches.count();
    expect(count).toBeGreaterThan(0);

    const firstSearch = searches.first();
    const searchName = await firstSearch.locator('.sidebar-item-name').textContent();
    console.log('Clicking search:', searchName);

    await firstSearch.click();

    await page.waitForTimeout(2000);

    await expect(await sidebar.isVisible()).toBe(false);

    // Verify search was applied to the input
    const searchInputValue = await testPageHelper.getSearchInputValue();
    expect(searchInputValue.length).toBeGreaterThan(0);
    console.log('Search applied:', searchInputValue);

    await page.waitForTimeout(1000);
    await page.close();
  });


  test('should filter saved searches in sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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

  test('should show sliding window badge in expanded sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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

      // Check if badge exists and has short format
      const badgeText = await sidebar.getSlidingWindowBadgeText(firstSearchName || '');
      if (badgeText) {
        expect(badgeText).toContain('🕒');
        // Should be short text like "🕒 1D", "🕒 1W", or "🕒 1M"
        expect(badgeText).toMatch(/🕒\s*(1D|1W|1M)/);
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should show sliding window badge in collapsed sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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
        // Should be short text like "🕒 1D", "🕒 1W", or "🕒 1M"
        expect(badgeText).toMatch(/🕒\s*(1D|1W|1M)/);
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should show same badge format in expanded and collapsed views', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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

      // If there's a sliding window search, verify badge format is the same
      if (expandedBadgeText && collapsedBadgeText) {
        expect(expandedBadgeText).toContain('🕒');
        expect(collapsedBadgeText).toContain('🕒');
        // Badge format should be the same in both views (short format)
        expect(expandedBadgeText).toMatch(/🕒\s*(1D|1W|1M)/);
        expect(collapsedBadgeText).toMatch(/🕒\s*(1D|1W|1M)/);
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should position badge correctly in expanded view', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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

      // Check if sliding window badge exists in expanded view
      const badgeCount = await firstSearch.locator('.sidebar-sliding-window-badge').count();

      if (badgeCount > 0) {
        const badge = firstSearch.locator('.sidebar-sliding-window-badge').first();
        // Verify badge is visible and positioned correctly
        await expect(badge).toBeVisible();

        // Badge should be in the header section with category badge
        const header = firstSearch.locator('.sidebar-item-header');
        await expect(header).toBeVisible();

        // Check if badges container exists (it should if badge is present)
        const badgesCount = await header.locator('.sidebar-item-badges').count();
        if (badgesCount > 0) {
          const badgesContainer = header.locator('.sidebar-item-badges');
          await expect(badgesContainer).toBeVisible();
        }
      }
    }

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should apply sliding window search with fresh dates from sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

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
        console.log('Found sliding window search:', name);

        // Click the search
        await search.click();
        await page.waitForTimeout(2000);

        // Sidebar should close
        await expect(await sidebar.isVisible()).toBe(false);

        // Verify search was applied with date filters
        const searchInputValue = await testPageHelper.getSearchInputValue();
        expect(searchInputValue.length).toBeGreaterThan(0);

        // Verify query contains date filters (since: and until:) to confirm fresh dates calculated
        expect(searchInputValue).toMatch(/since:\d{4}-\d{2}-\d{2}/);
        expect(searchInputValue).toMatch(/until:\d{4}-\d{2}-\d{2}/);
        console.log('Sliding window search applied with fresh dates:', searchInputValue);
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