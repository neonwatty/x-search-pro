const StorageManager = {
  async getSavedSearches() {
    const result = await chrome.storage.sync.get(['savedSearches']);
    return result.savedSearches || [];
  },

  async saveSearch(search) {
    const searches = await this.getSavedSearches();
    const newSearch = {
      id: this.generateId(),
      name: search.name,
      query: search.query,
      filters: search.filters,
      category: search.category || 'Uncategorized',
      color: search.color || '#3b82f6',
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

  async exportData() {
    const searches = await this.getSavedSearches();
    const categories = await this.getCategories();
    const settings = await this.getSettings();
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      searches,
      categories,
      settings
    };
  },

  async importData(data) {
    if (data.searches) {
      await chrome.storage.sync.set({ savedSearches: data.searches });
    }
    if (data.categories) {
      await chrome.storage.sync.set({ categories: data.categories });
    }
    if (data.settings) {
      await chrome.storage.sync.set({ settings: data.settings });
    }
    return true;
  },

  generateId() {
    return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}