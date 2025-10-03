import { test, expect } from '../../fixtures/extension';

test.describe('Settings Management', () => {
  test('should toggle sidebar visibility setting', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();

    await expect(page.locator('.settings-section').first().locator('h3')).toHaveText('Sidebar Settings');

    const checkbox = page.locator('#sidebarPinned');
    const initialState = await checkbox.isChecked();

    await page.locator('.toggle-label').click();
    await page.waitForTimeout(200);

    const newState = await checkbox.isChecked();
    expect(newState).toBe(!initialState);

    await page.locator('.toggle-label').click();
    await page.waitForTimeout(200);

    const finalState = await checkbox.isChecked();
    expect(finalState).toBe(initialState);
  });

  test('should persist sidebar visibility setting', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();

    const checkbox = page.locator('#sidebarPinned');
    await page.locator('.toggle-label').click();
    await page.waitForTimeout(200);

    const savedState = await checkbox.isChecked();

    await page.close();
    const newPage = await page.context().newPage();
    await newPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const newSettingsTab = newPage.locator('[data-tab="settings"]');
    await newSettingsTab.click();

    const newCheckbox = newPage.locator('#sidebarPinned');
    const loadedState = await newCheckbox.isChecked();

    expect(loadedState).toBe(savedState);
    await newPage.close();
  });

  test('should show settings info message', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();

    const infoMessage = page.locator('.settings-section').first().locator('.setting-info p');
    await expect(infoMessage).toContainText('toggle the sidebar');
    await expect(infoMessage).toBeVisible();
  });

  test('should display toggle switch with correct styling', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();

    const toggleSwitch = page.locator('.toggle-switch');
    await expect(toggleSwitch).toBeVisible();

    const toggleText = page.locator('.toggle-text strong');
    await expect(toggleText).toHaveText('Show Sidebar');

    const toggleDescription = page.locator('.toggle-text small');
    await expect(toggleDescription).toContainText('Display saved searches sidebar');
  });
});