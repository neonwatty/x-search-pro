import { test, expect } from '@playwright/test';
import { createMockChrome } from '../mocks/chrome-api';
import { mockSearches, mockSettings, mockCategoryColors, mockSearchesWithCustomColors } from '../fixtures/test-data';

test.describe('StorageManager Unit Tests', () => {
  let StorageManager: any;
  let mockChrome: any;

  test.beforeEach(async () => {
    mockChrome = createMockChrome();
    mockChrome.storage.sync.clear();
    global.chrome = mockChrome as any;

    delete require.cache[require.resolve('../../lib/storage.js')];
    StorageManager = require('../../lib/storage.js');
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
      expect(saved.color).toBe('#6b7280'); // Default gray color for Uncategorized
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

  // Import/export functionality has been removed from StorageManager
  // These tests are no longer applicable

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

  test.describe('getCategoryColors', () => {
    test('should return default colors when none saved', async () => {
      const colors = await StorageManager.getCategoryColors();

      expect(colors).toBeTruthy();
      expect(colors['Popular']).toBe('#ef4444');
      expect(colors['Media']).toBe('#8b5cf6');
      expect(colors['Content']).toBe('#06b6d4');
      expect(colors['News']).toBe('#10b981');
      expect(colors['Personal']).toBe('#3b82f6');
      expect(colors['Verified']).toBe('#6366f1');
      expect(colors['Uncategorized']).toBe('#6b7280');
    });

    test('should return saved colors when they exist', async () => {
      const customColors = { 'Popular': '#ff0000', 'Tech': '#00ff00' };
      await mockChrome.storage.sync.set({ categoryColors: customColors });

      const colors = await StorageManager.getCategoryColors();
      expect(colors).toEqual(customColors);
    });

    test('should merge with defaults for partial saved colors', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const colors = await StorageManager.getCategoryColors();
      expect(colors).toEqual(mockCategoryColors);
    });
  });

  test.describe('setCategoryColor', () => {
    test('should set color for existing category', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const updatedColors = await StorageManager.setCategoryColor('Popular', '#123456');

      expect(updatedColors['Popular']).toBe('#123456');
      expect(updatedColors['Media']).toBe('#8b5cf6'); // Others unchanged
    });

    test('should create new category color mapping', async () => {
      const updatedColors = await StorageManager.setCategoryColor('NewCategory', '#abcdef');

      expect(updatedColors['NewCategory']).toBe('#abcdef');
    });

    test('should persist changes to storage', async () => {
      await StorageManager.setCategoryColor('Tech', '#fedcba');

      const stored = await mockChrome.storage.sync.get(['categoryColors']);
      expect(stored.categoryColors['Tech']).toBe('#fedcba');
    });
  });

  test.describe('getCategoryColor', () => {
    test('should return correct color for existing category', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const color = await StorageManager.getCategoryColor('Popular');
      expect(color).toBe('#ef4444');
    });

    test('should return default gray for unknown category', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const color = await StorageManager.getCategoryColor('NonExistent');
      expect(color).toBe('#6b7280');
    });

    test('should handle null/undefined category input', async () => {
      const color1 = await StorageManager.getCategoryColor(null);
      const color2 = await StorageManager.getCategoryColor(undefined);

      expect(color1).toBe('#6b7280');
      expect(color2).toBe('#6b7280');
    });
  });

  test.describe('updateSearchesInCategory', () => {
    test('should update searches without custom colors', async () => {
      const searches = [
        { ...mockSearchesWithCustomColors[1] }, // Category color search
        { ...mockSearchesWithCustomColors[0] }  // Custom color search
      ];
      await mockChrome.storage.sync.set({ savedSearches: searches });

      const updated = await StorageManager.updateSearchesInCategory('Popular', '#ff0000');

      expect(updated).toBe(true);
      const updatedSearches = await StorageManager.getSavedSearches();
      expect(updatedSearches[0].color).toBe('#ff0000'); // Updated
      expect(updatedSearches[1].color).toBe('#ff00ff'); // Not updated (custom)
    });

    test('should NOT update searches with isCustomColor=true', async () => {
      const customSearch = { ...mockSearchesWithCustomColors[0] };
      await mockChrome.storage.sync.set({ savedSearches: [customSearch] });

      const updated = await StorageManager.updateSearchesInCategory('Popular', '#000000');

      expect(updated).toBe(false);
      const searches = await StorageManager.getSavedSearches();
      expect(searches[0].color).toBe('#ff00ff'); // Unchanged
    });

    test('should return false when no updates needed', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [] });

      const updated = await StorageManager.updateSearchesInCategory('Popular', '#ff0000');
      expect(updated).toBe(false);
    });

    test('should handle empty searches array', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [] });

      const updated = await StorageManager.updateSearchesInCategory('Tech', '#123456');
      expect(updated).toBe(false);
    });

    test('should handle category with no searches', async () => {
      await mockChrome.storage.sync.set({ savedSearches: mockSearches });

      const updated = await StorageManager.updateSearchesInCategory('NonExistentCategory', '#000000');
      expect(updated).toBe(false);
    });
  });

  test.describe('saveSearch with category colors', () => {
    test('should use category color when saving new search', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const newSearch = {
        name: 'Test Search',
        query: 'test',
        filters: {},
        category: 'Popular'
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.color).toBe('#ef4444');
      expect(saved.isCustomColor).toBe(false);
    });

    test('should set isCustomColor=true when custom color provided', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const newSearch = {
        name: 'Custom Color Search',
        query: 'custom',
        filters: {},
        category: 'Popular',
        color: '#custom1'
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.color).toBe('#custom1');
      expect(saved.isCustomColor).toBe(true);
    });

    test('should handle missing category (defaults to Uncategorized)', async () => {
      await mockChrome.storage.sync.set({ categoryColors: { ...mockCategoryColors } });

      const newSearch = {
        name: 'No Category Search',
        query: 'test',
        filters: {}
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.category).toBe('Uncategorized');
      expect(saved.color).toBe('#6b7280');
      expect(saved.isCustomColor).toBe(false);
    });

    test('should use default color for unknown category', async () => {
      const newSearch = {
        name: 'Unknown Category',
        query: 'test',
        filters: {},
        category: 'BrandNewCategory'
      };

      const saved = await StorageManager.saveSearch(newSearch);

      expect(saved.color).toBe('#6b7280'); // Default gray
      expect(saved.isCustomColor).toBe(false);
    });
  });
});