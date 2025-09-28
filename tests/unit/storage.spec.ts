import { test, expect } from '@playwright/test';
import { createMockChrome } from '../mocks/chrome-api';
import { mockSearches, mockCategories, mockSettings, mockExportData } from '../fixtures/test-data';

test.describe('StorageManager Unit Tests', () => {
  let StorageManager: any;
  let mockChrome: any;

  test.beforeEach(async () => {
    const path = await import('path');
    const modulePath = path.join(__dirname, '../../lib/storage.js');

    mockChrome = createMockChrome();
    global.chrome = mockChrome as any;

    delete require.cache[require.resolve('../../lib/storage.js')];
    StorageManager = require('../../lib/storage.js');

    mockChrome.storage.sync.clear();
  });

  test.afterEach(() => {
    delete (global as any).chrome;
  });

  test.describe('getSavedSearches', () => {
    test('should return empty array when no searches saved', async () => {
      const searches = await StorageManager.getSavedSearches();
      expect(searches).toEqual([]);
    });

    test('should return array of searches when data exists', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const searches = await StorageManager.getSavedSearches();
      expect(searches).toEqual(mockSearches);
      expect(searches.length).toBe(3);
    });
  });

  test.describe('saveSearch', () => {
    test('should save new search with generated ID', async () => {
      const newSearch = {
        name: 'Test Search',
        query: 'test query',
        filters: { keywords: 'test' }
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.id).toBeTruthy();
      expect(saved.id).toMatch(/^search_\d+_.+$/);
      expect(saved.name).toBe('Test Search');
      expect(saved.query).toBe('test query');
    });

    test('should save with default values', async () => {
      const newSearch = {
        name: 'Minimal Search',
        query: 'minimal',
        filters: {}
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.category).toBe('Uncategorized');
      expect(saved.color).toBe('#3b82f6');
      expect(saved.useCount).toBe(0);
      expect(saved.lastUsed).toBeNull();
      expect(saved.createdAt).toBeTruthy();
    });

    test('should set createdAt timestamp', async () => {
      const newSearch = {
        name: 'Time Test',
        query: 'time',
        filters: {}
      };

      const before = new Date().toISOString();
      const saved = await StorageManager.saveSearch(newSearch);
      const after = new Date().toISOString();

      expect(saved.createdAt).toBeTruthy();
      expect(saved.createdAt >= before).toBe(true);
      expect(saved.createdAt <= after).toBe(true);
    });

    test('should append to existing searches', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const newSearch = {
        name: 'Second Search',
        query: 'second',
        filters: {}
      };

      await StorageManager.saveSearch(newSearch);
      const searches = await StorageManager.getSavedSearches();

      expect(searches.length).toBe(2);
      expect(searches[0].name).toBe('Viral Content');
      expect(searches[1].name).toBe('Second Search');
    });
  });

  test.describe('updateSearch', () => {
    test('should update existing search by ID', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const updated = await StorageManager.updateSearch(mockSearches[0].id, {
        name: 'Updated Name',
        category: 'New Category'
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.category).toBe('New Category');
      expect(updated?.query).toBe(mockSearches[0].query);
    });

    test('should return null for non-existent ID', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const updated = await StorageManager.updateSearch('nonexistent_id', {
        name: 'Should Not Work'
      });

      expect(updated).toBeNull();
    });

    test('should preserve fields not in updates object', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const updated = await StorageManager.updateSearch(mockSearches[0].id, {
        name: 'Only Name Changed'
      });

      expect(updated?.query).toBe(mockSearches[0].query);
      expect(updated?.useCount).toBe(mockSearches[0].useCount);
      expect(updated?.lastUsed).toBe(mockSearches[0].lastUsed);
    });
  });

  test.describe('deleteSearch', () => {
    test('should remove search by ID', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const result = await StorageManager.deleteSearch(mockSearches[1].id);
      expect(result).toBe(true);

      const searches = await StorageManager.getSavedSearches();
      expect(searches.length).toBe(2);
      expect(searches.find((s: any) => s.id === mockSearches[1].id)).toBeUndefined();
    });

    test('should return true even if ID doesn\'t exist', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const result = await StorageManager.deleteSearch('nonexistent_id');
      expect(result).toBe(true);

      const searches = await StorageManager.getSavedSearches();
      expect(searches.length).toBe(3);
    });
  });

  test.describe('incrementUseCount', () => {
    test('should increment useCount by 1', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const originalCount = mockSearches[0].useCount;
      const updated = await StorageManager.incrementUseCount(mockSearches[0].id);

      expect(updated?.useCount).toBe(originalCount + 1);
    });

    test('should update lastUsed timestamp', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const before = new Date().toISOString();
      const updated = await StorageManager.incrementUseCount(mockSearches[0].id);
      const after = new Date().toISOString();

      expect(updated?.lastUsed).toBeTruthy();
      if (updated?.lastUsed) {
        expect(updated.lastUsed >= before).toBe(true);
        expect(updated.lastUsed <= after).toBe(true);
      }
    });

    test('should return null for non-existent ID', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const updated = await StorageManager.incrementUseCount('nonexistent_id');
      expect(updated).toBeNull();
    });
  });

  test.describe('getCategories', () => {
    test('should return default categories when none saved', async () => {
      const categories = await StorageManager.getCategories();

      expect(categories).toContain('Tech');
      expect(categories).toContain('News');
      expect(categories).toContain('Personal');
      expect(categories).toContain('Research');
      expect(categories).toContain('Uncategorized');
    });

    test('should return custom categories when exist', async () => {
      const customCategories = ['Custom1', 'Custom2', 'Custom3'];
      await mockChrome.storage.sync.set({ categories: customCategories });

      const categories = await StorageManager.getCategories();
      expect(categories).toEqual(customCategories);
    });
  });

  test.describe('addCategory', () => {
    test('should add new category to list', async () => {
      await mockChrome.storage.sync.set({ categories: ['Cat1', 'Cat2'] });

      const categories = await StorageManager.addCategory('Cat3');

      expect(categories).toContain('Cat1');
      expect(categories).toContain('Cat2');
      expect(categories).toContain('Cat3');
      expect(categories.length).toBe(3);
    });

    test('should not add duplicate category', async () => {
      await mockChrome.storage.sync.set({ categories: ['Cat1', 'Cat2'] });

      const categories = await StorageManager.addCategory('Cat1');

      expect(categories.filter((c: string) => c === 'Cat1').length).toBe(1);
      expect(categories.length).toBe(2);
    });
  });

  test.describe('getSettings', () => {
    test('should return default settings when none saved', async () => {
      const settings = await StorageManager.getSettings();

      expect(settings.showSidebar).toBe(true);
      expect(settings.defaultView).toBe('grid');
      expect(settings.theme).toBe('auto');
    });

    test('should return custom settings when exist', async () => {
      const customSettings = {
        showSidebar: false,
        defaultView: 'list',
        theme: 'dark'
      };
      await mockChrome.storage.sync.set({ settings: customSettings });

      const settings = await StorageManager.getSettings();
      expect(settings).toEqual(customSettings);
    });
  });

  test.describe('updateSettings', () => {
    test('should merge updated settings with existing', async () => {
      await mockChrome.storage.sync.set({ settings: mockSettings });

      const updated = await StorageManager.updateSettings({
        showSidebar: false
      });

      expect(updated.showSidebar).toBe(false);
      expect(updated.defaultView).toBe('grid');
      expect(updated.theme).toBe('auto');
    });

    test('should preserve non-updated settings', async () => {
      await mockChrome.storage.sync.set({
        settings: { showSidebar: true, defaultView: 'grid', theme: 'dark' }
      });

      const updated = await StorageManager.updateSettings({
        defaultView: 'list'
      });

      expect(updated.showSidebar).toBe(true);
      expect(updated.defaultView).toBe('list');
      expect(updated.theme).toBe('dark');
    });
  });

  test.describe('exportData', () => {
    test('should export all data with version and timestamp', async () => {
      await mockChrome.storage.sync.set({
        savedSearches: mockSearches,
        categories: mockCategories,
        settings: mockSettings
      });

      const exported = await StorageManager.exportData();

      expect(exported.version).toBe('1.0');
      expect(exported.exportDate).toBeTruthy();
      expect(exported.searches).toEqual(mockSearches);
      expect(exported.categories).toEqual(mockCategories);
      expect(exported.settings).toEqual(mockSettings);
    });
  });

  test.describe('importData', () => {
    test('should import searches correctly', async () => {
      await StorageManager.importData({ searches: mockSearches });

      const searches = await StorageManager.getSavedSearches();
      expect(searches).toEqual(mockSearches);
    });

    test('should import categories and settings', async () => {
      await StorageManager.importData({
        categories: mockCategories,
        settings: mockSettings
      });

      const categories = await StorageManager.getCategories();
      const settings = await StorageManager.getSettings();

      expect(categories).toEqual(mockCategories);
      expect(settings).toEqual(mockSettings);
    });

    test('should handle partial imports', async () => {
      await mockChrome.storage.sync.set({
        savedSearches: [mockSearches[0]],
        categories: ['Old'],
        settings: { theme: 'light' }
      });

      await StorageManager.importData({
        searches: [mockSearches[1]]
      });

      const searches = await StorageManager.getSavedSearches();
      const categories = await StorageManager.getCategories();

      expect(searches).toEqual([mockSearches[1]]);
      expect(categories).toEqual(['Old']);
    });
  });

  test.describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = StorageManager.generateId();
      const id2 = StorageManager.generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^search_\d+_.+$/);
      expect(id2).toMatch(/^search_\d+_.+$/);
    });
  });
});