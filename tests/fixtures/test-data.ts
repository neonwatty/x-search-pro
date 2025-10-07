export const mockSearches = [
  {
    id: 'search_1234567890_abc123',
    name: 'Viral Content',
    query: 'min_faves:1000 min_retweets:500',
    filters: {
      keywords: '',
      minFaves: 1000,
      minRetweets: 500
    },
    category: 'Popular',
    color: '#ef4444',
    createdAt: '2025-01-01T00:00:00.000Z',
    useCount: 5,
    lastUsed: '2025-01-15T10:30:00.000Z'
  },
  {
    id: 'search_0987654321_def456',
    name: 'Tech News',
    query: '"artificial intelligence" lang:en filter:news',
    filters: {
      keywords: 'artificial intelligence',
      lang: 'en',
      hasLinks: true
    },
    category: 'Tech',
    color: '#3b82f6',
    createdAt: '2025-01-02T00:00:00.000Z',
    useCount: 12,
    lastUsed: '2025-01-16T14:20:00.000Z'
  },
  {
    id: 'search_1122334455_ghi789',
    name: 'Video Posts',
    query: 'filter:videos',
    filters: {
      keywords: '',
      hasVideos: true
    },
    category: 'Media',
    color: '#8b5cf6',
    createdAt: '2025-01-03T00:00:00.000Z',
    useCount: 0,
    lastUsed: null
  }
];

export const mockSettings = {
  showSidebar: true,
  defaultView: 'grid' as const,
  theme: 'auto' as const
};

export const mockCategoryColors = {
  'Popular': '#ef4444',
  'Media': '#8b5cf6',
  'Content': '#06b6d4',
  'News': '#10b981',
  'Personal': '#3b82f6',
  'Verified': '#6366f1',
  'Tech': '#14b8a6',
  'Research': '#f59e0b',
  'Uncategorized': '#6b7280'
};

export const mockSearchesWithCustomColors = [
  {
    id: 'search_custom_color_1',
    name: 'Custom Color Search',
    query: 'test query',
    filters: { keywords: 'test' },
    category: 'Popular',
    color: '#ff00ff',  // Custom color different from category
    isCustomColor: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    useCount: 0,
    lastUsed: null
  },
  {
    id: 'search_category_color_1',
    name: 'Category Color Search',
    query: 'category test',
    filters: { keywords: 'category' },
    category: 'Popular',
    color: '#ef4444',  // Same as category color
    isCustomColor: false,
    createdAt: '2025-01-02T00:00:00.000Z',
    useCount: 1,
    lastUsed: '2025-01-10T00:00:00.000Z'
  }
];