import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test.describe('Sliding Window Feature', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Clear existing searches to ensure clean state
    const clearPage = await context.newPage();
    await clearPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await clearPage.evaluate(() => {
      return chrome.storage.sync.clear();
    });
    await clearPage.close();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  test.describe('Builder Tab UI', () => {
    test('should disable date inputs when sliding window is selected', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Initially date inputs should be enabled
      expect(await sidebar.areDateInputsEnabled()).toBe(true);

      // Select sliding window
      await sidebar.selectSlidingWindow('1w');

      // Date inputs should now be disabled
      expect(await sidebar.areDateInputsDisabled()).toBe(true);

      // Verify visual feedback (opacity)
      const sinceDateOpacity = await page.locator('#sidebarSinceDate').evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      expect(sinceDateOpacity).toBe('0.5');

      await page.close();
    });

    test('should show info message when sliding window is selected', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Initially info should be hidden
      expect(await sidebar.isSlidingWindowInfoVisible()).toBe(false);

      // Select sliding window
      await sidebar.selectSlidingWindow('1d');

      // Info should now be visible
      expect(await sidebar.isSlidingWindowInfoVisible()).toBe(true);

      await page.close();
    });

    test('should clear sliding window when fixed date is entered', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Select sliding window first
      await sidebar.selectSlidingWindow('1w');
      expect(await sidebar.getSlidingWindowValue()).toBe('1w');

      // Click on the disabled date input (this should clear sliding window)
      await sidebar.clickSinceDateInput();
      await page.waitForTimeout(300);

      // Sliding window should be cleared by the click
      expect(await sidebar.getSlidingWindowValue()).toBe('');
      expect(await sidebar.areDateInputsEnabled()).toBe(true);

      // Now enter a fixed date
      await sidebar.setDateRange('2024-06-01', undefined);
      await page.waitForTimeout(300);

      // Verify date is set
      const sinceValue = await sidebar.getSinceDateValue();
      expect(sinceValue).toBe('2024-06-01');

      await page.close();
    });

    test('should clear sliding window when date preset is clicked', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Select sliding window
      await sidebar.selectSlidingWindow('1m');
      expect(await sidebar.getSlidingWindowValue()).toBe('1m');

      // Click a date preset (the click handler will clear sliding window first, then set the date)
      await sidebar.clickDatePreset('today');
      await page.waitForTimeout(500);

      // Sliding window should be cleared
      expect(await sidebar.getSlidingWindowValue()).toBe('');
      expect(await sidebar.areDateInputsEnabled()).toBe(true);

      // Verify the preset date was applied
      const sinceValue = await sidebar.getSinceDateValue();
      const today = new Date().toISOString().split('T')[0];
      expect(sinceValue).toBe(today);

      await page.close();
    });

    test('should show calculated dates in query preview for sliding window', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('test');
      await sidebar.selectSlidingWindow('1w');
      await page.waitForTimeout(300);

      const preview = await sidebar.getQueryPreview();

      // Should contain today's date
      const today = new Date().toISOString().split('T')[0];
      expect(preview).toContain(`until:${today}`);

      // Should contain a since date (7 days ago)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const expectedSince = weekAgo.toISOString().split('T')[0];
      expect(preview).toContain(`since:${expectedSince}`);

      await page.close();
    });

    test('should reset sliding window when reset button is clicked', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('test');
      await sidebar.selectSlidingWindow('1d');
      expect(await sidebar.getSlidingWindowValue()).toBe('1d');

      await sidebar.clickReset();
      await page.waitForTimeout(300);

      expect(await sidebar.getSlidingWindowValue()).toBe('');
      expect(await sidebar.areDateInputsEnabled()).toBe(true);

      await page.close();
    });

    test('should handle all sliding window options correctly', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('trending');

      // Test 1 day
      await sidebar.selectSlidingWindow('1d');
      let preview = await sidebar.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      // Test 1 week
      await sidebar.selectSlidingWindow('1w');
      preview = await sidebar.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      // Test 1 month
      await sidebar.selectSlidingWindow('1m');
      preview = await sidebar.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      await page.close();
    });
  });

  test.describe('Save and Apply Flow', () => {
    test('should save search with sliding window correctly', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('AI news');
      await sidebar.selectSlidingWindow('1w');

      const searchName = `Sliding Window Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      // Switch to saved tab and verify
      await sidebar.switchTab('saved');
      await page.waitForTimeout(500);

      const searches = await sidebar.getSearchList();
      const searchText = await searches.first().textContent();
      expect(searchText).toContain(searchName);

      await page.close();
    });

    test('should restore sliding window when editing saved search', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Create and save a search with sliding window
      await sidebar.fillKeywords('tech');
      await sidebar.selectSlidingWindow('1m');

      const searchName = `Edit Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      // Edit the search
      await sidebar.editSavedSearch(searchName);
      await page.waitForTimeout(500);

      // Verify sliding window is restored
      expect(await sidebar.getSlidingWindowValue()).toBe('1m');
      expect(await sidebar.areDateInputsDisabled()).toBe(true);

      await page.close();
    });

    test('should update sliding window value when editing', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      // Create search with 1 week
      await sidebar.fillKeywords('updates');
      await sidebar.selectSlidingWindow('1w');

      const searchName = `Update Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      // Edit and change to 1 day
      await sidebar.editSavedSearch(searchName);
      await page.waitForTimeout(500);

      await sidebar.selectSlidingWindow('1d');

      // Update with dialog handler
      page.once('dialog', async dialog => {
        await dialog.accept(searchName);
      });
      await sidebar.clickSave();
      await page.waitForTimeout(500);

      // Verify change persisted
      await sidebar.editSavedSearch(searchName);
      await page.waitForTimeout(500);
      expect(await sidebar.getSlidingWindowValue()).toBe('1d');

      await page.close();
    });
  });

  test.describe('Saved Tab Badge Display', () => {
    test('should show badge for 1 day sliding window', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('daily');
      await sidebar.selectSlidingWindow('1d');

      const searchName = `Daily Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      const badgeText = await sidebar.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('1D');

      await page.close();
    });

    test('should show badge for 1 week sliding window', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('weekly');
      await sidebar.selectSlidingWindow('1w');

      const searchName = `Weekly Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      const badgeText = await sidebar.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('1W');

      await page.close();
    });

    test('should show badge for 1 month sliding window', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('monthly');
      await sidebar.selectSlidingWindow('1m');

      const searchName = `Monthly Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      const badgeText = await sidebar.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('1M');

      await page.close();
    });

    test('should not show badge for searches without sliding window', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('fixed date');
      // Use fixed dates, no sliding window

      const searchName = `Fixed Date Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);

      const hasBadge = await sidebar.hasSlidingWindowBadge(searchName);
      expect(hasBadge).toBe(false);

      await page.close();
    });

    test('should show current calculated dates in saved search query', async ({ context, extensionId: _extensionId }) => {
      const page = await context.newPage();
      const testPageHelper = new TestPageHelpers(page);
      await testPageHelper.navigateToTestPage();
      await page.waitForTimeout(1000);

      const sidebar = new SidebarPage(page);
      await sidebar.waitForInjection(5000);
      await sidebar.ensureVisible();
      await sidebar.switchTab('builder');
      await page.waitForTimeout(1000);

      await sidebar.fillKeywords('current');
      await sidebar.selectSlidingWindow('1w');

      const searchName = `Current Dates Test ${Date.now()}`;
      await sidebar.saveSearch(searchName);
      await page.waitForTimeout(1000); // Wait for save to complete

      await sidebar.switchTab('saved');
      await page.waitForTimeout(1000); // Wait for tab switch and list to load

      // Use getSearchList to get items
      const searches = await sidebar.getSearchList();
      const item = searches.filter({ hasText: 'Current Dates Test' }).first();
      await item.waitFor({ state: 'visible', timeout: 10000 });
      const queryText = await item.locator('.sidebar-item-query').textContent();

      // Should contain today's date
      const today = new Date().toISOString().split('T')[0];
      expect(queryText).toContain(today);

      await page.close();
    });
  });
});
