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
  }

  async isVisible(): Promise<boolean> {
    const sidebarPanel = this.page.locator('#sidebarPanel');
    return await sidebarPanel.evaluate(el => el.classList.contains('visible'));
  }

  async close() {
    const closeBtn = this.page.locator('#closeSidebar');
    await closeBtn.click();
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
}