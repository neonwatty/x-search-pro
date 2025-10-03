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

    test('should prepend to existing searches', async () => {
      await mockChrome.storage.sync.set({ savedSearches: [mockSearches[0]] });

      const newSearch = {
        name: 'Second Search',
        query: 'second',
        filters: {}
      };

      await StorageManager.saveSearch(newSearch);
      const searches = await StorageManager.getSavedSearches();

      expect(searches.length).toBe(2);
      expect(searches[0].name).toBe('Second Search');
      expect(searches[1].name).toBe('Viral Content');
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

  test.describe('createCategory', () => {
    test('should create new category with default color', async () => {
      const result = await StorageManager.createCategory('TestCategory');

      expect(result.name).toBe('TestCategory');
      expect(result.color).toBe('#6b7280');

      const categories = await StorageManager.getCategories();
      expect(categories).toContain('TestCategory');
    });

    test('should create new category with custom color', async () => {
      const result = await StorageManager.createCategory('CustomColor', '#ff0000');

      expect(result.name).toBe('CustomColor');
      expect(result.color).toBe('#ff0000');

      const categoryColors = await StorageManager.getCategoryColors();
      expect(categoryColors['CustomColor']).toBe('#ff0000');
    });

    test('should trim category name', async () => {
      const result = await StorageManager.createCategory('  Trimmed  ');

      expect(result.name).toBe('Trimmed');
      const categories = await StorageManager.getCategories();
      expect(categories).toContain('Trimmed');
    });

    test('should throw error for empty name', async () => {
      await expect(StorageManager.createCategory('')).rejects.toThrow('Category name cannot be empty');
      await expect(StorageManager.createCategory('   ')).rejects.toThrow('Category name cannot be empty');
    });

    test('should throw error for duplicate category', async () => {
      await StorageManager.createCategory('Duplicate');
      await expect(StorageManager.createCategory('Duplicate')).rejects.toThrow('Category already exists');
    });
  });

  test.describe('deleteCategory', () => {
    test('should delete empty category', async () => {
      await StorageManager.createCategory('ToDelete');
      const result = await StorageManager.deleteCategory('ToDelete');

      expect(result.deleted).toBe(true);
      expect(result.searchesMoved).toBe(0);

      const categories = await StorageManager.getCategories();
      expect(categories).not.toContain('ToDelete');
    });

    test('should move searches to Uncategorized when deleting category', async () => {
      await StorageManager.createCategory('WillDelete');
      await mockChrome.storage.sync.set({ categoryColors: { 'WillDelete': '#123456' } });

      // Create searches in this category
      const search1 = await StorageManager.saveSearch({
        name: 'Search 1',
        query: 'test1',
        filters: {},
        category: 'WillDelete'
      });

      const search2 = await StorageManager.saveSearch({
        name: 'Search 2',
        query: 'test2',
        filters: {},
        category: 'WillDelete'
      });

      const result = await StorageManager.deleteCategory('WillDelete');

      expect(result.deleted).toBe(true);
      expect(result.searchesMoved).toBe(2);

      const searches = await StorageManager.getSavedSearches();
      const movedSearches = searches.filter((s: any) => s.id === search1.id || s.id === search2.id);
      const uncategorizedColor = await StorageManager.getCategoryColor('Uncategorized');

      movedSearches.forEach((s: any) => {
        expect(s.category).toBe('Uncategorized');
        expect(s.color).toBe(uncategorizedColor);
      });
    });

    test('should preserve custom colors when moving searches to Uncategorized', async () => {
      await StorageManager.createCategory('WillDelete', '#123456');

      // Create search with custom color
      const searchWithCustomColor = await StorageManager.saveSearch({
        name: 'Custom Color Search',
        query: 'test custom',
        filters: {},
        category: 'WillDelete',
        color: '#ff0000'
      });

      // Create search with category color
      const searchWithCategoryColor = await StorageManager.saveSearch({
        name: 'Category Color Search',
        query: 'test category',
        filters: {},
        category: 'WillDelete'
      });

      const result = await StorageManager.deleteCategory('WillDelete');

      expect(result.deleted).toBe(true);
      expect(result.searchesMoved).toBe(2);

      const searches = await StorageManager.getSavedSearches();
      const customColorSearch = searches.find((s: any) => s.id === searchWithCustomColor.id);
      const categoryColorSearch = searches.find((s: any) => s.id === searchWithCategoryColor.id);
      const uncategorizedColor = await StorageManager.getCategoryColor('Uncategorized');

      expect(customColorSearch.category).toBe('Uncategorized');
      expect(customColorSearch.color).toBe('#ff0000'); // Custom color preserved
      expect(customColorSearch.isCustomColor).toBe(true);

      expect(categoryColorSearch.category).toBe('Uncategorized');
      expect(categoryColorSearch.color).toBe(uncategorizedColor); // Updated to Uncategorized color
      expect(categoryColorSearch.isCustomColor).toBe(false);
    });

    test('should remove category color when deleting', async () => {
      await StorageManager.createCategory('ColorDelete', '#abcdef');
      await StorageManager.deleteCategory('ColorDelete');

      const categoryColors = await StorageManager.getCategoryColors();
      expect(categoryColors['ColorDelete']).toBeUndefined();
    });

    test('should prevent deletion of Uncategorized', async () => {
      await expect(StorageManager.deleteCategory('Uncategorized')).rejects.toThrow('Cannot delete Uncategorized category');
    });

    test('should return false when category does not exist', async () => {
      const result = await StorageManager.deleteCategory('NonExistent');

      expect(result.deleted).toBe(false);
      expect(result.searchesMoved).toBe(0);
    });
  });

  test.describe('renameCategory', () => {
    test('should rename category', async () => {
      await StorageManager.createCategory('OldName');
      const result = await StorageManager.renameCategory('OldName', 'NewName');

      expect(result.renamed).toBe(true);
      expect(result.searchesUpdated).toBe(0);

      const categories = await StorageManager.getCategories();
      expect(categories).toContain('NewName');
      expect(categories).not.toContain('OldName');
    });

    test('should update searches when renaming category', async () => {
      await StorageManager.createCategory('RenameMe');

      const search1 = await StorageManager.saveSearch({
        name: 'Search 1',
        query: 'test1',
        filters: {},
        category: 'RenameMe'
      });

      const search2 = await StorageManager.saveSearch({
        name: 'Search 2',
        query: 'test2',
        filters: {},
        category: 'RenameMe'
      });

      const result = await StorageManager.renameCategory('RenameMe', 'Renamed');

      expect(result.renamed).toBe(true);
      expect(result.searchesUpdated).toBe(2);

      const searches = await StorageManager.getSavedSearches();
      const renamedSearches = searches.filter((s: any) => s.id === search1.id || s.id === search2.id);
      renamedSearches.forEach((s: any) => {
        expect(s.category).toBe('Renamed');
      });
    });

    test('should move category color when renaming', async () => {
      await StorageManager.createCategory('ColorMove', '#123456');
      await StorageManager.renameCategory('ColorMove', 'ColorMoved');

      const categoryColors = await StorageManager.getCategoryColors();
      expect(categoryColors['ColorMoved']).toBe('#123456');
      expect(categoryColors['ColorMove']).toBeUndefined();
    });

    test('should trim new category name', async () => {
      await StorageManager.createCategory('TrimTest');
      const result = await StorageManager.renameCategory('TrimTest', '  Trimmed  ');

      expect(result.renamed).toBe(true);
      const categories = await StorageManager.getCategories();
      expect(categories).toContain('Trimmed');
    });

    test('should throw error for empty new name', async () => {
      await StorageManager.createCategory('HasName');
      await expect(StorageManager.renameCategory('HasName', '')).rejects.toThrow('New category name cannot be empty');
      await expect(StorageManager.renameCategory('HasName', '   ')).rejects.toThrow('New category name cannot be empty');
    });

    test('should throw error if old category does not exist', async () => {
      await expect(StorageManager.renameCategory('DoesNotExist', 'NewName')).rejects.toThrow('Category does not exist');
    });

    test('should throw error if new name already exists', async () => {
      await StorageManager.createCategory('First');
      await StorageManager.createCategory('Second');
      await expect(StorageManager.renameCategory('First', 'Second')).rejects.toThrow('New category name already exists');
    });

    test('should return false if old and new names are the same', async () => {
      await StorageManager.createCategory('SameName');
      const result = await StorageManager.renameCategory('SameName', 'SameName');

      expect(result.renamed).toBe(false);
      expect(result.searchesUpdated).toBe(0);
    });
  });

  test.describe('getCategoryUsageCount', () => {
    test('should return count of searches in category', async () => {
      await StorageManager.createCategory('CountMe');

      await StorageManager.saveSearch({
        name: 'Search 1',
        query: 'test1',
        filters: {},
        category: 'CountMe'
      });

      await StorageManager.saveSearch({
        name: 'Search 2',
        query: 'test2',
        filters: {},
        category: 'CountMe'
      });

      const count = await StorageManager.getCategoryUsageCount('CountMe');
      expect(count).toBe(2);
    });

    test('should return 0 for empty category', async () => {
      await StorageManager.createCategory('Empty');
      const count = await StorageManager.getCategoryUsageCount('Empty');
      expect(count).toBe(0);
    });

    test('should return 0 for non-existent category', async () => {
      const count = await StorageManager.getCategoryUsageCount('DoesNotExist');
      expect(count).toBe(0);
    });
  });

  test.describe('getAllCategoryUsageCounts', () => {
    test('should return usage counts for all categories', async () => {
      await StorageManager.createCategory('Cat1');
      await StorageManager.createCategory('Cat2');

      await StorageManager.saveSearch({
        name: 'Search 1',
        query: 'test1',
        filters: {},
        category: 'Cat1'
      });

      await StorageManager.saveSearch({
        name: 'Search 2',
        query: 'test2',
        filters: {},
        category: 'Cat1'
      });

      await StorageManager.saveSearch({
        name: 'Search 3',
        query: 'test3',
        filters: {},
        category: 'Cat2'
      });

      const counts = await StorageManager.getAllCategoryUsageCounts();

      expect(counts['Cat1']).toBe(2);
      expect(counts['Cat2']).toBe(1);
    });

    test('should include categories with zero searches', async () => {
      await StorageManager.createCategory('EmptyCat');
      const counts = await StorageManager.getAllCategoryUsageCounts();

      expect(counts['EmptyCat']).toBe(0);
    });
  });

  test.describe('reorderSearches', () => {
    test('should reorder searches based on provided ID array', async () => {
      const search1 = await StorageManager.saveSearch({
        name: 'First',
        query: 'first',
        filters: {}
      });

      const search2 = await StorageManager.saveSearch({
        name: 'Second',
        query: 'second',
        filters: {}
      });

      const search3 = await StorageManager.saveSearch({
        name: 'Third',
        query: 'third',
        filters: {}
      });

      // Original order: search3, search2, search1 (prepended)
      // New order: search1, search3, search2
      const newOrder = [search1.id, search3.id, search2.id];
      const reordered = await StorageManager.reorderSearches(newOrder);

      expect(reordered.length).toBe(3);
      expect(reordered[0].id).toBe(search1.id);
      expect(reordered[1].id).toBe(search3.id);
      expect(reordered[2].id).toBe(search2.id);
    });

    test('should persist reordered searches to storage', async () => {
      const search1 = await StorageManager.saveSearch({
        name: 'A',
        query: 'a',
        filters: {}
      });

      const search2 = await StorageManager.saveSearch({
        name: 'B',
        query: 'b',
        filters: {}
      });

      const newOrder = [search1.id, search2.id];
      await StorageManager.reorderSearches(newOrder);

      const searches = await StorageManager.getSavedSearches();
      expect(searches[0].id).toBe(search1.id);
      expect(searches[1].id).toBe(search2.id);
    });

    test('should handle empty array', async () => {
      await StorageManager.saveSearch({
        name: 'Test',
        query: 'test',
        filters: {}
      });

      const reordered = await StorageManager.reorderSearches([]);
      expect(reordered).toEqual([]);

      const searches = await StorageManager.getSavedSearches();
      expect(searches).toEqual([]);
    });

    test('should filter out non-existent IDs', async () => {
      const search1 = await StorageManager.saveSearch({
        name: 'Valid',
        query: 'valid',
        filters: {}
      });

      const newOrder = [search1.id, 'nonexistent_id_1', 'nonexistent_id_2'];
      const reordered = await StorageManager.reorderSearches(newOrder);

      expect(reordered.length).toBe(1);
      expect(reordered[0].id).toBe(search1.id);
    });

    test('should preserve all search properties when reordering', async () => {
      const search1 = await StorageManager.saveSearch({
        name: 'Search 1',
        query: 'query1',
        filters: { keywords: 'test1' },
        category: 'Tech'
      });

      const search2 = await StorageManager.saveSearch({
        name: 'Search 2',
        query: 'query2',
        filters: { keywords: 'test2' },
        category: 'News'
      });

      // Increment use count to verify it's preserved
      await StorageManager.incrementUseCount(search1.id);

      const newOrder = [search2.id, search1.id];
      const reordered = await StorageManager.reorderSearches(newOrder);

      expect(reordered[0].name).toBe('Search 2');
      expect(reordered[0].query).toBe('query2');
      expect(reordered[0].category).toBe('News');
      expect(reordered[0].filters).toEqual({ keywords: 'test2' });

      expect(reordered[1].name).toBe('Search 1');
      expect(reordered[1].query).toBe('query1');
      expect(reordered[1].category).toBe('Tech');
      expect(reordered[1].useCount).toBe(1);
      expect(reordered[1].filters).toEqual({ keywords: 'test1' });
    });

    test('should handle single search', async () => {
      const search = await StorageManager.saveSearch({
        name: 'Only One',
        query: 'only',
        filters: {}
      });

      const reordered = await StorageManager.reorderSearches([search.id]);
      expect(reordered.length).toBe(1);
      expect(reordered[0].id).toBe(search.id);
    });

    test('should handle reversed order', async () => {
      const searches = [];
      for (let i = 0; i < 5; i++) {
        searches.push(await StorageManager.saveSearch({
          name: `Search ${i}`,
          query: `query${i}`,
          filters: {}
        }));
      }

      // Reverse the order
      const reversedOrder = searches.map(s => s.id).reverse();
      const reordered = await StorageManager.reorderSearches(reversedOrder);

      expect(reordered.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(reordered[i].id).toBe(searches[4 - i].id);
      }
    });
  });
});