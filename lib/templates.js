const DefaultTemplates = [
  {
    name: 'claude code',
    description: 'Posts about Claude Code from the past week',
    category: 'Coding',
    color: '#3b82f6',
    filters: {
      keywords: 'claude code',
      slidingWindow: '1w'
    }
  },
  {
    name: 'chrome extension',
    description: 'Posts about Chrome extensions from the past month',
    category: 'Technology',
    color: '#10b981',
    filters: {
      keywords: 'chrome extension',
      slidingWindow: '1m'
    }
  },
  {
    name: 'back squat',
    description: 'Posts about back squats from the past month',
    category: 'Fitness',
    color: '#ef4444',
    filters: {
      keywords: 'back squat',
      slidingWindow: '1m'
    }
  }
];

async function initializeTemplates() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.sync.get(['savedSearches', 'templatesInitialized']);

    if (!result.templatesInitialized) {
      const existingSearches = result.savedSearches || [];
      const templatesWithIds = DefaultTemplates.map(template => ({
        id: 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: template.name,
        query: new QueryBuilder().fromFilters(template.filters).build(),
        filters: template.filters,
        category: template.category,
        color: template.color,
        description: template.description,
        isTemplate: true,
        createdAt: new Date().toISOString(),
        useCount: 0,
        lastUsed: null
      }));

      await chrome.storage.sync.set({
        savedSearches: [...templatesWithIds, ...existingSearches],
        templatesInitialized: true
      });
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DefaultTemplates, initializeTemplates };
}