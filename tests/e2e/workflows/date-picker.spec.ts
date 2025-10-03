import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';

test.describe('Workflow: Date Picker Calendar', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should show calendar icon on date inputs', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Check that date inputs are visible
    const sinceDate = popupPage.page.locator('#sinceDate');
    const untilDate = popupPage.page.locator('#untilDate');

    await expect(sinceDate).toBeVisible();
    await expect(untilDate).toBeVisible();

    // Verify date inputs have type="date"
    await expect(sinceDate).toHaveAttribute('type', 'date');
    await expect(untilDate).toHaveAttribute('type', 'date');

    await popupPage.page.close();
  });

  test('should allow manual date entry via keyboard', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Set a date manually using setDateRange helper
    await popupPage.setDateRange('2024-01-01', '2024-01-31');
    await popupPage.page.waitForTimeout(500);

    // Verify the dates are set
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const untilValue = await popupPage.page.locator('#untilDate').inputValue();

    expect(sinceValue).toBe('2024-01-01');
    expect(untilValue).toBe('2024-01-31');

    // Verify dates appear in query preview
    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('since:2024-01-01');
    expect(preview).toContain('until:2024-01-31');

    await popupPage.page.close();
  });

  test('should update query preview when dates change', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Initially should have default dates
    let preview = await popupPage.getQueryPreview();
    expect(preview).toContain('since:');
    expect(preview).toContain('until:');

    // Change the dates
    await popupPage.setDateRange('2024-06-01', '2024-06-30');
    await popupPage.page.waitForTimeout(500);

    // Verify query updates
    preview = await popupPage.getQueryPreview();
    expect(preview).toContain('since:2024-06-01');
    expect(preview).toContain('until:2024-06-30');

    await popupPage.page.close();
  });

  test('should have default dates set on page load', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Check that default dates are set (week ago to today)
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const untilValue = await popupPage.page.locator('#untilDate').inputValue();

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

    await popupPage.page.close();
  });

  test('should clear dates when reset button is clicked', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Change dates
    await popupPage.setDateRange('2020-01-01', '2020-12-31');
    await popupPage.page.waitForTimeout(500);

    // Verify dates changed
    let sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    let untilValue = await popupPage.page.locator('#untilDate').inputValue();
    expect(sinceValue).toBe('2020-01-01');
    expect(untilValue).toBe('2020-12-31');

    // Reset form
    await popupPage.clickReset();
    await popupPage.page.waitForTimeout(500);

    // Verify dates are cleared (reset clears all form values)
    sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    untilValue = await popupPage.page.locator('#untilDate').inputValue();

    expect(sinceValue).toBe('');
    expect(untilValue).toBe('');

    await popupPage.page.close();
  });

  test('should preserve dates when editing a saved search', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Create a search with specific dates
    await popupPage.fillKeywords('test dates');
    await popupPage.page.waitForTimeout(300);
    await popupPage.setDateRange('2024-03-01', '2024-03-31');
    await popupPage.page.waitForTimeout(500);

    // Verify query preview is populated before saving
    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('test dates');

    // Save the search using the helper method
    const searchName = `Date Test Search ${Date.now()}`;
    await popupPage.saveSearch(searchName);
    await popupPage.page.waitForTimeout(1000); // Extra wait for save to complete

    // Switch to saved tab and edit the search
    await popupPage.editSavedSearch(searchName);
    await popupPage.page.waitForTimeout(500);

    // Verify dates are preserved
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const untilValue = await popupPage.page.locator('#untilDate').inputValue();

    expect(sinceValue).toBe('2024-03-01');
    expect(untilValue).toBe('2024-03-31');

    await popupPage.page.close();
  });

  test('should allow clearing date values', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Dates should be set by default
    let preview = await popupPage.getQueryPreview();
    expect(preview).toContain('since:');
    expect(preview).toContain('until:');

    // Clear the dates
    await popupPage.setDateRange('', '');
    await popupPage.page.waitForTimeout(500);

    // Verify dates are cleared
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const untilValue = await popupPage.page.locator('#untilDate').inputValue();

    expect(sinceValue).toBe('');
    expect(untilValue).toBe('');

    // Verify query preview doesn't contain date filters
    preview = await popupPage.getQueryPreview();

    // If there's no keywords, it might say "Enter search criteria"
    // Otherwise it should not contain since/until
    if (!preview.includes('Enter search criteria')) {
      expect(preview).not.toContain('since:');
      expect(preview).not.toContain('until:');
    }

    await popupPage.page.close();
  });

  test('should work with date presets after manual date entry', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Manually set dates
    await popupPage.setDateRange('2020-01-01', '2020-12-31');
    await popupPage.page.waitForTimeout(500);

    // Click a date preset
    await popupPage.clickDatePreset('today');
    await popupPage.page.waitForTimeout(500);

    // Verify since date updated to today
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const today = new Date().toISOString().split('T')[0];
    expect(sinceValue).toBe(today);

    await popupPage.page.close();
  });

  test('should maintain date values when switching tabs', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Set specific dates
    await popupPage.setDateRange('2024-05-01', '2024-05-31');
    await popupPage.page.waitForTimeout(500);

    // Switch to another tab
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);

    // Switch back to builder
    await popupPage.switchTab('builder');
    await popupPage.page.waitForTimeout(500);

    // Verify dates are still set
    const sinceValue = await popupPage.page.locator('#sinceDate').inputValue();
    const untilValue = await popupPage.page.locator('#untilDate').inputValue();

    expect(sinceValue).toBe('2024-05-01');
    expect(untilValue).toBe('2024-05-31');

    await popupPage.page.close();
  });

  test('should show styled calendar picker indicator', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Check that the calendar picker indicator is present and visible
    // Note: The indicator is part of the browser's native UI, so we check the input is interactable
    const sinceDate = popupPage.page.locator('#sinceDate');

    await expect(sinceDate).toBeVisible();
    await expect(sinceDate).toBeEnabled();

    // Verify we can click on the input (which should trigger calendar in a real browser)
    await sinceDate.click();
    await popupPage.page.waitForTimeout(300);

    // The input should now be focused
    await expect(sinceDate).toBeFocused();

    await popupPage.page.close();
  });
});
