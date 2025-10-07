import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test.describe('Workflow 1: Create & Save Search', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });


  test('should build complex query with multiple filters', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    await sidebar.fillKeywords('AI technology');
    await sidebar.setMinFaves(100);
    await sidebar.setMinRetweets(50);
    await sidebar.checkHasVideos();
    await sidebar.setRepliesFilter('exclude');
    await sidebar.selectLanguage('en');

    const preview = await sidebar.getQueryPreview();
    expect(preview).toContain('"AI technology"');
    expect(preview).toContain('min_faves:100');
    expect(preview).toContain('min_retweets:50');
    expect(preview).toContain('filter:videos');
    expect(preview).toContain('-filter:replies');
    expect(preview).toContain('lang:en');

    await page.waitForTimeout(1000);
    await page.close();
  });

  test('should reset form correctly', async ({ context, extensionId: _extensionId }) => {
    const page = await context.newPage();
    const testPageHelper = new TestPageHelpers(page);

    await testPageHelper.navigateToTestPage();
    await page.waitForTimeout(1000);

    const sidebar = new SidebarPage(page);
    await sidebar.waitForInjection(5000);
    await sidebar.ensureVisible();

    await sidebar.fillKeywords('test');
    await sidebar.setMinFaves(50);
    await sidebar.checkHasVideos();

    let preview = await sidebar.getQueryPreview();
    expect(preview).not.toBe('Enter search criteria above...');

    await sidebar.clickReset();

    preview = await sidebar.getQueryPreview();
    // After reset, sidebar builder sets default dates, so we check it's different from filled state
    expect(preview).not.toContain('test');
    expect(preview).not.toContain('min_faves:50');
    expect(preview).not.toContain('filter:videos');

    await page.waitForTimeout(1000);
    await page.close();
  });
});
