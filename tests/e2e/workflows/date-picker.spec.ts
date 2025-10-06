import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Workflow: Date Picker Calendar', () => {
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

  test('should show calendar icon on date inputs', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Check that date inputs are visible
    const sinceDate = page.locator('#sidebarSinceDate');
    const untilDate = page.locator('#sidebarUntilDate');

    await expect(sinceDate).toBeVisible();
    await expect(untilDate).toBeVisible();

    // Verify date inputs have type="date"
    await expect(sinceDate).toHaveAttribute('type', 'date');
    await expect(untilDate).toHaveAttribute('type', 'date');

    await page.close();
  });

  test('should allow manual date entry via keyboard', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Set a date manually using setDateRange helper
    await sidebar.setDateRange('2024-01-01', '2024-01-31');
    await page.waitForTimeout(500);

    // Verify the dates are set
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const untilValue = await page.locator('#sidebarUntilDate').inputValue();

    expect(sinceValue).toBe('2024-01-01');
    expect(untilValue).toBe('2024-01-31');

    // Verify dates appear in query preview
    const preview = await sidebar.getQueryPreview();
    expect(preview).toContain('since:2024-01-01');
    expect(preview).toContain('until:2024-01-31');

    await page.close();
  });

  test('should update query preview when dates change', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Initially should have default dates
    let preview = await sidebar.getQueryPreview();
    expect(preview).toContain('since:');
    expect(preview).toContain('until:');

    // Change the dates
    await sidebar.setDateRange('2024-06-01', '2024-06-30');
    await page.waitForTimeout(500);

    // Verify query updates
    preview = await sidebar.getQueryPreview();
    expect(preview).toContain('since:2024-06-01');
    expect(preview).toContain('until:2024-06-30');

    await page.close();
  });

  test('should have default dates set on page load', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Check that default dates are set (week ago to today)
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const untilValue = await page.locator('#sidebarUntilDate').inputValue();

    // Verify dates are not empty
    expect(sinceValue).toBeTruthy();
    expect(untilValue).toBeTruthy();

    // Verify date format
    expect(sinceValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(untilValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify until date is today
    const today = new Date().toISOString().split('T')[0];
    expect(untilValue).toBe(today);

    // Verify since date is approximately a week ago (within a day tolerance)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const expectedSince = weekAgo.toISOString().split('T')[0];

    // Parse dates for comparison
    const sinceDate = new Date(sinceValue);
    const expectedDate = new Date(expectedSince);
    const daysDiff = Math.abs((sinceDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

    expect(daysDiff).toBeLessThan(1); // Within 1 day tolerance

    await page.close();
  });

  test('should clear dates when reset button is clicked', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Change dates
    await sidebar.setDateRange('2020-01-01', '2020-12-31');
    await page.waitForTimeout(500);

    // Verify dates changed
    let sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    let untilValue = await page.locator('#sidebarUntilDate').inputValue();
    expect(sinceValue).toBe('2020-01-01');
    expect(untilValue).toBe('2020-12-31');

    // Reset form
    await sidebar.clickReset();
    await page.waitForTimeout(500);

    // Verify dates are cleared (reset clears all form values)
    sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    untilValue = await page.locator('#sidebarUntilDate').inputValue();

    expect(sinceValue).toBe('');
    expect(untilValue).toBe('');

    await page.close();
  });

  test('should preserve dates when editing a saved search', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    // Create a search with specific dates
    await sidebar.fillKeywords('test dates');
    await page.waitForTimeout(300);
    await sidebar.setDateRange('2024-03-01', '2024-03-31');
    await page.waitForTimeout(500);

    // Verify query preview is populated before saving
    const preview = await sidebar.getQueryPreview();
    expect(preview).toContain('test dates');

    // Save the search using the helper method
    const searchName = `Date Test Search ${Date.now()}`;
    await sidebar.saveSearch(searchName);
    await page.waitForTimeout(1000); // Extra wait for save to complete

    // Switch to saved tab and edit the search
    await sidebar.editSavedSearch(searchName);
    await page.waitForTimeout(500);

    // Verify dates are preserved
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const untilValue = await page.locator('#sidebarUntilDate').inputValue();

    expect(sinceValue).toBe('2024-03-01');
    expect(untilValue).toBe('2024-03-31');

    await page.close();
  });

  test('should allow clearing date values', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Dates should be set by default
    let preview = await sidebar.getQueryPreview();
    expect(preview).toContain('since:');
    expect(preview).toContain('until:');

    // Clear the dates
    await sidebar.setDateRange('', '');
    await page.waitForTimeout(500);

    // Verify dates are cleared
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const untilValue = await page.locator('#sidebarUntilDate').inputValue();

    expect(sinceValue).toBe('');
    expect(untilValue).toBe('');

    // Verify query preview doesn't contain date filters
    preview = await sidebar.getQueryPreview();

    // If there's no keywords, it might say "Enter search criteria"
    // Otherwise it should not contain since/until
    if (!preview.includes('Enter search criteria')) {
      expect(preview).not.toContain('since:');
      expect(preview).not.toContain('until:');
    }

    await page.close();
  });

  test('should work with date presets after manual date entry', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Manually set dates
    await sidebar.setDateRange('2020-01-01', '2020-12-31');
    await page.waitForTimeout(500);

    // Click a date preset
    await sidebar.clickDatePreset('today');
    await page.waitForTimeout(500);

    // Verify since date updated to today
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const today = new Date().toISOString().split('T')[0];
    expect(sinceValue).toBe(today);

    await page.close();
  });

  test('should maintain date values when switching tabs', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Set specific dates
    await sidebar.setDateRange('2024-05-01', '2024-05-31');
    await page.waitForTimeout(500);

    // Switch to another tab
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);

    // Switch back to builder
    await sidebar.switchTab('builder');
    await page.waitForTimeout(500);

    // Verify dates are still set
    const sinceValue = await page.locator('#sidebarSinceDate').inputValue();
    const untilValue = await page.locator('#sidebarUntilDate').inputValue();

    expect(sinceValue).toBe('2024-05-01');
    expect(untilValue).toBe('2024-05-31');

    await page.close();
  });

  test('should show styled calendar picker indicator', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);

    await xHelper.navigateToExplore();
    await page.waitForTimeout(2000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');

    // Check that the calendar picker indicator is present and visible
    // Note: The indicator is part of the browser's native UI, so we check the input is interactable
    const sinceDate = page.locator('#sidebarSinceDate');

    await expect(sinceDate).toBeVisible();
    await expect(sinceDate).toBeEnabled();

    // Verify we can click on the input (which should trigger calendar in a real browser)
    await sinceDate.click();
    await page.waitForTimeout(300);

    // The input should now be focused
    await expect(sinceDate).toBeFocused();

    await page.close();
  });
});
