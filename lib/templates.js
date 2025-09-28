const DefaultTemplates = [
  {
    name: 'Viral Content',
    description: 'Posts with high engagement',
    category: 'Popular',
    color: '#ef4444',
    filters: {
      minFaves: 100,
      minRetweets: 50,
      includeReplies: false
    }
  },
  {
    name: 'Recent & Popular',
    description: 'Recent posts with good engagement',
    category: 'Popular',
    color: '#f59e0b',
    filters: {
      sinceDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString().split('T')[0],
      minFaves: 10
    }
  },
  {
    name: 'Video Content',
    description: 'Popular video posts',
    category: 'Media',
    color: '#8b5cf6',
    filters: {
      hasVideos: true,
      minFaves: 20
    }
  },
  {
    name: 'Questions Only',
    description: 'Posts asking questions',
    category: 'Content',
    color: '#06b6d4',
    filters: {
      keywords: '?',
      includeReplies: false
    }
  },
  {
    name: 'News Articles',
    description: 'Posts with news links',
    category: 'News',
    color: '#10b981',
    filters: {
      hasLinks: true,
      minFaves: 5
    }
  },
  {
    name: 'Your Network',
    description: 'Posts from people you follow',
    category: 'Personal',
    color: '#3b82f6',
    filters: {
      follows: true,
      includeRetweets: false
    }
  },
  {
    name: 'Verified Only',
    description: 'Posts from verified accounts',
    category: 'Verified',
    color: '#6366f1',
    filters: {
      verified: true,
      minFaves: 5
    }
  },
  {
    name: 'Image Posts',
    description: 'Posts with images',
    category: 'Media',
    color: '#ec4899',
    filters: {
      hasImages: true,
      minFaves: 10
    }
  },
  {
    name: 'Trending Today',
    description: 'Highly engaged posts from today',
    category: 'Popular',
    color: '#f43f5e',
    filters: {
      sinceDate: new Date().toISOString().split('T')[0],
      minFaves: 50,
      minRetweets: 20
    }
  },
  {
    name: 'Quote Tweets',
    description: 'Quote tweets only',
    category: 'Content',
    color: '#14b8a6',
    filters: {
      quoteOnly: true,
      minFaves: 5
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