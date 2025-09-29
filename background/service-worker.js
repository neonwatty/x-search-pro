chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('X Search Pro installed');

    const result = await chrome.storage.sync.get(['templatesInitialized']);
    if (!result.templatesInitialized) {
      await initializeDefaultTemplates();
    }
  } else if (details.reason === 'update') {
    console.log('X Search Pro updated');
  }
});

async function initializeDefaultTemplates() {
  const defaultTemplates = [
    {
      id: 'template_viral',
      name: 'Viral Content',
      query: 'min_faves:100 min_retweets:50 -filter:replies',
      filters: {
        minFaves: 100,
        minRetweets: 50,
        includeReplies: false
      },
      category: 'Popular',
      color: '#ef4444',
      description: 'Posts with high engagement',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_recent',
      name: 'Recent & Popular',
      query: `since:${new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]} min_faves:10`,
      filters: {
        sinceDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        minFaves: 10
      },
      category: 'Popular',
      color: '#f59e0b',
      description: 'Recent posts with good engagement',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_video',
      name: 'Video Content',
      query: 'filter:videos min_faves:20',
      filters: {
        hasVideos: true,
        minFaves: 20
      },
      category: 'Media',
      color: '#8b5cf6',
      description: 'Popular video posts',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_questions',
      name: 'Questions Only',
      query: '? -filter:replies',
      filters: {
        keywords: '?',
        includeReplies: false
      },
      category: 'Content',
      color: '#06b6d4',
      description: 'Posts asking questions',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_news',
      name: 'News Articles',
      query: 'filter:links min_faves:5',
      filters: {
        hasLinks: true,
        minFaves: 5
      },
      category: 'News',
      color: '#10b981',
      description: 'Posts with news links',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_network',
      name: 'Your Network',
      query: 'filter:follows -filter:retweets',
      filters: {
        follows: true,
        includeRetweets: false
      },
      category: 'Personal',
      color: '#3b82f6',
      description: 'Posts from people you follow',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_verified',
      name: 'Verified Only',
      query: 'filter:verified min_faves:5',
      filters: {
        verified: true,
        minFaves: 5
      },
      category: 'Verified',
      color: '#6366f1',
      description: 'Posts from verified accounts',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_images',
      name: 'Image Posts',
      query: 'filter:images min_faves:10',
      filters: {
        hasImages: true,
        minFaves: 10
      },
      category: 'Media',
      color: '#ec4899',
      description: 'Posts with images',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_trending',
      name: 'Trending Today',
      query: `since:${new Date().toISOString().split('T')[0]} min_faves:50 min_retweets:20`,
      filters: {
        sinceDate: new Date().toISOString().split('T')[0],
        minFaves: 50,
        minRetweets: 20
      },
      category: 'Popular',
      color: '#f43f5e',
      description: 'Highly engaged posts from today',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_quotes',
      name: 'Quote Tweets',
      query: 'filter:quote min_faves:5',
      filters: {
        quoteOnly: true,
        minFaves: 5
      },
      category: 'Content',
      color: '#14b8a6',
      description: 'Quote tweets only',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    }
  ];

  await chrome.storage.sync.set({
    savedSearches: defaultTemplates,
    templatesInitialized: true,
    categories: ['Popular', 'Media', 'Content', 'News', 'Personal', 'Verified', 'Uncategorized'],
    categoryColors: {
      'Popular': '#ef4444',
      'Media': '#8b5cf6',
      'Content': '#06b6d4',
      'News': '#10b981',
      'Personal': '#3b82f6',
      'Verified': '#6366f1',
      'Uncategorized': '#6b7280'
    },
    settings: {
      showSidebar: true,
      defaultView: 'grid',
      theme: 'auto'
    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  return true;
});