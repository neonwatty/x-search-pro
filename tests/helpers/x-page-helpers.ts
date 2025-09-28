import { Page, expect } from '@playwright/test';

export class XPageHelpers {
  constructor(private page: Page) {}

  async waitForXLoaded() {
    await this.page.waitForLoadState('load', { timeout: 60000 });

    const accountSwitcher = this.page.locator('[data-testid="SideNav_AccountSwitcher_Button"]');
    await expect(accountSwitcher).toBeVisible({ timeout: 20000 });
  }

  async navigateToHome() {
    await this.page.goto('https://x.com/home');
    await this.waitForXLoaded();
  }

  async navigateToExplore() {
    await this.page.goto('https://x.com/explore');
    await this.waitForXLoaded();
  }

  async navigateToSearch() {
    await this.page.goto('https://x.com/explore');
    await this.waitForXLoaded();
  }

  async getSearchInput() {
    const searchInput = this.page
      .locator('input[data-testid="SearchBox_Search_Input"]')
      .or(this.page.locator('input[aria-label="Search query"]'))
      .or(this.page.locator('input[placeholder*="Search"]'));

    return searchInput.first();
  }

  async performSearch(query: string) {
    const searchInput = await this.getSearchInput();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill(query);
    await searchInput.press('Enter');

    await this.page.waitForURL(/.*\/search\?q=.*/, { timeout: 15000 });
  }

  async verifySearchApplied(expectedQuery: string) {
    const searchInput = await this.getSearchInput();
    await expect(searchInput).toHaveValue(expectedQuery, { timeout: 10000 });
  }

  async verifyOnSearchPage() {
    await expect(this.page).toHaveURL(/.*\/search\?q=.*/, { timeout: 10000 });
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const accountSwitcher = this.page.locator('[data-testid="SideNav_AccountSwitcher_Button"]');
      await accountSwitcher.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}