import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('QueryBuilder Unit Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let QueryBuilder: any;

  test.beforeAll(async () => {
    const modulePath = path.join(__dirname, '../../lib/query-builder.js');
    QueryBuilder = (await import(modulePath)).default || await import(modulePath);
  });

  test('should build query with engagement filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('playwright')
      .setMinFaves(10)
      .setMinRetweets(5)
      .build();

    expect(query).toBe('playwright min_faves:10 min_retweets:5');
  });

  test('should add quotes to multi-word keywords', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('chrome extension testing')
      .build();

    expect(query).toBe('"chrome extension testing"');
  });

  test('should not add quotes to single word keywords', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('playwright')
      .build();

    expect(query).toBe('playwright');
  });

  test('should format date filters correctly', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setSinceDate('2025-01-01')
      .setUntilDate('2025-12-31')
      .build();

    expect(query).toBe('since:2025-01-01 until:2025-12-31');
  });

  test('should build user filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setFromUser('elonmusk')
      .setToUser('openai')
      .setMentionsUser('anthropic')
      .build();

    expect(query).toBe('from:elonmusk to:openai @anthropic');
  });

  test('should build blue verified and follows filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setBlueVerified(true)
      .setFollows(true)
      .build();

    expect(query).toBe('filter:blue_verified filter:follows');
  });

  test('should build content type filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setHasMedia(true)
      .setHasImages(true)
      .setHasVideos(true)
      .setHasLinks(true)
      .build();

    expect(query).toBe('filter:media filter:images filter:videos filter:links');
  });

  test('should handle include/exclude replies', () => {
    const builder1 = new QueryBuilder();
    const query1 = builder1
      .setKeywords('test')
      .setIncludeReplies(false)
      .build();
    expect(query1).toBe('test -filter:replies');

    const builder2 = new QueryBuilder();
    const query2 = builder2
      .setKeywords('test')
      .setIncludeReplies(true)
      .build();
    expect(query2).toBe('test filter:replies');
  });

  test('should handle include/exclude retweets', () => {
    const builder1 = new QueryBuilder();
    const query1 = builder1
      .setKeywords('test')
      .setIncludeRetweets(false)
      .build();
    expect(query1).toBe('test -filter:retweets');

    const builder2 = new QueryBuilder();
    const query2 = builder2
      .setKeywords('test')
      .setIncludeRetweets(true)
      .build();
    expect(query2).toBe('test filter:retweets');
  });

  test('should build quote filter', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setQuoteOnly(true)
      .build();

    expect(query).toBe('filter:quote');
  });

  test('should build language filter', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('bonjour')
      .setLang('fr')
      .build();

    expect(query).toBe('bonjour lang:fr');
  });

  test('should build complex query with multiple filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('AI technology')
      .setMinFaves(100)
      .setMinRetweets(50)
      .setSinceDate('2025-01-01')
      .setHasVideos(true)
      .setIncludeReplies(false)
      .setLang('en')
      .build();

    expect(query).toContain('"AI technology"');
    expect(query).toContain('min_faves:100');
    expect(query).toContain('min_retweets:50');
    expect(query).toContain('since:2025-01-01');
    expect(query).toContain('filter:videos');
    expect(query).toContain('-filter:replies');
    expect(query).toContain('lang:en');
  });

  test('should reset filters correctly', () => {
    const builder = new QueryBuilder();
    builder
      .setKeywords('test')
      .setMinFaves(50)
      .setBlueVerified(true);

    let query = builder.build();
    expect(query).not.toBe('');

    builder.reset();
    query = builder.build();
    expect(query).toBe('');
  });

  test('should handle fromFilters method', () => {
    const builder = new QueryBuilder();
    const filters = {
      keywords: 'test query',
      minFaves: 25,
      hasVideos: true,
    };

    const query = builder.fromFilters(filters).build();

    expect(query).toContain('"test query"');
    expect(query).toContain('min_faves:25');
    expect(query).toContain('filter:videos');
  });

  test('should handle empty query', () => {
    const builder = new QueryBuilder();
    const query = builder.build();
    expect(query).toBe('');
  });

  test('should handle min replies filter', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setKeywords('discussion')
      .setMinReplies(100)
      .build();

    expect(query).toBe('discussion min_replies:100');
  });

  test('should calculate sliding window dates for 1 day', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({ slidingWindow: '1d' });

    const { sinceDate, untilDate } = builder.calculateSlidingDates();

    // Until date should be today
    const today = new Date().toISOString().split('T')[0];
    expect(untilDate).toBe(today);

    // Since date should be 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const expectedSince = oneDayAgo.toISOString().split('T')[0];
    expect(sinceDate).toBe(expectedSince);
  });

  test('should calculate sliding window dates for 1 week', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({ slidingWindow: '1w' });

    const { sinceDate, untilDate } = builder.calculateSlidingDates();

    // Until date should be today
    const today = new Date().toISOString().split('T')[0];
    expect(untilDate).toBe(today);

    // Since date should be 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const expectedSince = oneWeekAgo.toISOString().split('T')[0];
    expect(sinceDate).toBe(expectedSince);
  });

  test('should calculate sliding window dates for 1 month', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({ slidingWindow: '1m' });

    const { sinceDate, untilDate } = builder.calculateSlidingDates();

    // Until date should be today
    const today = new Date().toISOString().split('T')[0];
    expect(untilDate).toBe(today);

    // Since date should be 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const expectedSince = oneMonthAgo.toISOString().split('T')[0];
    expect(sinceDate).toBe(expectedSince);
  });

  test('should use sliding window dates in build when slidingWindow is set', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({
      keywords: 'test',
      slidingWindow: '1w',
      sinceDate: '2020-01-01', // Should be ignored
      untilDate: '2020-12-31'  // Should be ignored
    });

    const query = builder.build();

    // Should use calculated dates, not fixed dates
    expect(query).not.toContain('2020');
    expect(query).toContain('since:');
    expect(query).toContain('until:');

    // Verify it contains today's date
    const today = new Date().toISOString().split('T')[0];
    expect(query).toContain(today);
  });

  test('should fall back to fixed dates when slidingWindow is null', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({
      keywords: 'test',
      slidingWindow: null,
      sinceDate: '2024-01-01',
      untilDate: '2024-12-31'
    });

    const query = builder.build();

    expect(query).toContain('since:2024-01-01');
    expect(query).toContain('until:2024-12-31');
  });

  test('should reset slidingWindow with reset method', () => {
    const builder = new QueryBuilder();
    builder.fromFilters({ slidingWindow: '1w', keywords: 'test' });

    let query = builder.build();
    expect(query).toContain('since:');

    builder.reset();
    query = builder.build();
    expect(query).toBe('');
  });

  test('should handle fromFilters with slidingWindow property', () => {
    const builder = new QueryBuilder();
    const filters = {
      keywords: 'trending',
      minFaves: 100,
      slidingWindow: '1d'
    };

    builder.fromFilters(filters);
    const query = builder.build();

    expect(query).toContain('trending');
    expect(query).toContain('min_faves:100');
    expect(query).toContain('since:');
    expect(query).toContain('until:');
  });
});