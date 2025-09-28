import { test, expect } from '@playwright/test';

const { DefaultTemplates, initializeTemplates } = require('../../lib/templates');
const QueryBuilder = require('../../lib/query-builder');

test.describe('Templates Unit Tests', () => {
  test.describe('DefaultTemplates', () => {
    test('should have 10 default templates', () => {
      expect(DefaultTemplates).toHaveLength(10);
    });

    test('should have required fields in all templates', () => {
      DefaultTemplates.forEach((template: any) => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('color');
        expect(template).toHaveProperty('filters');
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(typeof template.category).toBe('string');
        expect(typeof template.color).toBe('string');
        expect(typeof template.filters).toBe('object');
      });
    });

    test('should have valid color codes', () => {
      const colorRegex = /^#[0-9a-f]{6}$/i;
      DefaultTemplates.forEach((template: any) => {
        expect(template.color).toMatch(colorRegex);
      });
    });

    test('should have "Viral Content" template', () => {
      const viralTemplate = DefaultTemplates.find((t: any) => t.name === 'Viral Content');
      expect(viralTemplate).toBeDefined();
      expect(viralTemplate?.filters.minFaves).toBe(100);
      expect(viralTemplate?.filters.minRetweets).toBe(50);
      expect(viralTemplate?.filters.includeReplies).toBe(false);
    });

    test('should have "Video Content" template', () => {
      const videoTemplate = DefaultTemplates.find((t: any) => t.name === 'Video Content');
      expect(videoTemplate).toBeDefined();
      expect(videoTemplate?.filters.hasVideos).toBe(true);
      expect(videoTemplate?.filters.minFaves).toBe(20);
    });

    test('should have unique template names', () => {
      const names = DefaultTemplates.map((t: any) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(DefaultTemplates.length);
    });

    test('should have templates in different categories', () => {
      const categories = DefaultTemplates.map((t: any) => t.category);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBeGreaterThan(1);
    });

    test('should build valid queries from template filters', () => {
      DefaultTemplates.forEach((template: any) => {
        const query = new QueryBuilder().fromFilters(template.filters).build();
        expect(typeof query).toBe('string');
        expect(query.length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('initializeTemplates', () => {
    test('should skip initialization if chrome.storage is not available', async () => {
      const originalChrome = global.chrome;
      delete (global as any).chrome;

      await initializeTemplates();

      (global as any).chrome = originalChrome;
    });

    test('should skip initialization if chrome.storage.sync is not available', async () => {
      const originalChrome = global.chrome;
      (global as any).chrome = {};

      await initializeTemplates();

      (global as any).chrome = originalChrome;
    });
  });
});