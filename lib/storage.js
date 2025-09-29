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
    searches.push(newSearch);
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