import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';

test.describe('Workflow 1: Create & Save Search', () => {
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });


  test('should build complex query with multiple filters', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    await popupPage.fillKeywords('AI technology');
    await popupPage.setMinFaves(100);
    await popupPage.setMinRetweets(50);
    await popupPage.checkHasVideos();
    await popupPage.checkVerified();
    await popupPage.setRepliesFilter('exclude');
    await popupPage.selectLanguage('en');

    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('"AI technology"');
    expect(preview).toContain('min_faves:100');
    expect(preview).toContain('min_retweets:50');
    expect(preview).toContain('filter:videos');
    expect(preview).toContain('filter:verified');
    expect(preview).toContain('-filter:replies');
    expect(preview).toContain('lang:en');

    await popupPage.page.waitForTimeout(1000);
    await popupPage.page.close();
  });

  test('should use date presets correctly', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    await popupPage.fillKeywords('news');
    await popupPage.clickDatePreset('today');

    const preview = await popupPage.getQueryPreview();
    expect(preview).toContain('since:');

    const today = new Date().toISOString().split('T')[0];
    expect(preview).toContain(today);

    await popupPage.page.waitForTimeout(1000);
    await popupPage.page.close();
  });

  test('should reset form correctly', async ({ context, extensionId }) => {
    const popupPage = new PopupPage(await context.newPage(), extensionId);
    await popupPage.open();
    await popupPage.page.waitForTimeout(1000);

    await popupPage.fillKeywords('test');
    await popupPage.setMinFaves(50);
    await popupPage.checkHasVideos();

    let preview = await popupPage.getQueryPreview();
    expect(preview).not.toBe('Enter search criteria above...');

    await popupPage.clickReset();

    preview = await popupPage.getQueryPreview();
    expect(preview).toContain('Enter search criteria above');

    await popupPage.page.waitForTimeout(1000);
    await popupPage.page.close();
  });
});