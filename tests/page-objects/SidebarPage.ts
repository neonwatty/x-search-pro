import { Page, expect } from '@playwright/test';

export class SidebarPage {
  constructor(private page: Page) {}

  async waitForInjection(timeout = 5000) {
    const sidebarToggle = this.page.locator('#sidebarToggle');
    await expect(sidebarToggle).toBeVisible({ timeout });
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
    // Return the sliding window badge (now uses same format for both expanded and collapsed)
    return searchItem.locator('.sidebar-sliding-window-badge');
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
}