import { Page, expect } from '@playwright/test';

export class PopupPage {
  constructor(
    private page: Page,
    public readonly extensionId: string
  ) {}

  async open() {
    await this.page.goto(`chrome-extension://${this.extensionId}/popup/popup.html`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async switchTab(tabName: 'builder' | 'saved') {
    const tab = this.page.locator(`.tab[data-tab="${tabName}"]`);
    await tab.click();
    await expect(tab).toHaveClass(/active/);
  }

  async isVisible() {
    return this.page.locator('.container').isVisible();
  }

  async fillKeywords(keywords: string) {
    await this.page.fill('#keywords', keywords);
  }

  async setMinFaves(count: number) {
    await this.page.fill('#minFaves', count.toString());
  }

  async setMinRetweets(count: number) {
    await this.page.fill('#minRetweets', count.toString());
  }

  async setMinReplies(count: number) {
    await this.page.fill('#minReplies', count.toString());
  }

  async setDateRange(since?: string, until?: string) {
    if (since) {
      await this.page.fill('#sinceDate', since);
    }
    if (until) {
      await this.page.fill('#untilDate', until);
    }
  }

  async clickDatePreset(preset: 'today' | 'week' | 'month') {
    await this.page.click(`.preset-btn[data-preset="${preset}"]`);
  }

  async setFromUser(username: string) {
    await this.page.fill('#fromUser', username);
  }

  async setToUser(username: string) {
    await this.page.fill('#toUser', username);
  }

  async setMentionsUser(username: string) {
    await this.page.fill('#mentionsUser', username);
  }

  async checkVerified() {
    await this.page.check('#verified');
  }

  async checkBlueVerified() {
    await this.page.check('#blueVerified');
  }

  async checkFollows() {
    await this.page.check('#follows');
  }

  async checkHasMedia() {
    await this.page.check('#hasMedia');
  }

  async checkHasImages() {
    await this.page.check('#hasImages');
  }

  async checkHasVideos() {
    await this.page.check('#hasVideos');
  }

  async checkHasLinks() {
    await this.page.check('#hasLinks');
  }

  async checkQuoteOnly() {
    await this.page.check('#quoteOnly');
  }

  async setRepliesFilter(option: 'any' | 'exclude' | 'only') {
    await this.page.check(`input[name="replies"][value="${option}"]`);
  }

  async setRetweetsFilter(option: 'any' | 'exclude' | 'only') {
    await this.page.check(`input[name="retweets"][value="${option}"]`);
  }

  async selectLanguage(lang: string) {
    await this.toggleSection('Language');
    await this.page.waitForTimeout(500);
    await this.page.selectOption('#lang', lang);
  }

  async getQueryPreview(): Promise<string> {
    const preview = this.page.locator('#queryPreview');
    return await preview.textContent() || '';
  }

  async clickSave() {
    await this.page.click('#saveBtn');
  }

  async clickApply() {
    await this.page.click('#applyBtn');
  }

  async clickReset() {
    await this.page.click('#resetBtn');
  }

  async toggleSection(sectionName: string) {
    const section = this.page.locator(`.form-section:has-text("${sectionName}")`);
    const header = section.locator('.section-header');
    await header.click();
  }

  async getSavedSearches() {
    await this.switchTab('saved');
    return this.page.locator('.saved-item');
  }

  async clickSavedSearch(name: string) {
    await this.switchTab('saved');
    await this.page.click(`.saved-item:has-text("${name}")`);
  }

  async editSavedSearch(name: string) {
    await this.switchTab('saved');
    const item = this.page.locator(`.saved-item:has-text("${name}")`);
    await item.locator('.edit-btn').click();
  }

  async deleteSavedSearch(name: string) {
    await this.switchTab('saved');
    const item = this.page.locator(`.saved-item:has-text("${name}")`);
    await item.locator('.delete-btn').click();
  }

  async filterSavedSearches(text: string) {
    await this.switchTab('saved');
    await this.page.fill('#searchFilter', text);
  }

  async clickExport() {
    await this.switchTab('saved');
    await this.page.click('#exportBtn');
  }

  async clickImport() {
    await this.switchTab('saved');
    await this.page.click('#importBtn');
  }
}