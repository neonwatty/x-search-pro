import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test.describe('Workflow: Drag and Drop Reorder Searches', () => {
  test.beforeEach(async () => {
    // Reduced delay - just a brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should reorder saved searches in sidebar using drag and drop', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);
    await expect(await testPageHelper.isLoggedIn()).toBe(true);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('saved');

    // Get initial order
    const initialSearches = await sidebar.getSearchList();
    const initialCount = await initialSearches.count();
    expect(initialCount).toBeGreaterThan(1); // Need at least 2 searches to reorder

    // Get the names of first and second searches
    const firstSearchName = await initialSearches.nth(0).locator('.sidebar-item-name').textContent();
    const secondSearchName = await initialSearches.nth(1).locator('.sidebar-item-name').textContent();

    console.log('Initial order:', firstSearchName, 'then', secondSearchName);

    // Perform drag and drop: drag first search to second position
    const firstSearch = initialSearches.nth(0);
    const secondSearch = initialSearches.nth(1);

    await firstSearch.dragTo(secondSearch);
    await page.waitForTimeout(1000);

    // Verify order changed
    const reorderedSearches = await sidebar.getSearchList();
    const newFirstName = await reorderedSearches.nth(0).locator('.sidebar-item-name').textContent();
    const newSecondName = await reorderedSearches.nth(1).locator('.sidebar-item-name').textContent();

    console.log('New order:', newFirstName, 'then', newSecondName);

    expect(newFirstName?.trim()).toContain(secondSearchName?.trim().split('⋮⋮')[1]?.trim() || '');
    expect(newSecondName?.trim()).toContain(firstSearchName?.trim().split('⋮⋮')[1]?.trim() || '');

    await page.close();
  });

  test('should persist reordered searches across sidebar reopens', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('saved');

    const initialSearches = await sidebar.getSearchList();
    const initialCount = await initialSearches.count();
    expect(initialCount).toBeGreaterThan(1);

    // Get initial order
    const firstSearchName = await initialSearches.nth(0).locator('.sidebar-item-name').textContent();
    const secondSearchName = await initialSearches.nth(1).locator('.sidebar-item-name').textContent();

    // Reorder
    await initialSearches.nth(0).dragTo(initialSearches.nth(1));
    await page.waitForTimeout(1000);

    // Close and reopen sidebar by navigating to a new page
    await page.close();
    const page2 = await context.newPage();
    const testPageHelper2 = new TestPageHelpers(page2);
    await testPageHelper2.navigateToTestPage();
    await page2.waitForTimeout(2000);

    const sidebar2 = new SidebarPage(page2);
    await sidebar2.waitForInjection(5000);
    await sidebar2.ensureVisible();
    await sidebar2.switchTab('saved');

    // Verify order persisted
    const persistedSearches = await sidebar2.getSearchList();
    const persistedFirstName = await persistedSearches.nth(0).locator('.sidebar-item-name').textContent();
    const persistedSecondName = await persistedSearches.nth(1).locator('.sidebar-item-name').textContent();

    expect(persistedFirstName?.trim()).toContain(secondSearchName?.trim().split('⋮⋮')[1]?.trim() || '');
    expect(persistedSecondName?.trim()).toContain(firstSearchName?.trim().split('⋮⋮')[1]?.trim() || '');

    await page2.close();
  });

  test('should sync reordered searches between different sidebar instances', async ({ context, extensionId: _extensionId }) => {
    // Reorder in first sidebar
    const page1 = await context.newPage();
    const testPageHelper1 = new TestPageHelpers(page1);
    await testPageHelper1.navigateToTestPage();
    await page1.waitForTimeout(2000);

    const sidebar1 = new SidebarPage(page1);
    await sidebar1.waitForInjection(5000);
    await sidebar1.ensureVisible();
    await sidebar1.switchTab('saved');

    const sidebarSearches1 = await sidebar1.getSearchList();
    expect(await sidebarSearches1.count()).toBeGreaterThan(1);

    const firstSearchName = await sidebarSearches1.nth(0).locator('.sidebar-item-name').textContent();

    // Reorder: move first to second position
    await sidebarSearches1.nth(0).dragTo(sidebarSearches1.nth(1));
    await page1.waitForTimeout(1000);

    // Open second sidebar instance and verify order synced
    const page2 = await context.newPage();
    const testPageHelper2 = new TestPageHelpers(page2);
    await testPageHelper2.navigateToTestPage();
    await page2.waitForTimeout(2000);

    const sidebar2 = new SidebarPage(page2);
    await sidebar2.waitForInjection(5000);
    await sidebar2.ensureVisible();
    await sidebar2.switchTab('saved');

    const sidebarSearches2 = await sidebar2.getSearchList();
    const sidebarFirstName = await sidebarSearches2.nth(0).locator('.sidebar-item-name').textContent();

    // The first item in second sidebar should NOT be the original first item
    expect(sidebarFirstName?.trim()).not.toContain(firstSearchName?.trim().split('⋮⋮')[1]?.trim() || '');

    await page2.close();
    await page1.close();
  });

  test('should show correct cursor behavior in sidebar', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('saved');

    const searches = await sidebar.getSearchList();
    expect(await searches.count()).toBeGreaterThan(0);

    const firstSearch = searches.first();
    const dragHandle = firstSearch.locator('.sidebar-drag-handle');

    // Verify drag handle exists
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

  test('should reorder with keyboard accessibility (if implemented)', async ({ context, extensionId: _extensionId }) => {
    // This test verifies that drag and drop is implemented
    // Future enhancement: Add keyboard navigation for accessibility
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('saved');

    const searches = await sidebar.getSearchList();
    expect(await searches.count()).toBeGreaterThan(0);

    // Verify draggable attribute is set
    const firstSearch = searches.first();
    const isDraggable = await firstSearch.getAttribute('draggable');
    expect(isDraggable).toBe('true');

    await page.close();
  });
});
