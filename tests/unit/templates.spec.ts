import { test, expect } from '@playwright/test';

const { DefaultTemplates, initializeTemplates } = require('../../lib/templates');
const QueryBuilder = require('../../lib/query-builder');

test.describe('Templates Unit Tests', () => {
  test.describe('DefaultTemplates', () => {
    test('should have 3 default templates', () => {
      expect(DefaultTemplates).toHaveLength(3);
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

    test('should have "claude code" template', () => {
      const claudeTemplate = DefaultTemplates.find((t: any) => t.name === 'claude code');
      expect(claudeTemplate).toBeDefined();
      expect(claudeTemplate?.filters.keywords).toBe('claude code');
      expect(claudeTemplate?.filters.slidingWindow).toBe('1w');
      expect(claudeTemplate?.category).toBe('Coding');
    });

    test('should have "chrome extension" template', () => {
      const chromeTemplate = DefaultTemplates.find((t: any) => t.name === 'chrome extension');
      expect(chromeTemplate).toBeDefined();
      expect(chromeTemplate?.filters.keywords).toBe('chrome extension');
      expect(chromeTemplate?.filters.slidingWindow).toBe('1m');
      expect(chromeTemplate?.category).toBe('Technology');
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