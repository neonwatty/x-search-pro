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
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const defaultTemplates = [
    {
      id: 'template_claude_code',
      name: 'claude code',
      query: `"claude code" since:${oneWeekAgo.toISOString().split('T')[0]} until:${today.toISOString().split('T')[0]}`,
      filters: {
        keywords: 'claude code',
        slidingWindow: '1w'
      },
      category: 'Coding',
      color: '#3b82f6',
      description: 'Posts about Claude Code from the past week',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_chrome_extension',
      name: 'chrome extension',
      query: `"chrome extension" since:${oneMonthAgo.toISOString().split('T')[0]} until:${today.toISOString().split('T')[0]}`,
      filters: {
        keywords: 'chrome extension',
        slidingWindow: '1m'
      },
      category: 'Technology',
      color: '#10b981',
      description: 'Posts about Chrome extensions from the past month',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    },
    {
      id: 'template_back_squat',
      name: 'back squat',
      query: `"back squat" since:${oneMonthAgo.toISOString().split('T')[0]} until:${today.toISOString().split('T')[0]}`,
      filters: {
        keywords: 'back squat',
        slidingWindow: '1m'
      },
      category: 'Fitness',
      color: '#ef4444',
      description: 'Posts about back squats from the past month',
      isTemplate: true,
      createdAt: new Date().toISOString(),
      useCount: 0,
      lastUsed: null
    }
  ];

  await chrome.storage.sync.set({
    savedSearches: defaultTemplates,
    templatesInitialized: true,
    categories: ['Coding', 'Technology', 'Fitness', 'Uncategorized'],
    categoryColors: {
      'Coding': '#3b82f6',
      'Technology': '#10b981',
      'Fitness': '#ef4444',
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