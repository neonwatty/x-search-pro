export const mockSearches = [
  {
    id: 'search_1234567890_abc123',
    name: 'Viral Content',
    query: 'min_faves:1000 min_retweets:500 filter:verified',
    filters: {
      keywords: '',
      minFaves: 1000,
      minRetweets: 500,
      verified: true
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
    query: 'filter:videos filter:verified',
    filters: {
      keywords: '',
      hasVideos: true,
      verified: true
    },
    category: 'Media',
    color: '#8b5cf6',
    createdAt: '2025-01-03T00:00:00.000Z',
    useCount: 0,
    lastUsed: null
  }
];

export const mockCategories = [
  'Tech',
  'News',
  'Personal',
  'Research',
  'Popular',
  'Media',
  'Uncategorized'
];

export const mockSettings = {
  showSidebar: true,
  defaultView: 'grid' as const,
  theme: 'auto' as const
};

export const mockExportData = {
  version: '1.0',
  exportDate: '2025-01-20T12:00:00.000Z',
  searches: mockSearches,
  categories: mockCategories,
  settings: mockSettings
};