import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';

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
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Create initial search
    await popupPage.fillKeywords('test edit');
    await popupPage.setMinFaves(50);
    await popupPage.checkHasVideos();

    // Handle the prompt for search name
    popupPage.page.on('dialog', async dialog => {
      await dialog.accept('Test Search');
    });

    // Save the search
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(500);

    // Wait for save to complete
    await popupPage.page.waitForTimeout(1000);
    await popupPage.page.close();

    // Wait for storage sync
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should show editing banner when edit button is clicked', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify editing banner is visible
    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeVisible();

    // Verify search name is shown in banner
    const editingSearchName = popupPage.page.locator('#editingSearchName');
    await expect(editingSearchName).toHaveText('Test Search');

    // Verify button text changed to "Update Search"
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Update Search');

    await popupPage.page.close();
  });

  test('should populate form with existing search data', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify form fields are populated
    const keywords = await popupPage.page.locator('#keywords').inputValue();
    expect(keywords).toBe('test edit');

    const minFaves = await popupPage.page.locator('#minFaves').inputValue();
    expect(minFaves).toBe('50');

    const hasVideos = await popupPage.page.locator('#hasVideos').isChecked();
    expect(hasVideos).toBe(true);

    // Verify query preview matches
    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('"test edit"');
    expect(preview).toContain('min_faves:50');
    expect(preview).toContain('filter:videos');

    await popupPage.page.close();
  });

  test('should update search when Update Search button is clicked', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Modify the search
    await popupPage.fillKeywords('updated test');
    await popupPage.setMinFaves(100);
    await popupPage.checkHasImages();

    // Handle dialogs in sequence: name prompt, then success alert
    let dialogCount = 0;
    popupPage.page.on('dialog', async dialog => {
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
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Verify editing banner is hidden after update
    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Verify search was updated in saved list
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);

    const savedItem = popupPage.page.locator('.saved-item').filter({ hasText: 'Test Search' });
    await expect(savedItem).toBeVisible();

    const query = savedItem.locator('.saved-item-query');
    const queryText = await query.textContent();
    expect(queryText).toContain('updated test');
    expect(queryText).toContain('min_faves:100');
    expect(queryText).toContain('filter:images');

    await popupPage.page.close();
  });

  test('should update search name and reflect in saved list', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Handle dialogs: name prompt with NEW name, then success alert
    let dialogCount = 0;
    popupPage.page.on('dialog', async dialog => {
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
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Switch to saved tab to verify name change
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);

    // Verify new name appears
    const updatedTitle = popupPage.page.locator('.saved-item-title').filter({ hasText: 'Updated Test Search' });
    await expect(updatedTitle).toBeVisible();

    // Verify old name is gone (check for exact match by looking at all titles)
    const allTitles = await popupPage.page.locator('.saved-item-title').allTextContents();
    // Strip drag handle icon (⋮⋮) from titles for accurate comparison
    const trimmedTitles = allTitles.map(t => t.replace(/⋮⋮\s*/, '').trim());

    expect(trimmedTitles).toContain('Updated Test Search');
    expect(trimmedTitles).not.toContain('Test Search');

    await popupPage.page.close();
  });

  test('should cancel edit mode when Cancel button is clicked', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeVisible();

    // Click Cancel button
    const cancelBtn = popupPage.page.locator('#cancelEditBtn');
    await cancelBtn.click();
    await popupPage.page.waitForTimeout(300);

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    await popupPage.page.close();
  });

  test('should cancel edit mode when Reset button is clicked', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeVisible();

    // Modify some fields
    await popupPage.fillKeywords('modified');

    // Click Reset button
    await popupPage.clickReset();
    await popupPage.page.waitForTimeout(300);

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Verify form is reset
    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('Enter search criteria above');

    await popupPage.page.close();
  });

  test('should cancel edit mode when switching tabs', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify we're in edit mode
    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeVisible();

    // Switch to Saved tab
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(300);

    // Switch back to Builder tab
    await popupPage.switchTab('builder');
    await popupPage.page.waitForTimeout(300);

    // Verify editing banner is hidden
    await expect(editingBanner).toBeHidden();

    // Verify button text reverted to "Save Search"
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    await popupPage.page.close();
  });

  test('should preserve search category when editing', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Verify category select is populated
    const categorySelect = popupPage.page.locator('#searchCategory');
    const selectedCategory = await categorySelect.inputValue();
    expect(selectedCategory).toBeTruthy();

    await popupPage.page.close();
  });

  test('should not create new search when in edit mode', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Get initial count of saved searches
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);
    const initialCount = await popupPage.page.locator('.saved-item').count();

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Modify the search
    await popupPage.fillKeywords('modified content');

    // Handle dialogs in sequence: name prompt, then success alert
    let dialogCount = 0;
    popupPage.page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        await dialog.accept('Test Search'); // Keep existing name
      } else if (dialogCount === 2) {
        await dialog.accept(); // Success alert
      }
    });

    // Click Update Search button
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Check that we still have the same number of searches
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);
    const finalCount = await popupPage.page.locator('.saved-item').count();
    expect(finalCount).toBe(initialCount);

    await popupPage.page.close();
  });

  test('should allow creating new search after updating', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Modify and update the search
    await popupPage.fillKeywords('updated');

    // Handle dialogs for update (name prompt, then success alert)
    let dialogCount = 0;
    popupPage.page.on('dialog', async dialog => {
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
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Verify we're out of edit mode
    const saveBtn = popupPage.page.locator('#saveBtn');
    await expect(saveBtn).toHaveText('Save Search');

    // Now create a new search
    await popupPage.fillKeywords('brand new');
    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Verify both searches exist
    await popupPage.switchTab('saved');
    await popupPage.page.waitForTimeout(500);

    const testSearch = popupPage.page.locator('.saved-item').filter({ hasText: 'Test Search' });
    const newSearch = popupPage.page.locator('.saved-item').filter({ hasText: 'New Search' });

    await expect(testSearch).toBeVisible();
    await expect(newSearch).toBeVisible();

    await popupPage.page.close();
  });

  test('should handle updating search that no longer exists', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    // Click edit button
    await popupPage.editSavedSearch('Test Search');
    await popupPage.page.waitForTimeout(500);

    // Simulate external deletion by opening another popup and deleting
    const popupPage2 = new PopupPage(await context.newPage(), extensionId);
    await popupPage2.open();
    await popupPage2.page.waitForTimeout(1000);

    popupPage2.page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await popupPage2.deleteSavedSearch('Test Search');
    await popupPage2.page.waitForTimeout(1000);
    await popupPage2.page.close();

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to update from first popup
    await popupPage.fillKeywords('trying to update deleted');

    let alertShown = false;
    popupPage.page.on('dialog', async dialog => {
      if (dialog.message().includes('Search not found')) {
        alertShown = true;
      }
      await dialog.accept();
    });

    await popupPage.clickSave();
    await popupPage.page.waitForTimeout(1000);

    // Verify alert was shown and edit mode was cancelled
    expect(alertShown).toBe(true);

    const editingBanner = popupPage.page.locator('#editingBanner');
    await expect(editingBanner).toBeHidden();

    await popupPage.page.close();
  });
});
