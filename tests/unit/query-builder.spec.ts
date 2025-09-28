import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('QueryBuilder Unit Tests', () => {
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

  test('should build verified and follows filters', () => {
    const builder = new QueryBuilder();
    const query = builder
      .setVerified(true)
      .setBlueVerified(true)
      .setFollows(true)
      .build();

    expect(query).toBe('filter:verified filter:blue_verified filter:follows');
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
      .setVerified(true)
      .setHasVideos(true)
      .setIncludeReplies(false)
      .setLang('en')
      .build();

    expect(query).toContain('"AI technology"');
    expect(query).toContain('min_faves:100');
    expect(query).toContain('min_retweets:50');
    expect(query).toContain('since:2025-01-01');
    expect(query).toContain('filter:verified');
    expect(query).toContain('filter:videos');
    expect(query).toContain('-filter:replies');
    expect(query).toContain('lang:en');
  });

  test('should reset filters correctly', () => {
    const builder = new QueryBuilder();
    builder
      .setKeywords('test')
      .setMinFaves(50)
      .setVerified(true);

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
      verified: true,
    };

    const query = builder.fromFilters(filters).build();

    expect(query).toContain('"test query"');
    expect(query).toContain('min_faves:25');
    expect(query).toContain('filter:videos');
    expect(query).toContain('filter:verified');
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
});