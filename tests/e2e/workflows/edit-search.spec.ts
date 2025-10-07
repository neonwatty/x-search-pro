import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test.describe('Workflow: Edit Saved Search', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Clear existing searches first
    const clearPage = await context.newPage();
    await clearPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await clearPage.evaluate(() => {
      return chrome.storage.sync.clear();
    });
    await clearPage.close();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a test search to edit
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await sidebar.switchTab('builder');
    await page.waitForTimeout(1000);

    // Create initial search
    await sidebar.fillKeywords('test edit');
    await sidebar.setMinFaves(50);
    await sidebar.checkHasVideos();

    // Handle the prompt for search name
    page.on('dialog', async dialog => {
      await dialog.accept('Test Search');
    });

    // Save the search
    await sidebar.clickSave();
    await page.waitForTimeout(500);

    // Wait for save to complete
    await page.waitForTimeout(1000);
    await page.close();

    // Wait for storage sync
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should show editing banner when edit button is clicked', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify editing banner is visible
    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeVisible();

    // Verify search name is shown in banner
    const editingSearchName = page.locator('#sidebarEditingSearchName');
    await expect(editingSearchName).toHaveText('Test Search');

    // Verify button text changed to "Update Search"
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Update Search');

    await page.close();
  });

  test('should populate form with existing search data', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify form fields are populated
    const keywords = await page.locator('#sidebarKeywords').inputValue();
    expect(keywords).toBe('test edit');

    const minFaves = await page.locator('#sidebarMinFaves').inputValue();
    expect(minFaves).toBe('50');

    const hasVideos = await page.locator('#sidebarHasVideos').isChecked();
    expect(hasVideos).toBe(true);

    // Verify query preview matches
    const preview = await sidebar.getQueryPreview();
    expect(preview).toContain('"test edit"');
    expect(preview).toContain('min_faves:50');
    expect(preview).toContain('filter:videos');

    await page.close();
  });

  test('should update search when Update Search button is clicked', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Modify the search
    await sidebar.fillKeywords('updated test');
    await sidebar.setMinFaves(100);
    await sidebar.checkHasImages();

    // Handle dialogs in sequence: name prompt, then success alert
    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        // First dialog: name prompt
        expect(dialog.message()).toContain('Enter a name for this search');
        await dialog.accept('Test Search'); // Keep existing name
      } else if (dialogCount === 2) {
        // Second dialog: success alert
        expect(dialog.message()).toContain('Search updated successfully');
        await dialog.accept();
      }
    });

    // Click Update Search button
    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Verify editing banner is hidden after update
    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Verify search was updated in saved list
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);

    const savedItem = page.locator('.sidebar-search-item').filter({ hasText: 'Test Search' });
    await expect(savedItem).toBeVisible();

    const query = savedItem.locator('.sidebar-item-query');
    await query.waitFor({ state: 'visible', timeout: 10000 });
    const queryText = await query.textContent();
    expect(queryText).toContain('updated test');
    expect(queryText).toContain('min_faves:100');
    expect(queryText).toContain('filter:images');

    await page.close();
  });

  test('should update search name and reflect in saved list', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Handle dialogs: name prompt with NEW name, then success alert
    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        // First dialog: name prompt - change the name
        expect(dialog.message()).toContain('Enter a name for this search');
        await dialog.accept('Updated Test Search');
      } else if (dialogCount === 2) {
        // Second dialog: success alert
        expect(dialog.message()).toContain('Search updated successfully');
        await dialog.accept();
      }
    });

    // Click Update Search button
    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Switch to saved tab to verify name change
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);

    // Verify new name appears
    const updatedTitle = page.locator('.sidebar-item-name').filter({ hasText: 'Updated Test Search' });
    await expect(updatedTitle).toBeVisible();

    // Verify old name is gone (check for exact match by looking at all titles)
    const allTitles = await page.locator('.sidebar-item-name').allTextContents();
    // Strip drag handle icon (⋮⋮) from titles for accurate comparison
    const trimmedTitles = allTitles.map(t => t.replace(/⋮⋮\s*/, '').trim());

    expect(trimmedTitles).toContain('Updated Test Search');
    expect(trimmedTitles).not.toContain('Test Search');

    await page.close();
  });

  test('should cancel edit mode when Cancel button is clicked', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeVisible();

    // Click Cancel button
    const cancelBtn = page.locator('#sidebarCancelEditBtn');
    await cancelBtn.click();
    await page.waitForTimeout(300);

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    await page.close();
  });

  test('should cancel edit mode when Reset button is clicked', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeVisible();

    // Modify some fields
    await sidebar.fillKeywords('modified');

    // Click Reset button
    await sidebar.clickReset();
    await page.waitForTimeout(300);

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Verify form is reset (sidebar builder sets default dates, so check specific fields are cleared)
    const keywords = await page.locator('#sidebarKeywords').inputValue();
    expect(keywords).toBe('');

    const preview = await sidebar.getQueryPreview();
    expect(preview).not.toContain('modified');

    await page.close();
  });

  // TODO: Feature not yet implemented - tab switching doesn't cancel edit mode
  test.skip('should cancel edit mode when switching tabs', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeVisible();

    // Switch to Saved tab
    await sidebar.switchTab('saved');
    await page.waitForTimeout(800);

    // Switch back to Builder tab
    await sidebar.switchTab('builder');
    await page.waitForTimeout(800);

    // Wait for tab content to be fully visible
    const builderTab = page.locator('#builderTab');
    await builderTab.waitFor({ state: 'visible', timeout: 5000 });

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    await page.close();
  });

  test('should preserve search category when editing', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Verify category select is populated
    const categorySelect = page.locator('#sidebarSearchCategory');
    const selectedCategory = await categorySelect.inputValue();
    expect(selectedCategory).toBeTruthy();

    await page.close();
  });

  test('should not create new search when in edit mode', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    // Get initial count of saved searches
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);
    const initialCount = await page.locator('.sidebar-search-item').count();

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Modify the search
    await sidebar.fillKeywords('modified content');

    // Handle dialogs in sequence: name prompt, then success alert
    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        await dialog.accept('Test Search'); // Keep existing name
      } else if (dialogCount === 2) {
        await dialog.accept(); // Success alert
      }
    });

    // Click Update Search button
    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Check that we still have the same number of searches
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);
    const finalCount = await page.locator('.sidebar-search-item').count();
    expect(finalCount).toBe(initialCount);

    await page.close();
  });

  test('should allow creating new search after updating', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Modify and update the search
    await sidebar.fillKeywords('updated');

    // Handle dialogs for update (name prompt, then success alert)
    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        // First dialog: name prompt for update
        await dialog.accept('Test Search');
      } else if (dialogCount === 2) {
        // Second dialog: update success
        await dialog.accept();
      } else {
        // Third dialog: name for new search
        await dialog.accept('New Search');
      }
    });

    // Update the search
    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Verify we're out of edit mode
    const saveBtn = page.locator('#sidebarSaveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Now create a new search
    await sidebar.fillKeywords('brand new');
    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Verify both searches exist
    await sidebar.switchTab('saved');
    await page.waitForTimeout(500);

    const testSearch = page.locator('.sidebar-search-item').filter({ hasText: 'Test Search' });
    const newSearch = page.locator('.sidebar-search-item').filter({ hasText: 'New Search' });

    await expect(testSearch).toBeVisible();
    await expect(newSearch).toBeVisible();

    await page.close();
  });

  test('should handle updating search that no longer exists', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);
    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();
    await page.waitForTimeout(1000);

    // Click edit button
    await sidebar.editSavedSearch('Test Search');
    await page.waitForTimeout(500);

    // Simulate external deletion by opening another sidebar and deleting
    const page2 = await context.newPage();
    const testPageHelper2 = new TestPageHelpers(page2);
    await testPageHelper2.navigateToTestPage();
    await page2.waitForTimeout(1000);

    const sidebar2 = new SidebarPage(page2);
    await sidebar2.waitForInjection(5000);
    await sidebar2.ensureVisible();
    await page2.waitForTimeout(1000);

    page2.on('dialog', async dialog => {
      await dialog.accept();
    });

    await sidebar2.deleteSavedSearch('Test Search');
    await page2.waitForTimeout(1000);
    await page2.close();

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to update from first sidebar
    await sidebar.fillKeywords('trying to update deleted');

    let alertShown = false;
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Search not found')) {
        alertShown = true;
      }
      await dialog.accept();
    });

    await sidebar.clickSave();
    await page.waitForTimeout(1000);

    // Verify alert was shown and edit mode was cancelled
    expect(alertShown).toBe(true);

    const editingBanner = page.locator('#sidebarEditingBanner');
    await expect(editingBanner).toBeHidden();

    await page.close();
  });
});
