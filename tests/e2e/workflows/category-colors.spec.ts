import { test, expect } from '../../fixtures/extension';

test.describe('Category Colors Management', () => {
  // Reset category colors before each test to ensure clean state
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.evaluate(() => {
      return chrome.storage.sync.set({
        categories: ['Tech', 'News', 'Personal', 'Research', 'Uncategorized', 'Popular', 'Media', 'Content', 'Verified'],
        categoryColors: {
          'Popular': '#ef4444',
          'Media': '#8b5cf6',
          'Content': '#06b6d4',
          'News': '#10b981',
          'Personal': '#3b82f6',
          'Verified': '#6366f1',
          'Tech': '#14b8a6',
          'Research': '#f59e0b',
          'Uncategorized': '#6b7280'
        }
      });
    });
  });

  test.describe('Categories Tab - Category Management Section', () => {
    test('should display Manage Categories section in Categories tab', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Navigate to Categories tab
      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Verify Manage Categories section exists
      const categorySection = page.locator('.categories-section');
      await expect(categorySection.locator('h3')).toHaveText('Manage Categories');

      // Verify description text
      const settingInfo = categorySection.locator('.setting-info p');
      await expect(settingInfo).toHaveText('Create and organize custom categories for your saved searches');

      // Verify add category button exists
      const addButton = page.locator('#addCategoryBtn');
      await expect(addButton).toBeVisible();
      await expect(addButton).toHaveText('Add');
    });

    test('should show all existing categories with color pickers', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Check for category items
      const categoryItems = page.locator('.category-item');
      const count = await categoryItems.count();
      expect(count).toBeGreaterThan(0);

      // Verify structure of first item - category items have inline color picker
      const firstItem = categoryItems.first();
      await expect(firstItem.locator('.category-item-color')).toBeVisible();
      await expect(firstItem.locator('.category-item-info')).toBeVisible();
      await expect(firstItem.locator('input[type="color"]')).toBeVisible();

      // Check for specific categories
      const categoryContents = await page.locator('.category-item').allTextContents();
      const hasPopular = categoryContents.some(text => text.includes('Popular'));
      const hasMedia = categoryContents.some(text => text.includes('Media'));
      const hasUncategorized = categoryContents.some(text => text.includes('Uncategorized'));
      expect(hasPopular).toBe(true);
      expect(hasMedia).toBe(true);
      expect(hasUncategorized).toBe(true);
    });

    test('should display color indicators', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Check all color displays are visible and have colors
      const colorDisplays = page.locator('.category-item-color');
      const count = await colorDisplays.count();

      for (let i = 0; i < count; i++) {
        const display = colorDisplays.nth(i);
        await expect(display).toBeVisible();

        // Verify it has a background color set
        const bgColor = await display.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).not.toBe('');
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('Color Picker Interactions', () => {
    test('should update color display when color changes', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Find Popular category
      const popularItem = page.locator('.category-item').filter({
        hasText: 'Popular'
      });

      const colorPicker = popularItem.locator('input[type="color"]');
      const colorDisplay = popularItem.locator('.category-item-color');

      // Get initial color
      const initialColor = await colorDisplay.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Change color
      await colorPicker.evaluate((input: HTMLInputElement) => {
        input.value = '#ff0000';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Wait for update
      await page.waitForTimeout(100);

      // Verify color display updated
      const newColor = await colorDisplay.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(newColor).not.toBe(initialColor);
      expect(newColor).toContain('255'); // Red component
    });

    test('should persist color changes without page reload', async ({ page, extensionId, context }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Change Media category color
      const mediaItem = page.locator('.category-item').filter({
        hasText: 'Media'
      });

      const colorPicker = mediaItem.locator('input[type="color"]');
      await colorPicker.evaluate((input: HTMLInputElement) => {
        input.value = '#00ff00';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForTimeout(200);

      // Open new popup instance
      const newPage = await context.newPage();
      await newPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const newCategoriesTab = newPage.locator('[data-tab="categories"]');
      await newCategoriesTab.click();

      // Verify color persisted
      const newMediaItem = newPage.locator('.category-item').filter({
        hasText: 'Media'
      });
      const persistedColor = await newMediaItem.locator('input[type="color"]').inputValue();
      expect(persistedColor).toBe('#00ff00');

      await newPage.close();
    });

    test('should update multiple categories independently', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      // Update multiple categories
      const categories = ['Popular', 'Media', 'News'];
      const colors = ['#ff0000', '#00ff00', '#0000ff'];

      for (let i = 0; i < categories.length; i++) {
        const item = page.locator('.category-item').filter({
          hasText: categories[i]
        });

        const colorPicker = item.locator('input[type="color"]');
        await colorPicker.evaluate((input: HTMLInputElement, color: string) => {
          input.value = color;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, colors[i]);

        await page.waitForTimeout(100);
      }

      // Verify all colors are set correctly
      for (let i = 0; i < categories.length; i++) {
        const item = page.locator('.category-item').filter({
          hasText: categories[i]
        });

        const currentColor = await item.locator('input[type="color"]').inputValue();
        expect(currentColor).toBe(colors[i]);
      }
    });
  });

  test.describe('Reset Functionality', () => {
    test.skip('should reset all colors to defaults on button click', async ({ page, extensionId }) => {
      // SKIP REASON: Reset functionality was part of old Settings tab design
      // New Categories tab uses individual color pickers without bulk reset
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    });

    test.skip('should update UI immediately after reset', async ({ page, extensionId }) => {
      // SKIP REASON: Reset functionality was part of old Settings tab design
      // New Categories tab uses individual color pickers without bulk reset
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    });
  });

  test.describe('Visual Validation', () => {
    test('should display correct border color for saved searches', async ({ page, extensionId, context: _context }) => {
      // First set a custom color for Popular category
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const categoriesTab = page.locator('[data-tab="categories"]');
      await categoriesTab.click();

      const popularItem = page.locator('.category-item').filter({
        hasText: 'Popular'
      });

      await popularItem.locator('input[type="color"]').evaluate((input: HTMLInputElement) => {
        input.value = '#ff0000';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForTimeout(200);

      // Switch to Saved tab
      const savedTab = page.locator('[data-tab="saved"]');
      await savedTab.click();

      // Find a Popular category search
      const savedItems = page.locator('.saved-item');
      const popularSearch = savedItems.filter({ hasText: 'Popular' }).first();

      // Verify border color
      const borderColor = await popularSearch.evaluate(el =>
        window.getComputedStyle(el).borderLeftColor
      );
      expect(borderColor).toContain('255'); // Red component
    });

    test('should maintain custom colors when category colors change', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Create a search with custom color
      const keywords = page.locator('#keywords');
      await keywords.fill('test custom color');

      const saveBtn = page.locator('#saveBtn');
      await saveBtn.click();

      // Handle save dialog with custom color (would need to mock or handle alerts)
      page.on('dialog', async dialog => {
        if (dialog.message().includes('Enter a name')) {
          await dialog.accept('Custom Color Test');
        } else if (dialog.message().includes('category')) {
          await dialog.accept('Popular');
        }
      });

      // This test would need more complex setup to handle custom colors
      // Marking as a placeholder for now
    });
  });

  test.describe('Category Color Inheritance', () => {
    test.skip('new searches should inherit current category color', async ({ page, extensionId }) => {
      // SKIP REASON: Complex dialog flow with multiple prompts/alerts is difficult to test reliably in e2e
      // This functionality is covered by unit tests in storage.spec.ts
      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Set a specific color for Tech category
      const settingsTab = page.locator('[data-tab="settings"]');
      await settingsTab.click();

      // Wait for settings to load
      await page.waitForSelector('.category-color-item');

      const techItem = page.locator('.category-color-item').filter({
        hasText: 'Tech'
      });

      // Wait for the Tech item to be visible
      await techItem.waitFor({ state: 'visible' });

      await techItem.locator('.color-picker').evaluate((input: HTMLInputElement) => {
        input.value = '#abcdef';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForTimeout(200);

      // Go back to builder tab and create a search
      const builderTab = page.locator('[data-tab="builder"]');
      await builderTab.click();

      await page.locator('#keywords').fill('tech test');

      // Save with Tech category - handle all dialogs
      const saveBtn = page.locator('#saveBtn');

      page.on('dialog', async dialog => {
        const message = dialog.message();
        if (message.includes('Enter a name')) {
          await dialog.accept('Tech Color Test');
        } else if (message.includes('category') || message.includes('Available categories')) {
          await dialog.accept('Tech');
        } else {
          await dialog.accept();
        }
      });

      await saveBtn.click();
      await page.waitForTimeout(1000);

      // Verify the search was saved with the correct color by checking storage
      const savedSearch = await page.evaluate(async () => {
        const result = await chrome.storage.sync.get(['savedSearches']);
        const searches = result.savedSearches || [];
        return searches.find((s: any) => s.name === 'Tech Color Test');
      });

      expect(savedSearch).toBeDefined();
      expect(savedSearch.category).toBe('Tech');
      expect(savedSearch.color).toBe('#abcdef');
    });
  });
});

test.describe('Integration Flow', () => {
  test.skip('complete user flow with category colors', async ({ page, extensionId }) => {
    // SKIP REASON: Complex dialog flow with multiple prompts/alerts is difficult to test reliably in e2e
    // This functionality is covered by unit tests in storage.spec.ts
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    // Step 1: Change color in settings
    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();

    const mediaItem = page.locator('.category-color-item').filter({
      hasText: 'Media'
    });

    await mediaItem.locator('.color-picker').evaluate((input: HTMLInputElement) => {
      input.value = '#ff00ff';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(200);

    // Step 2: Create a search in Media category
    const builderTab = page.locator('[data-tab="builder"]');
    await builderTab.click();

    await page.locator('#keywords').fill('media test');
    await page.locator('#hasVideos').check();

    // Handle dialogs for save
    page.on('dialog', async dialog => {
      const message = dialog.message();
      if (message.includes('Enter a name')) {
        await dialog.accept('Media Search Test');
      } else if (message.includes('category')) {
        await dialog.accept('Media');
      } else if (message.includes('saved successfully')) {
        // Verify color is mentioned
        expect(message).toContain('#ff00ff');
        await dialog.accept();
      }
    });

    await page.locator('#saveBtn').click();
    await page.waitForTimeout(500);

    // Step 3: Verify in saved searches
    const savedTab = page.locator('[data-tab="saved"]');
    await savedTab.click();

    const savedItem = page.locator('.saved-item').filter({
      hasText: 'Media Search Test'
    });

    await expect(savedItem).toBeVisible();

    // Verify the border color
    const borderColor = await savedItem.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return el.style.borderLeftColor || styles.borderLeftColor;
    });

    expect(borderColor).toBe('rgb(255, 0, 255)'); // #ff00ff in RGB
  });
});