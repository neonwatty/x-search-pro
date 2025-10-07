import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Type definitions for test page global variables
 */
declare global {
  interface Window {
    __XSEARCH_TEST_PAGE__: boolean;
    __LAST_SEARCH__: string | null;
    __SEARCH_HISTORY__: Array<{ query: string; timestamp: string }>;
    __LAST_SEARCH_URL__: string | undefined;
    getTestPageState(): {
      lastSearch: string | null;
      searchHistory: Array<{ query: string; timestamp: string }>;
      lastSearchUrl: string | undefined;
    };
    resetTestPageState(): void;
  }
}

/**
 * TestPageHelpers provides utilities for interacting with the test-page.html fixture
 * Used for E2E tests that don't require actual X.com functionality
 */
export class TestPageHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the test page fixture
   */
  async navigateToTestPage() {
    const testPagePath = path.join(__dirname, '../fixtures/test-page.html');
    const testPageUrl = `file://${testPagePath}`;

    await this.page.goto(testPageUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForTestPageReady();
  }

  /**
   * Wait for test page to be fully loaded and ready
   */
  async waitForTestPageReady() {
    // Wait for test page marker
    await this.page.waitForFunction(() => window.__XSEARCH_TEST_PAGE__ === true, { timeout: 5000 });

    // Wait for search input to be available
    const searchInput = this.page.locator('#mock-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get the mock search input element
   */
  async getSearchInput() {
    return this.page.locator('#mock-search-input');
  }

  /**
   * Simulate a search submission (fills input and presses Enter)
   */
  async performSearch(query: string) {
    const searchInput = await this.getSearchInput();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill(query);
    await searchInput.press('Enter');

    // Wait for test page to record the search
    await this.page.waitForTimeout(100);
  }

  /**
   * Verify that a search was applied to the input
   */
  async verifySearchApplied(expectedQuery: string) {
    const searchInput = await this.getSearchInput();
    await expect(searchInput).toHaveValue(expectedQuery, { timeout: 5000 });
  }

  /**
   * Get the current test page state (lastSearch, searchHistory, lastSearchUrl)
   */
  async getTestPageState() {
    return await this.page.evaluate(() => {
      return window.getTestPageState();
    });
  }

  /**
   * Reset the test page state (clears search history and input)
   */
  async resetTestPageState() {
    await this.page.evaluate(() => {
      window.resetTestPageState();
    });
  }

  /**
   * Wait for sidebar to be injected into the page
   */
  async waitForSidebarInjection(timeout = 10000) {
    const sidebarToggle = this.page.locator('#sidebarToggle');
    await expect(sidebarToggle).toBeVisible({ timeout });
  }

  /**
   * Verify that a specific search was recorded in the test page history
   */
  async verifySearchInHistory(expectedQuery: string) {
    const state = await this.getTestPageState();
    expect(state.lastSearch).toBe(expectedQuery);
    expect(state.searchHistory.length).toBeGreaterThan(0);

    const lastEntry = state.searchHistory[state.searchHistory.length - 1];
    expect(lastEntry.query).toBe(expectedQuery);
  }

  /**
   * Verify that the last search URL was generated correctly
   */
  async verifyLastSearchUrl(expectedQuery: string) {
    const state = await this.getTestPageState();
    expect(state.lastSearchUrl).toBe(`https://x.com/search?q=${encodeURIComponent(expectedQuery)}&src=typed_query`);
  }

  /**
   * Check if the mock account switcher is visible (simulates logged in state)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const accountSwitcher = this.page.locator('[data-testid="SideNav_AccountSwitcher_Button"]');
      await accountSwitcher.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for search history to have at least N entries
   */
  async waitForSearchHistoryCount(expectedCount: number, timeout = 5000) {
    await this.page.waitForFunction(
      (count) => window.__SEARCH_HISTORY__.length >= count,
      expectedCount,
      { timeout }
    );
  }

  /**
   * Get the current value of the search input
   */
  async getSearchInputValue(): Promise<string> {
    const searchInput = await this.getSearchInput();
    return await searchInput.inputValue();
  }

  /**
   * Clear the search input
   */
  async clearSearchInput() {
    const searchInput = await this.getSearchInput();
    await searchInput.fill('');
  }
}
