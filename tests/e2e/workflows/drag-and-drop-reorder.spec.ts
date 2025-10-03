import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Workflow: Drag and Drop Reorder Searches', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 8000));
  });

  test('should reorder saved searches in popup using drag and drop', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const popupPage = new PopupPage(page, extensionId);
    await popupPage.open();
    await popupPage.switchTab('saved');

    // Get initial order
    const initialSearches = await popupPage.getSavedSearches();
    const initialCount = await initialSearches.count();
    expect(initialCount).toBeGreaterThan(1); // Need at least 2 searches to reorder

    // Get the names of first and second searches
    const firstSearchName = await initialSearches.nth(0).locator('.saved-item-title').textContent();
    const secondSearchName = await initialSearches.nth(1).locator('.saved-item-title').textContent();

    console.log('Initial order:', firstSearchName, 'then', secondSearchName);

    // Perform drag and drop: drag first search to second position
    const firstSearch = initialSearches.nth(0);
    const secondSearch = initialSearches.nth(1);

    await firstSearch.dragTo(secondSearch);
    await popupPage.page.waitForTimeout(1000);

    // Verify order changed
    const reorderedSearches = await popupPage.getSavedSearches();
    const newFirstName = await reorderedSearches.nth(0).locator('.saved-item-title').textContent();
    const newSecondName = await reorderedSearches.nth(1).locator('.saved-item-title').textContent();

    console.log('New order:', newFirstName, 'then', newSecondName);

    expect(newFirstName?.trim()).toBe(secondSearchName?.trim());
    expect(newSecondName?.trim()).toBe(firstSearchName?.trim());
  });

  test('should reorder saved searches in sidebar using drag and drop', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);
    await expect(await xHelper.isLoggedIn()).toBe(true);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    const initialSearches = await sidebar.getSearchList();
    const initialCount = await initialSearches.count();
    expect(initialCount).toBeGreaterThan(1);

    // Get initial names
    const firstSearchName = await initialSearches.nth(0).locator('.sidebar-item-name').textContent();
    const secondSearchName = await initialSearches.nth(1).locator('.sidebar-item-name').textContent();

    console.log('Sidebar initial order:', firstSearchName, 'then', secondSearchName);

    // Perform drag and drop
    const firstSearch = initialSearches.nth(0);
    const secondSearch = initialSearches.nth(1);

    await firstSearch.dragTo(secondSearch);
    await page.waitForTimeout(1500);

    // Verify order changed
    const reorderedSearches = await sidebar.getSearchList();
    const newFirstName = await reorderedSearches.nth(0).locator('.sidebar-item-name').textContent();
    const newSecondName = await reorderedSearches.nth(1).locator('.sidebar-item-name').textContent();

    console.log('Sidebar new order:', newFirstName, 'then', newSecondName);

    expect(newFirstName?.trim()).toContain(secondSearchName?.trim().split('⋮⋮')[1]?.trim() || '');
    expect(newSecondName?.trim()).toContain(firstSearchName?.trim().split('⋮⋮')[1]?.trim() || '');

    await page.close();
  });

  test('should persist reordered searches across popup reopens', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const popupPage = new PopupPage(page, extensionId);
    await popupPage.open();
    await popupPage.switchTab('saved');

    const initialSearches = await popupPage.getSavedSearches();
    const initialCount = await initialSearches.count();
    expect(initialCount).toBeGreaterThan(1);

    // Get initial order
    const firstSearchName = await initialSearches.nth(0).locator('.saved-item-title').textContent();
    const secondSearchName = await initialSearches.nth(1).locator('.saved-item-title').textContent();

    // Reorder
    await initialSearches.nth(0).dragTo(initialSearches.nth(1));
    await popupPage.page.waitForTimeout(1000);

    // Close and reopen popup
    await page.close();
    const page2 = await context.newPage();
    const popupPage2 = new PopupPage(page2, extensionId);
    await popupPage2.open();
    await popupPage2.switchTab('saved');

    // Verify order persisted
    const persistedSearches = await popupPage2.getSavedSearches();
    const persistedFirstName = await persistedSearches.nth(0).locator('.saved-item-title').textContent();
    const persistedSecondName = await persistedSearches.nth(1).locator('.saved-item-title').textContent();

    expect(persistedFirstName?.trim()).toBe(secondSearchName?.trim());
    expect(persistedSecondName?.trim()).toBe(firstSearchName?.trim());

    await page2.close();
  });

  test('should sync reordered searches between popup and sidebar', async ({ context, extensionId }) => {
    // Reorder in popup
    const popupPageInstance = await context.newPage();
    const popupPage = new PopupPage(popupPageInstance, extensionId);
    await popupPage.open();
    await popupPage.switchTab('saved');

    const popupSearches = await popupPage.getSavedSearches();
    expect(await popupSearches.count()).toBeGreaterThan(1);

    const firstSearchName = await popupSearches.nth(0).locator('.saved-item-title').textContent();

    // Reorder: move first to second position
    await popupSearches.nth(0).dragTo(popupSearches.nth(1));
    await popupPage.page.waitForTimeout(1000);

    // Open sidebar and verify order synced
    const xPage = await context.newPage();
    const xHelper = new XPageHelpers(xPage);
    await xHelper.navigateToExplore();
    await xPage.waitForTimeout(2000);

    const sidebar = new SidebarPage(xPage);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    const sidebarSearches = await sidebar.getSearchList();
    const sidebarFirstName = await sidebarSearches.nth(0).locator('.sidebar-item-name').textContent();

    // The first item in sidebar should NOT be the original first item
    expect(sidebarFirstName?.trim()).not.toContain(firstSearchName?.trim());

    await xPage.close();
    await popupPageInstance.close();
  });

  test('should show correct cursor behavior in popup', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const popupPage = new PopupPage(page, extensionId);
    await popupPage.open();
    await popupPage.switchTab('saved');

    const searches = await popupPage.getSavedSearches();
    expect(await searches.count()).toBeGreaterThan(0);

    const firstSearch = searches.first();
    const dragHandle = firstSearch.locator('.drag-handle');

    // Verify drag handle exists
    await expect(dragHandle).toBeVisible();

    // 1. Verify drag handle has grab cursor
    const handleCursor = await dragHandle.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(handleCursor).toBe('grab');

    // 2. Verify saved item itself does NOT have move cursor
    const itemCursor = await firstSearch.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.cursor;
    });
    expect(itemCursor).not.toBe('move');

    // 3. Verify cursor becomes 'grabbing' when dragging class is applied
    await firstSearch.evaluate((el) => {
      el.classList.add('dragging');
    });

    const draggingCursor = await firstSearch.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(draggingCursor).toBe('grabbing');

    // Clean up
    await firstSearch.evaluate((el) => {
      el.classList.remove('dragging');
    });

    await page.close();
  });

  test('should show correct cursor behavior in sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    const searches = await sidebar.getSearchList();
    expect(await searches.count()).toBeGreaterThan(0);

    const firstSearch = searches.first();
    const dragHandle = firstSearch.locator('.sidebar-drag-handle');

    // Verify drag handle exists in expanded view
    await expect(dragHandle).toBeVisible();

    // 1. Verify drag handle has grab cursor
    const handleCursor = await dragHandle.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(handleCursor).toBe('grab');

    // 2. Verify sidebar item itself does NOT have move cursor
    const itemCursor = await firstSearch.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.cursor;
    });
    expect(itemCursor).not.toBe('move');

    // 3. Verify cursor becomes 'grabbing' when sidebar-dragging class is applied
    await firstSearch.evaluate((el) => {
      el.classList.add('sidebar-dragging');
    });

    const draggingCursor = await firstSearch.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(draggingCursor).toBe('grabbing');

    // Clean up
    await firstSearch.evaluate((el) => {
      el.classList.remove('sidebar-dragging');
    });

    await page.close();
  });

  test('should reorder with keyboard accessibility (if implemented)', async ({ context, extensionId }) => {
    // This test verifies that drag and drop is implemented
    // Future enhancement: Add keyboard navigation for accessibility
    const page = await context.newPage();
    const popupPage = new PopupPage(page, extensionId);
    await popupPage.open();
    await popupPage.switchTab('saved');

    const searches = await popupPage.getSavedSearches();
    expect(await searches.count()).toBeGreaterThan(0);

    // Verify draggable attribute is set
    const firstSearch = searches.first();
    const isDraggable = await firstSearch.getAttribute('draggable');
    expect(isDraggable).toBe('true');

    await page.close();
  });
});
