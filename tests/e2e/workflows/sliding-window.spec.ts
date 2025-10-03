import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';

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
    test('should disable date inputs when sliding window is selected', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Initially date inputs should be enabled
      expect(await popupPage.areDateInputsEnabled()).toBe(true);

      // Select sliding window
      await popupPage.selectSlidingWindow('1w');

      // Date inputs should now be disabled
      expect(await popupPage.areDateInputsDisabled()).toBe(true);

      // Verify visual feedback (opacity)
      const sinceDateOpacity = await popupPage.page.locator('#sinceDate').evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      expect(sinceDateOpacity).toBe('0.5');

      await popupPage.page.close();
    });

    test('should show info message when sliding window is selected', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Initially info should be hidden
      expect(await popupPage.isSlidingWindowInfoVisible()).toBe(false);

      // Select sliding window
      await popupPage.selectSlidingWindow('1d');

      // Info should now be visible
      expect(await popupPage.isSlidingWindowInfoVisible()).toBe(true);

      await popupPage.page.close();
    });

    test('should clear sliding window when fixed date is entered', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Select sliding window first
      await popupPage.selectSlidingWindow('1w');
      expect(await popupPage.getSlidingWindowValue()).toBe('1w');

      // Click on the disabled date input (this should clear sliding window)
      await popupPage.clickSinceDateInput();
      await popupPage.page.waitForTimeout(300);

      // Sliding window should be cleared by the click
      expect(await popupPage.getSlidingWindowValue()).toBe('');
      expect(await popupPage.areDateInputsEnabled()).toBe(true);

      // Now enter a fixed date
      await popupPage.setDateRange('2024-06-01', undefined);
      await popupPage.page.waitForTimeout(300);

      // Verify date is set
      const sinceValue = await popupPage.getSinceDateValue();
      expect(sinceValue).toBe('2024-06-01');

      await popupPage.page.close();
    });

    test('should clear sliding window when date preset is clicked', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Select sliding window
      await popupPage.selectSlidingWindow('1m');
      expect(await popupPage.getSlidingWindowValue()).toBe('1m');

      // Click a date preset (the click handler will clear sliding window first, then set the date)
      await popupPage.clickDatePreset('today');
      await popupPage.page.waitForTimeout(500);

      // Sliding window should be cleared
      expect(await popupPage.getSlidingWindowValue()).toBe('');
      expect(await popupPage.areDateInputsEnabled()).toBe(true);

      // Verify the preset date was applied
      const sinceValue = await popupPage.getSinceDateValue();
      const today = new Date().toISOString().split('T')[0];
      expect(sinceValue).toBe(today);

      await popupPage.page.close();
    });

    test('should show calculated dates in query preview for sliding window', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('test');
      await popupPage.selectSlidingWindow('1w');
      await popupPage.page.waitForTimeout(300);

      const preview = await popupPage.getQueryPreview();

      // Should contain today's date
      const today = new Date().toISOString().split('T')[0];
      expect(preview).toContain(`until:${today}`);

      // Should contain a since date (7 days ago)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const expectedSince = weekAgo.toISOString().split('T')[0];
      expect(preview).toContain(`since:${expectedSince}`);

      await popupPage.page.close();
    });

    test('should reset sliding window when reset button is clicked', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('test');
      await popupPage.selectSlidingWindow('1d');
      expect(await popupPage.getSlidingWindowValue()).toBe('1d');

      await popupPage.clickReset();
      await popupPage.page.waitForTimeout(300);

      expect(await popupPage.getSlidingWindowValue()).toBe('');
      expect(await popupPage.areDateInputsEnabled()).toBe(true);

      await popupPage.page.close();
    });

    test('should handle all sliding window options correctly', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('trending');

      // Test 1 day
      await popupPage.selectSlidingWindow('1d');
      let preview = await popupPage.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      // Test 1 week
      await popupPage.selectSlidingWindow('1w');
      preview = await popupPage.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      // Test 1 month
      await popupPage.selectSlidingWindow('1m');
      preview = await popupPage.getQueryPreview();
      expect(preview).toContain('since:');
      expect(preview).toContain('until:');

      await popupPage.page.close();
    });
  });

  test.describe('Save and Apply Flow', () => {
    test('should save search with sliding window correctly', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('AI news');
      await popupPage.selectSlidingWindow('1w');

      const searchName = `Sliding Window Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      // Switch to saved tab and verify
      await popupPage.switchTab('saved');
      await popupPage.page.waitForTimeout(500);

      const searches = await popupPage.getSavedSearches();
      const searchText = await searches.first().textContent();
      expect(searchText).toContain(searchName);

      await popupPage.page.close();
    });

    test('should restore sliding window when editing saved search', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Create and save a search with sliding window
      await popupPage.fillKeywords('tech');
      await popupPage.selectSlidingWindow('1m');

      const searchName = `Edit Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      // Edit the search
      await popupPage.editSavedSearch(searchName);
      await popupPage.page.waitForTimeout(500);

      // Verify sliding window is restored
      expect(await popupPage.getSlidingWindowValue()).toBe('1m');
      expect(await popupPage.areDateInputsDisabled()).toBe(true);

      await popupPage.page.close();
    });

    test('should update sliding window value when editing', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      // Create search with 1 week
      await popupPage.fillKeywords('updates');
      await popupPage.selectSlidingWindow('1w');

      const searchName = `Update Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      // Edit and change to 1 day
      await popupPage.editSavedSearch(searchName);
      await popupPage.page.waitForTimeout(500);

      await popupPage.selectSlidingWindow('1d');

      // Update with dialog handler
      popupPage.page.once('dialog', async dialog => {
        await dialog.accept(searchName);
      });
      await popupPage.clickSave();
      await popupPage.page.waitForTimeout(500);

      // Verify change persisted
      await popupPage.editSavedSearch(searchName);
      await popupPage.page.waitForTimeout(500);
      expect(await popupPage.getSlidingWindowValue()).toBe('1d');

      await popupPage.page.close();
    });
  });

  test.describe('Saved Tab Badge Display', () => {
    test('should show badge for 1 day sliding window', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('daily');
      await popupPage.selectSlidingWindow('1d');

      const searchName = `Daily Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      const badgeText = await popupPage.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('Last 1 Day');

      await popupPage.page.close();
    });

    test('should show badge for 1 week sliding window', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('weekly');
      await popupPage.selectSlidingWindow('1w');

      const searchName = `Weekly Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      const badgeText = await popupPage.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('Last 1 Week');

      await popupPage.page.close();
    });

    test('should show badge for 1 month sliding window', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('monthly');
      await popupPage.selectSlidingWindow('1m');

      const searchName = `Monthly Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      const badgeText = await popupPage.getSlidingWindowBadgeText(searchName);
      expect(badgeText).toContain('🕒');
      expect(badgeText).toContain('Last 1 Month');

      await popupPage.page.close();
    });

    test('should not show badge for searches without sliding window', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('fixed date');
      // Use fixed dates, no sliding window

      const searchName = `Fixed Date Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      const hasBadge = await popupPage.hasSlidingWindowBadge(searchName);
      expect(hasBadge).toBe(false);

      await popupPage.page.close();
    });

    test('should show current calculated dates in saved search query', async ({ context, extensionId }) => {
      const popupPage = new PopupPage(await context.newPage(), extensionId);
      await popupPage.open();
      await popupPage.page.waitForTimeout(1000);

      await popupPage.fillKeywords('current');
      await popupPage.selectSlidingWindow('1w');

      const searchName = `Current Dates Test ${Date.now()}`;
      await popupPage.saveSearch(searchName);

      await popupPage.switchTab('saved');
      const item = popupPage.page.locator(`.saved-item`).filter({ hasText: searchName }).first();
      const queryText = await item.locator('.saved-item-query').textContent();

      // Should contain today's date
      const today = new Date().toISOString().split('T')[0];
      expect(queryText).toContain(today);

      await popupPage.page.close();
    });
  });
});
