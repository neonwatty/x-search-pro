const StorageManager = {
  async getSavedSearches() {
    const result = await chrome.storage.sync.get(['savedSearches']);
    return result.savedSearches || [];
  },

  async saveSearch(search) {
    const searches = await this.getSavedSearches();
    const category = search.category || 'Uncategorized';
    const categoryColor = await this.getCategoryColor(category);

    const newSearch = {
      id: this.generateId(),
      name: search.name,
      query: search.query,
      filters: search.filters,
      category: category,
      color: search.color || categoryColor,
      isCustomColor: !!search.color, // Track if user set a custom color
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    };
    searches.unshift(newSearch);
    await chrome.storage.sync.set({ savedSearches: searches });
    return newSearch;
  },

  async updateSearch(id, updates) {
    const searches = await this.getSavedSearches();
    const index = searches.findIndex(s => s.id === id);
    if (index !== -1) {
      searches[index] = { ...searches[index], ...updates };
      await chrome.storage.sync.set({ savedSearches: searches });
      return searches[index];
    }
    return null;
  },

  async deleteSearch(id) {
    const searches = await this.getSavedSearches();
    const filtered = searches.filter(s => s.id !== id);
    await chrome.storage.sync.set({ savedSearches: filtered });
    return true;
  },

  async incrementUseCount(id) {
    const searches = await this.getSavedSearches();
    const index = searches.findIndex(s => s.id === id);
    if (index !== -1) {
      searches[index].useCount++;
      searches[index].lastUsed = new Date().toISOString();
      await chrome.storage.sync.set({ savedSearches: searches });
      return searches[index];
    }
    return null;
  },

  async getCategories() {
    const result = await chrome.storage.sync.get(['categories']);
    return result.categories || ['Tech', 'News', 'Personal', 'Research', 'Uncategorized'];
  },

  async addCategory(category) {
    const categories = await this.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      await chrome.storage.sync.set({ categories });
    }
    return categories;
  },

  async createCategory(name, color = '#6b7280') {
    if (!name || name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }

    const categories = await this.getCategories();
    const trimmedName = name.trim();

    if (categories.includes(trimmedName)) {
      throw new Error('Category already exists');
    }

    categories.push(trimmedName);
    await chrome.storage.sync.set({ categories });

    // Set the color for the new category
    await this.setCategoryColor(trimmedName, color);

    return { name: trimmedName, color };
  },

  async deleteCategory(categoryName) {
    if (categoryName === 'Uncategorized') {
      throw new Error('Cannot delete Uncategorized category');
    }

    const categories = await this.getCategories();
    const filtered = categories.filter(c => c !== categoryName);

    if (filtered.length === categories.length) {
      // Category doesn't exist
      return { deleted: false, searchesMoved: 0 };
    }

    await chrome.storage.sync.set({ categories: filtered });

    // Move all searches in this category to Uncategorized
    const searches = await this.getSavedSearches();
    const uncategorizedColor = await this.getCategoryColor('Uncategorized');
    let searchesMoved = 0;

    searches.forEach(search => {
      if (search.category === categoryName) {
        search.category = 'Uncategorized';
        // Update color to Uncategorized unless it's a custom color
        if (!search.isCustomColor) {
          search.color = uncategorizedColor;
        }
        searchesMoved++;
      }
    });

    if (searchesMoved > 0) {
      await chrome.storage.sync.set({ savedSearches: searches });
    }

    // Remove category color
    const categoryColors = await this.getCategoryColors();
    delete categoryColors[categoryName];
    await chrome.storage.sync.set({ categoryColors });

    return { deleted: true, searchesMoved };
  },

  async renameCategory(oldName, newName) {
    if (!newName || newName.trim() === '') {
      throw new Error('New category name cannot be empty');
    }

    const trimmedNewName = newName.trim();

    if (oldName === trimmedNewName) {
      return { renamed: false, searchesUpdated: 0 };
    }

    const categories = await this.getCategories();

    if (!categories.includes(oldName)) {
      throw new Error('Category does not exist');
    }

    if (categories.includes(trimmedNewName)) {
      throw new Error('New category name already exists');
    }

    // Update categories array
    const updatedCategories = categories.map(c => c === oldName ? trimmedNewName : c);
    await chrome.storage.sync.set({ categories: updatedCategories });

    // Update all searches with this category
    const searches = await this.getSavedSearches();
    let searchesUpdated = 0;

    searches.forEach(search => {
      if (search.category === oldName) {
        search.category = trimmedNewName;
        searchesUpdated++;
      }
    });

    if (searchesUpdated > 0) {
      await chrome.storage.sync.set({ savedSearches: searches });
    }

    // Move category color to new name
    const categoryColors = await this.getCategoryColors();
    if (categoryColors[oldName]) {
      categoryColors[trimmedNewName] = categoryColors[oldName];
      delete categoryColors[oldName];
      await chrome.storage.sync.set({ categoryColors });
    }

    return { renamed: true, searchesUpdated };
  },

  async getCategoryUsageCount(categoryName) {
    const searches = await this.getSavedSearches();
    return searches.filter(s => s.category === categoryName).length;
  },

  async getAllCategoryUsageCounts() {
    const categories = await this.getCategories();
    const searches = await this.getSavedSearches();
    const counts = {};

    categories.forEach(category => {
      counts[category] = searches.filter(s => s.category === category).length;
    });

    return counts;
  },

  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || {
      showSidebar: true,
      defaultView: 'grid',
      theme: 'auto'
    };
  },

  async updateSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.sync.set({ settings: updated });
    return updated;
  },

  // Import/export functionality removed

  async getCategoryColors() {
    const result = await chrome.storage.sync.get(['categoryColors']);
    return result.categoryColors || {
      'Popular': '#ef4444',
      'Media': '#8b5cf6',
      'Content': '#06b6d4',
      'News': '#10b981',
      'Personal': '#3b82f6',
      'Verified': '#6366f1',
      'Uncategorized': '#6b7280'
    };
  },

  async setCategoryColor(category, color) {
    const categoryColors = await this.getCategoryColors();
    categoryColors[category] = color;
    await chrome.storage.sync.set({ categoryColors });
    return categoryColors;
  },

  async getCategoryColor(category) {
    const categoryColors = await this.getCategoryColors();
    return categoryColors[category] || '#6b7280'; // Default gray if category not found
  },

  async updateSearchesInCategory(category, newColor) {
    const searches = await this.getSavedSearches();
    let updated = false;

    searches.forEach(search => {
      if (search.category === category && !search.isCustomColor) {
        search.color = newColor;
        updated = true;
      }
    });

    if (updated) {
      await chrome.storage.sync.set({ savedSearches: searches });
    }
    return updated;
  },

  generateId() {
    return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}