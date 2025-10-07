import { Page, expect } from '@playwright/test';

export class SidebarPage {
  constructor(private page: Page) {}

  async waitForInjection(timeout = 15000) {
    const sidebarToggle = this.page.locator('#sidebarToggle');

    try {
      // First attempt: wait for sidebar to appear
      await expect(sidebarToggle).toBeVisible({ timeout });
    } catch (error) {
      // Retry: reload page and wait again
      console.log('Sidebar not found, reloading page and retrying...');
      await this.page.reload({ waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);

      // Second attempt with full timeout
      await expect(sidebarToggle).toBeVisible({ timeout });
    }
  }

  async toggle() {
    const sidebarToggle = this.page.locator('#sidebarToggle');
    await sidebarToggle.click();

    await this.page.waitForFunction(
      () => {
        const panel = document.getElementById('sidebarPanel');
        return panel !== null;
      },
      { timeout: 3000 }
    );

    await this.page.waitForTimeout(500);
  }

  async ensureVisible() {
    const isCurrentlyVisible = await this.isVisible();
    if (!isCurrentlyVisible) {
      await this.toggle();
    }

    // Also ensure sidebar is expanded (not collapsed) so tabs are visible
    const isCollapsed = await this.isSidebarCollapsed();
    if (isCollapsed) {
      await this.expandSidebar();
    }
  }

  async isVisible(): Promise<boolean> {
    const sidebarPanel = this.page.locator('#sidebarPanel');
    return await sidebarPanel.evaluate(el => el.classList.contains('visible'));
  }

  async close() {
    // Use toggle to hide the sidebar (close button removed)
    await this.toggle();
  }

  async getSearchList() {
    return this.page.locator('.sidebar-search-item');
  }

  async clickSearch(name: string) {
    const searchItem = this.page.locator(`.sidebar-search-item:has-text("${name}")`);
    await searchItem.click();
  }

  async filterSearches(text: string) {
    const filterInput = this.page.locator('#sidebarSearchFilter');
    await filterInput.fill(text);
  }

  async verifySearchExists(name: string) {
    const searchItem = this.page.locator(`.sidebar-search-item:has-text("${name}")`);
    await expect(searchItem).toBeVisible();
  }

  async getSearchCount(): Promise<number> {
    const items = await this.getSearchList();
    return await items.count();
  }

  // Sliding Window helper methods
  async getSlidingWindowBadge(searchName: string) {
    const searchItem = this.page.locator(`.sidebar-search-item`).filter({ hasText: searchName }).first();
    // Return the first sliding window badge (there may be two: one for expanded, one for collapsed view)
    return searchItem.locator('.sidebar-sliding-window-badge').first();
  }

  async hasSlidingWindowBadge(searchName: string): Promise<boolean> {
    const badge = await this.getSlidingWindowBadge(searchName);
    return await badge.count() > 0;
  }

  async getSlidingWindowBadgeText(searchName: string): Promise<string | null> {
    const badge = await this.getSlidingWindowBadge(searchName);
    if (await badge.count() === 0) {
      return null;
    }
    return await badge.textContent();
  }

  async collapseSidebar() {
    const collapseBtn = this.page.locator('#collapseSidebar');
    await collapseBtn.click();
    await this.page.waitForTimeout(500);
  }

  async expandSidebar() {
    const collapseBtn = this.page.locator('#collapseSidebar');
    await collapseBtn.click();
    await this.page.waitForTimeout(500);
  }

  async isSidebarCollapsed(): Promise<boolean> {
    const panel = this.page.locator('#sidebarPanel');
    return await panel.evaluate(el => el.classList.contains('collapsed'));
  }

  // Tab switching for sidebar
  async switchTab(tabName: 'builder' | 'saved' | 'categories' | 'about') {
    const tab = this.page.locator(`.sidebar-tab[data-tab="${tabName}"]`);
    // Wait for tab to be visible and clickable (prevents race conditions in parallel tests)
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    // Wait for the tab content to become visible
    await this.page.waitForTimeout(500);
  }

  // Builder form methods (using sidebar-prefixed IDs)
  async fillKeywords(keywords: string) {
    await this.switchTab('builder');
    // Wait for the Builder tab content to be visible
    const keywordsInput = this.page.locator('#sidebarKeywords');
    await keywordsInput.waitFor({ state: 'visible', timeout: 5000 });
    await keywordsInput.fill(keywords);
    await keywordsInput.dispatchEvent('input');
  }

  async setMinFaves(count: number) {
    await this.page.fill('#sidebarMinFaves', count.toString());
  }

  async setMinRetweets(count: number) {
    await this.page.fill('#sidebarMinRetweets', count.toString());
  }

  async setMinReplies(count: number) {
    await this.page.fill('#sidebarMinReplies', count.toString());
  }

  async setDateRange(since?: string, until?: string) {
    if (since !== undefined) {
      await this.page.fill('#sidebarSinceDate', since);
      await this.page.locator('#sidebarSinceDate').dispatchEvent('input');
    }
    if (until !== undefined) {
      await this.page.fill('#sidebarUntilDate', until);
      await this.page.locator('#sidebarUntilDate').dispatchEvent('input');
    }
  }

  async getSinceDateValue(): Promise<string> {
    return await this.page.locator('#sidebarSinceDate').inputValue();
  }

  async getUntilDateValue(): Promise<string> {
    return await this.page.locator('#sidebarUntilDate').inputValue();
  }

  async clickSinceDateInput() {
    await this.page.click('#sidebarSinceDate');
  }

  async clickUntilDateInput() {
    await this.page.click('#sidebarUntilDate');
  }

  async clearDateRange() {
    await this.setDateRange('', '');
  }

  async setFromUser(username: string) {
    await this.page.fill('#sidebarFromUser', username);
  }

  async setToUser(username: string) {
    await this.page.fill('#sidebarToUser', username);
  }

  async setMentionsUser(username: string) {
    await this.page.fill('#sidebarMentionsUser', username);
  }

  async checkBlueVerified() {
    await this.page.check('#sidebarBlueVerified');
  }

  async checkFollows() {
    await this.page.check('#sidebarFollows');
  }

  async checkHasMedia() {
    await this.page.check('#sidebarHasMedia');
  }

  async checkHasImages() {
    await this.page.check('#sidebarHasImages');
  }

  async checkHasVideos() {
    await this.page.check('#sidebarHasVideos');
  }

  async checkHasLinks() {
    await this.page.check('#sidebarHasLinks');
  }

  async checkQuoteOnly() {
    await this.page.check('#sidebarQuoteOnly');
  }

  async setRepliesFilter(option: 'any' | 'exclude' | 'only') {
    await this.page.check(`#builderTab input[name="sidebarReplies"][value="${option}"]`);
  }

  async setRetweetsFilter(option: 'any' | 'exclude' | 'only') {
    await this.page.check(`#builderTab input[name="sidebarRetweets"][value="${option}"]`);
  }

  async selectLanguage(lang: string) {
    await this.toggleSection('Language');
    await this.page.waitForTimeout(500);
    await this.page.selectOption('#sidebarLang', lang);
  }

  async getQueryPreview(): Promise<string> {
    const preview = this.page.locator('#sidebarQueryPreview');
    return await preview.textContent() || '';
  }

  async clickSave() {
    await this.page.click('#sidebarSaveBtn');
  }

  async clickReset() {
    await this.page.click('#sidebarResetBtn');
  }

  async toggleSection(sectionName: string) {
    const section = this.page.locator(`#builderTab .form-section:has-text("${sectionName}")`);
    const header = section.locator('.section-header');
    await header.click();
  }

  async editSavedSearch(name: string) {
    await this.switchTab('saved');
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector('.sidebar-search-item', { timeout: 10000 });
    const item = this.page.locator('.sidebar-search-item').filter({ hasText: name }).first();
    await item.waitFor({ state: 'visible', timeout: 10000 });
    await item.locator('.sidebar-edit-btn').click();

    // Wait for Builder tab to become active after edit click
    // The edit button triggers switchSidebarTab('builder') which has CSS transitions
    await this.page.waitForTimeout(800);

    // Wait for Builder tab content to be visible
    const builderTab = this.page.locator('#builderTab');
    await builderTab.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for form fields to be interactive
    const keywordsInput = this.page.locator('#sidebarKeywords');
    await keywordsInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  async deleteSavedSearch(name: string) {
    await this.switchTab('saved');
    const item = this.page.locator(`.sidebar-search-item:has-text("${name}")`);
    await item.locator('.sidebar-delete-btn').click();
  }

  async isEditingBannerVisible(): Promise<boolean> {
    const banner = this.page.locator('#sidebarEditingBanner');
    return await banner.isVisible();
  }

  async getEditingSearchName(): Promise<string> {
    const nameElement = this.page.locator('#sidebarEditingSearchName');
    return await nameElement.textContent() || '';
  }

  async clickCancelEdit() {
    await this.page.click('#sidebarCancelEditBtn');
  }

  async getSaveButtonText(): Promise<string> {
    const saveBtn = this.page.locator('#sidebarSaveBtn');
    return await saveBtn.textContent() || '';
  }

  async isInEditMode(): Promise<boolean> {
    return await this.isEditingBannerVisible();
  }

  async saveSearch(name: string, category?: string) {
    if (category) {
      await this.page.selectOption('#sidebarSearchCategory', category);
      await this.page.waitForTimeout(200);
    }

    const dialogHandler = async (dialog: any) => {
      await dialog.accept(name);
    };

    this.page.on('dialog', dialogHandler);

    try {
      await this.clickSave();
      await this.page.waitForTimeout(1000);
    } finally {
      this.page.off('dialog', dialogHandler);
    }

    await this.page.waitForTimeout(1000);
  }

  async createCategory(name: string, color?: string) {
    await this.switchTab('categories');
    await this.page.fill('#sidebarNewCategoryName', name);

    if (color) {
      await this.page.fill('#sidebarNewCategoryColor', color);
    }

    await this.page.click('#sidebarAddCategoryBtn');
    await this.page.waitForTimeout(500);
  }

  // Sliding Window helper methods
  async selectSlidingWindow(option: '' | '1d' | '1w' | '1m') {
    await this.page.selectOption('#sidebarSlidingWindow', option);
    await this.page.waitForTimeout(200);
  }

  async getSlidingWindowValue(): Promise<string> {
    return await this.page.locator('#sidebarSlidingWindow').inputValue();
  }

  async isSlidingWindowInfoVisible(): Promise<boolean> {
    const info = this.page.locator('#sidebarSlidingWindowInfo');
    return await info.isVisible();
  }

  async areDateInputsDisabled(): Promise<boolean> {
    const sinceReadOnly = await this.page.locator('#sidebarSinceDate').evaluate(el => (el as HTMLInputElement).readOnly);
    const untilReadOnly = await this.page.locator('#sidebarUntilDate').evaluate(el => (el as HTMLInputElement).readOnly);
    return sinceReadOnly && untilReadOnly;
  }

  async areDateInputsEnabled(): Promise<boolean> {
    const disabled = await this.areDateInputsDisabled();
    return !disabled;
  }
}