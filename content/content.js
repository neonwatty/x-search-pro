let sidebarVisible = true;
let sidebarCollapsed = false;
let sidebarElement = null;
let currentSidebarTab = 'saved'; // Default to saved tab

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applySearch') {
    applySearchToPage(request.query);
    sendResponse({ success: true });
  } else if (request.action === 'updateSidebarVisibility') {
    if (request.visible) {
      // Initialize sidebar (will check login status internally)
      initializeSidebar().then(() => {
        sendResponse({ success: true });
      });
    } else {
      // Remove sidebar from DOM
      removeSidebar();
      sendResponse({ success: true });
    }
  }
  return true;
});

function applySearchToPage(query) {
  const searchInput = document.querySelector('input[data-testid="SearchBox_Search_Input"]') ||
                      document.querySelector('input[aria-label="Search query"]') ||
                      document.querySelector('input[placeholder*="Search"]');

  // Check if this is a test page by looking for test page marker element
  // Content scripts can't access page's window object, so check DOM instead
  const isTestPage = document.querySelector('.test-container') !== null ||
                     document.title === 'X Search Pro Test Page';

  if (searchInput) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Skip navigation if on test page
    if (isTestPage) {
      return;
    }

    const currentUrl = window.location.href;
    setTimeout(() => {
      const form = searchInput.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        setTimeout(() => {
          if (window.location.href === currentUrl) {
            window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
          }
        }, 500);
      } else {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true,
          cancelable: true
        }));

        setTimeout(() => {
          if (window.location.href === currentUrl) {
            window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
          }
        }, 500);
      }
    }, 100);
  } else if (!isTestPage) {
    // Only navigate to X.com if not on test page
    window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
  }
}

async function initializeSidebar() {
  if (sidebarElement) return;

  // Get sidebar settings from storage
  const storageData = await chrome.storage.sync.get(['sidebarVisible', 'sidebarCollapsed']);

  // Always initialize sidebar, but respect visibility setting
  sidebarVisible = storageData.sidebarVisible !== false;
  sidebarCollapsed = storageData.sidebarCollapsed || false;

  sidebarElement = document.createElement('div');
  sidebarElement.id = 'x-search-tabs-sidebar';
  sidebarElement.className = 'x-search-tabs-sidebar';
  sidebarElement.innerHTML = `
    <div class="sidebar-toggle" id="sidebarToggle">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </div>
    <div class="sidebar-panel" id="sidebarPanel">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg width="36" height="36" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(64, 64)">
              <g stroke="#3b82f6" stroke-width="11" fill="none" stroke-linecap="round">
                <line x1="-56" y1="-56" x2="-19" y2="-19"/>
                <line x1="56" y1="-56" x2="19" y2="-19"/>
                <line x1="-56" y1="56" x2="-19" y2="19"/>
              </g>
              <defs>
                <mask id="handleMask">
                  <rect x="-64" y="-64" width="128" height="128" fill="white"/>
                  <circle cx="0" cy="0" r="19" fill="black"/>
                </mask>
              </defs>
              <path d="M 13.5 13.5 L 56 56"
                    stroke="#FFFFFF"
                    stroke-width="11"
                    stroke-linecap="round"
                    mask="url(#handleMask)"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20"
                    stroke="#FFFFFF"
                    stroke-width="5"
                    stroke-linecap="round"/>
              <circle cx="0" cy="0" r="19" stroke="#FFFFFF" stroke-width="11" fill="none"/>
            </g>
          </svg>
        </div>
        <h3>Search Pro</h3>
        <div class="sidebar-header-actions">
          <button class="icon-action-btn" id="collapseSidebar" title="Minimize">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 12.998H5v-2h14z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="sidebar-tabs" id="sidebarTabs">
        <button class="sidebar-tab" data-tab="builder">Builder</button>
        <button class="sidebar-tab active" data-tab="saved">Saved</button>
        <button class="sidebar-tab" data-tab="categories">Categories</button>
        <button class="sidebar-tab" data-tab="about">About</button>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-tab-content" id="builderTab">
          <form id="sidebarSearchForm">
            <section class="form-section">
              <h3>Keywords</h3>
              <input type="text" id="sidebarKeywords" placeholder='e.g., "claude code"' />
            </section>

            <section class="form-section">
              <h3>Category</h3>
              <div class="category-selection">
                <select id="sidebarSearchCategory" class="category-select">
                  <option value="Uncategorized">Uncategorized</option>
                </select>
                <div class="category-color-indicator" id="sidebarCategoryColorIndicator"></div>
              </div>
            </section>

            <section class="form-section collapsible">
              <h3 class="section-header">
                Engagement
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="input-group">
                  <label>Min Likes</label>
                  <input type="number" id="sidebarMinFaves" min="0" placeholder="0" />
                </div>
                <div class="input-group">
                  <label>Min Retweets</label>
                  <input type="number" id="sidebarMinRetweets" min="0" placeholder="0" />
                </div>
                <div class="input-group">
                  <label>Min Replies</label>
                  <input type="number" id="sidebarMinReplies" min="0" placeholder="0" />
                </div>
              </div>
            </section>

            <section class="form-section collapsible">
              <h3 class="section-header">
                Time Window
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="input-group">
                  <label>Dynamic Time Range</label>
                  <select id="sidebarSlidingWindow">
                    <option value="">None (use fixed dates below)</option>
                    <option value="1d">Last 1 Day</option>
                    <option value="1w">Last 1 Week</option>
                    <option value="1m">Last 1 Month</option>
                  </select>
                </div>
                <div class="setting-info" id="sidebarSlidingWindowInfo" style="display: none; margin-top: 8px;">
                  <p style="font-size: 11px; color: #6b7280;">🕒 This search will automatically update to show posts from the selected time window whenever you use it.</p>
                </div>
              </div>
            </section>

            <section class="form-section collapsible">
              <h3 class="section-header">
                Date Range
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="input-group">
                  <label>Since</label>
                  <input type="date" id="sidebarSinceDate" />
                </div>
                <div class="input-group">
                  <label>Until</label>
                  <input type="date" id="sidebarUntilDate" />
                </div>
                <div class="date-presets">
                  <button type="button" class="preset-btn" data-preset="today">Today</button>
                  <button type="button" class="preset-btn" data-preset="week">Last Week</button>
                  <button type="button" class="preset-btn" data-preset="month">Last Month</button>
                </div>
              </div>
            </section>

            <section class="form-section collapsible">
              <h3 class="section-header">
                Users
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="input-group">
                  <label>From User</label>
                  <input type="text" id="sidebarFromUser" placeholder="username" />
                </div>
                <div class="input-group">
                  <label>To User</label>
                  <input type="text" id="sidebarToUser" placeholder="username" />
                </div>
                <div class="input-group">
                  <label>Mentions User</label>
                  <input type="text" id="sidebarMentionsUser" placeholder="username" />
                </div>
                <div class="checkbox-group">
                  <label>
                    <input type="checkbox" id="sidebarBlueVerified" />
                    Blue Verified Only
                  </label>
                  <label>
                    <input type="checkbox" id="sidebarFollows" />
                    From Follows Only
                  </label>
                </div>
              </div>
            </section>

            <section class="form-section collapsible">
              <h3 class="section-header">
                Content Type
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="checkbox-group">
                  <label>
                    <input type="checkbox" id="sidebarHasMedia" />
                    Has Media
                  </label>
                  <label>
                    <input type="checkbox" id="sidebarHasImages" />
                    Has Images
                  </label>
                  <label>
                    <input type="checkbox" id="sidebarHasVideos" />
                    Has Videos
                  </label>
                  <label>
                    <input type="checkbox" id="sidebarHasLinks" />
                    Has Links
                  </label>
                  <label>
                    <input type="checkbox" id="sidebarQuoteOnly" />
                    Quote Tweets Only
                  </label>
                </div>
                <div class="radio-group">
                  <label>Replies:</label>
                  <label>
                    <input type="radio" name="sidebarReplies" value="any" checked />
                    Any
                  </label>
                  <label>
                    <input type="radio" name="sidebarReplies" value="exclude" />
                    Exclude
                  </label>
                  <label>
                    <input type="radio" name="sidebarReplies" value="only" />
                    Only
                  </label>
                </div>
                <div class="radio-group">
                  <label>Retweets:</label>
                  <label>
                    <input type="radio" name="sidebarRetweets" value="any" checked />
                    Any
                  </label>
                  <label>
                    <input type="radio" name="sidebarRetweets" value="exclude" />
                    Exclude
                  </label>
                  <label>
                    <input type="radio" name="sidebarRetweets" value="only" />
                    Only
                  </label>
                </div>
              </div>
            </section>

            <section class="form-section collapsible collapsed">
              <h3 class="section-header">
                Language
                <span class="toggle-icon">▼</span>
              </h3>
              <div class="section-content">
                <div class="input-group">
                  <label>Language Code</label>
                  <select id="sidebarLang">
                    <option value="">Any</option>
                    <option value="en">English (en)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="it">Italian (it)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="zh">Chinese (zh)</option>
                    <option value="ar">Arabic (ar)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="ru">Russian (ru)</option>
                  </select>
                </div>
              </div>
            </section>

            <div class="query-preview">
              <div class="query-preview-header">
                <h4>Query Preview</h4>
                <span class="query-hint" id="sidebarQueryHint">👆 Click to try</span>
              </div>
              <div id="sidebarQueryPreview" class="preview-text">Enter search criteria above...</div>
            </div>

            <div id="sidebarEditingBanner" class="editing-banner hidden">
              <span id="sidebarEditingMessage">Editing: <strong id="sidebarEditingSearchName"></strong></span>
              <button type="button" id="sidebarCancelEditBtn" class="btn-cancel-edit">Cancel</button>
            </div>

            <div class="form-actions">
              <button type="button" id="sidebarSaveBtn" class="btn btn-secondary">Save Search</button>
              <button type="button" id="sidebarResetBtn" class="btn btn-text">Reset</button>
            </div>
          </form>
        </div>
        <div class="sidebar-tab-content active" id="savedTab">
          <input type="text" id="sidebarSearchFilter" placeholder="Filter searches..." class="sidebar-search" />
          <div id="sidebarSearchList" class="sidebar-search-list"></div>
          <div id="sidebarEmptyState" class="sidebar-empty-state">
            <p>No saved searches yet.</p>
            <p>Build one in the Builder tab!</p>
          </div>
        </div>
        <div class="sidebar-tab-content" id="categoriesTab">
          <div class="categories-section">
            <h3>Manage Categories</h3>
            <div class="setting-info">
              <p>Create and organize custom categories for your saved searches</p>
            </div>

            <!-- Add New Category -->
            <div class="add-category-section">
              <h4>Add New Category</h4>
              <div class="add-category-form">
                <input type="text" id="sidebarNewCategoryName" placeholder="Category name" class="category-input" />
                <input type="color" id="sidebarNewCategoryColor" value="#6b7280" class="color-picker-small" title="Category color" />
                <button type="button" id="sidebarAddCategoryBtn" class="btn btn-primary btn-small">Add</button>
              </div>
            </div>

            <!-- Existing Categories List -->
            <div class="categories-list-section">
              <h4>Your Categories</h4>
              <div id="sidebarCategoriesList" class="categories-list">
                <!-- Category items will be populated by JavaScript -->
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-tab-content" id="aboutTab">
          <div class="about-section">
            <div class="about-header">
              <h2>X Search Pro</h2>
              <p class="about-tagline">Build your personal X/Twitter search library</p>
            </div>

            <div class="about-content">
              <p class="about-message">
                Connect on social • Report bugs • Request features
              </p>
              <div class="about-links">
                <a href="https://x.com/neonwatty" target="_blank" rel="noopener noreferrer" class="about-link">
                  <span class="link-icon">𝕏</span>
                  <span>@neonwatty</span>
                </a>
                <a href="https://github.com/neonwatty/x-search-tabs" target="_blank" rel="noopener noreferrer" class="about-link">
                  <span class="link-icon">⚡</span>
                  <span>GitHub</span>
                </a>
                <a href="https://neonwatty.com/" target="_blank" rel="noopener noreferrer" class="about-link">
                  <span class="link-icon">✨</span>
                  <span>Blog</span>
                </a>
              </div>
              <p class="about-creator">
                Created by <a href="https://x.com/neonwatty" target="_blank" rel="noopener noreferrer">neonwatty</a>
              </p>
            </div>
          </div>
        </div>
        <div class="sidebar-footer">
          <span class="footer-full">Created by <a href="https://x.com/neonwatty" target="_blank" rel="noopener noreferrer">neonwatty</a></span>
          <span class="footer-collapsed">by <a href="https://x.com/neonwatty" target="_blank" rel="noopener noreferrer">neonwatty</a></span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sidebarElement);

  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('collapseSidebar').addEventListener('click', toggleCollapse);

  // Add tab switching listeners
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSidebarTab(tab.dataset.tab));
  });

  document.getElementById('sidebarSearchFilter').addEventListener('input', filterSidebarSearches);

  updateSidebarVisibility();
  loadSidebarSearches();

  // Initialize builder form
  initializeSidebarBuilder();

  // Initialize categories tab
  initializeSidebarCategoriesTab();
}

function removeSidebar() {
  if (sidebarElement && sidebarElement.parentNode) {
    sidebarElement.parentNode.removeChild(sidebarElement);
    sidebarElement = null;
  }
}

async function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  await chrome.storage.sync.set({ sidebarVisible });

  // Just hide/show with CSS, don't remove from DOM
  updateSidebarVisibility();
  if (sidebarVisible) {
    loadSidebarSearches();
  }
}

async function toggleCollapse() {
  sidebarCollapsed = !sidebarCollapsed;
  await chrome.storage.sync.set({ sidebarCollapsed });

  // When collapsing (minimizing), always switch to Saved tab (only tab designed for minimized view)
  if (sidebarCollapsed && currentSidebarTab !== 'saved') {
    switchSidebarTab('saved');
  }

  updateSidebarVisibility();
}

function switchSidebarTab(tabName) {
  currentSidebarTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab content
  const tabContentMap = {
    'builder': 'builderTab',
    'saved': 'savedTab',
    'categories': 'categoriesTab',
    'about': 'aboutTab'
  };

  Object.entries(tabContentMap).forEach(([key, contentId]) => {
    const content = document.getElementById(contentId);
    if (key === tabName) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Load content for the active tab
  if (tabName === 'saved') {
    loadSidebarSearches();
  } else if (tabName === 'builder') {
    // Ensure builder is initialized when switching to it
    if (!document.getElementById('sidebarKeywords').value) {
      updateSidebarQueryPreview();
    }
  } else if (tabName === 'categories') {
    loadSidebarCategoriesList();
  }
}

function updateSidebarVisibility() {
  const panel = document.getElementById('sidebarPanel');
  const toggle = document.getElementById('sidebarToggle');
  const collapseBtn = document.getElementById('collapseSidebar');

  if (sidebarVisible) {
    panel.classList.add('visible');
    toggle.classList.add('active');

    if (sidebarCollapsed) {
      panel.classList.add('collapsed');
      sidebarElement.classList.add('collapsed');
      if (collapseBtn) {
        collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13H5v-2h14v2z"/><path d="M13 17h-2v-4h2v4zm0-6h-2V7h2v4z"/></svg>';
        collapseBtn.title = 'Expand';
      }
    } else {
      panel.classList.remove('collapsed');
      sidebarElement.classList.remove('collapsed');
      if (collapseBtn) {
        collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 12.998H5v-2h14z"/></svg>';
        collapseBtn.title = 'Minimize';
      }
    }
  } else {
    panel.classList.remove('visible');
    toggle.classList.remove('active');
  }
}

async function loadSidebarSearches() {
  const searches = await StorageManager.getSavedSearches();
  const listContainer = document.getElementById('sidebarSearchList');
  const emptyState = document.getElementById('sidebarEmptyState');

  if (!listContainer || !emptyState) return; // Elements not initialized yet

  if (searches.length === 0) {
    listContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  const slidingWindowLabels = {
    '1d': '1D',
    '1w': '1W',
    '1m': '1M'
  };

  listContainer.innerHTML = searches.map(search => {
    const slidingWindowBadge = search.filters?.slidingWindow
      ? `<span class="sidebar-sliding-window-badge" title="Dynamic time range">🕒 ${slidingWindowLabels[search.filters.slidingWindow]}</span>`
      : '';

    // Rebuild query with current dates if sliding window is active
    let displayQuery = search.query;
    if (search.filters?.slidingWindow) {
      const builder = new QueryBuilder().fromFilters(search.filters);
      displayQuery = builder.build();
    }

    return `
      <div class="sidebar-search-item" data-id="${search.id}" draggable="true" style="border-left-color: ${search.color}">
        <div class="sidebar-item-header">
          <span class="sidebar-item-name">
            <span class="sidebar-drag-handle" title="Drag to reorder">⋮⋮</span>
            ${search.name}
          </span>
          <div class="sidebar-item-actions">
            <button class="sidebar-icon-btn sidebar-edit-btn" data-id="${search.id}" title="Edit">✏️</button>
            <button class="sidebar-icon-btn sidebar-delete-btn" data-id="${search.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="sidebar-item-badges">
          ${slidingWindowBadge}
          <span class="sidebar-item-category">${search.category}</span>
        </div>
        <div class="sidebar-item-query">${displayQuery}</div>
        <div class="sidebar-item-name-only">
          <span class="sidebar-drag-handle-collapsed" title="Drag to reorder">⋮⋮</span>
          <span class="sidebar-item-collapsed-name">${search.name}</span>
        </div>
      </div>
    `;
  }).join('');

  listContainer.querySelectorAll('.sidebar-search-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      // Don't trigger click on drag handle or action buttons
      if (e.target.closest('.sidebar-drag-handle') ||
          e.target.closest('.sidebar-drag-handle-collapsed') ||
          e.target.closest('.sidebar-icon-btn')) {
        return;
      }

      const id = item.dataset.id;
      const search = searches.find(s => s.id === id);
      if (search) {
        await StorageManager.incrementUseCount(id);

        // Rebuild query with dynamic dates if sliding window is used
        let query = search.query;
        if (search.filters && search.filters.slidingWindow) {
          const builder = new QueryBuilder().fromFilters(search.filters);
          query = builder.build();
        }

        applySearchToPage(query);
        sidebarVisible = false;
        await chrome.storage.sync.set({ sidebarVisible: false });
        updateSidebarVisibility();
      }
    });
  });

  // Add edit button listeners
  listContainer.querySelectorAll('.sidebar-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      editSidebarSearch(id);
    });
  });

  // Add delete button listeners
  listContainer.querySelectorAll('.sidebar-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await deleteSidebarSearch(id);
    });
  });

  // Enable drag and drop
  initializeSidebarDragAndDrop();
}

async function deleteSidebarSearch(id) {
  if (!confirm('Are you sure you want to delete this search?')) return;

  await StorageManager.deleteSearch(id);
  await loadSidebarSearches();
}

function filterSidebarSearches() {
  const filter = document.getElementById('sidebarSearchFilter').value.toLowerCase();
  const items = document.querySelectorAll('.sidebar-search-item');

  items.forEach(item => {
    const name = item.querySelector('.sidebar-item-name').textContent.toLowerCase();
    const query = item.querySelector('.sidebar-item-query').textContent.toLowerCase();
    const category = item.querySelector('.sidebar-item-category').textContent.toLowerCase();

    if (name.includes(filter) || query.includes(filter) || category.includes(filter)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Drag and Drop functionality for Sidebar
let sidebarDraggedElement = null;

function initializeSidebarDragAndDrop() {
  const listContainer = document.getElementById('sidebarSearchList');
  if (!listContainer) return;

  const items = listContainer.querySelectorAll('.sidebar-search-item');

  items.forEach(item => {
    item.addEventListener('dragstart', handleSidebarDragStart);
    item.addEventListener('dragend', handleSidebarDragEnd);
    item.addEventListener('dragover', handleSidebarDragOver);
    item.addEventListener('drop', handleSidebarDrop);
    item.addEventListener('dragenter', handleSidebarDragEnter);
    item.addEventListener('dragleave', handleSidebarDragLeave);
  });
}

function handleSidebarDragStart(e) {
  const element = e.currentTarget;
  sidebarDraggedElement = element;
  element.classList.add('sidebar-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', element.innerHTML);
}

function handleSidebarDragEnd(_e) {
  const element = _e.currentTarget;
  element.classList.remove('sidebar-dragging');
  document.querySelectorAll('.sidebar-search-item').forEach(item => {
    item.classList.remove('sidebar-drag-over');
  });
}

function handleSidebarDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleSidebarDragEnter(_e) {
  const element = _e.currentTarget;
  if (element !== sidebarDraggedElement) {
    element.classList.add('sidebar-drag-over');
  }
}

function handleSidebarDragLeave(_e) {
  const element = _e.currentTarget;
  element.classList.remove('sidebar-drag-over');
}

async function handleSidebarDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const element = e.currentTarget;
  if (sidebarDraggedElement !== element) {
    const listContainer = document.getElementById('sidebarSearchList');
    const allItems = Array.from(listContainer.querySelectorAll('.sidebar-search-item'));
    const draggedIndex = allItems.indexOf(sidebarDraggedElement);
    const targetIndex = allItems.indexOf(element);

    if (draggedIndex < targetIndex) {
      element.parentNode.insertBefore(sidebarDraggedElement, element.nextSibling);
    } else {
      element.parentNode.insertBefore(sidebarDraggedElement, element);
    }

    // Get new order and save to storage
    const newOrder = Array.from(listContainer.querySelectorAll('.sidebar-search-item')).map(item => item.dataset.id);
    await StorageManager.reorderSearches(newOrder);
  }

  element.classList.remove('sidebar-drag-over');
  return false;
}

// ===================================
// BUILDER FORM JAVASCRIPT
// ===================================

let currentSidebarBuilder = new QueryBuilder();
let editingSidebarSearchId = null;

function initializeSidebarBuilder() {
  initializeSidebarCollapsibleSections();
  initializeSidebarDefaultDates();
  initializeSidebarDatePresets();
  initializeSidebarSlidingWindow();
  initializeSidebarFormListeners();
  initializeSidebarBuilderButtons();
  populateSidebarCategoryDropdown();
  initializeSidebarCategoryDropdown();
}

function initializeSidebarCollapsibleSections() {
  const sections = document.querySelectorAll('#builderTab .collapsible');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    if (header) {
      header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
      });
    }
  });
}

function initializeSidebarDefaultDates() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sinceDate = document.getElementById('sidebarSinceDate');
  const untilDate = document.getElementById('sidebarUntilDate');

  if (sinceDate && untilDate) {
    sinceDate.value = weekAgo.toISOString().split('T')[0];
    untilDate.value = today.toISOString().split('T')[0];
    updateSidebarQueryPreview();
  }
}

function initializeSidebarDatePresets() {
  const presetButtons = document.querySelectorAll('#builderTab .preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const slidingWindowSelect = document.getElementById('sidebarSlidingWindow');

      if (slidingWindowSelect && slidingWindowSelect.value) {
        slidingWindowSelect.value = '';
        toggleSidebarDateInputs();
      }

      const preset = btn.dataset.preset;
      const today = new Date();
      const sinceDate = document.getElementById('sidebarSinceDate');

      switch(preset) {
        case 'today':
          sinceDate.value = today.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          sinceDate.value = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          sinceDate.value = monthAgo.toISOString().split('T')[0];
          break;
      }

      updateSidebarQueryPreview();
    });
  });
}

function initializeSidebarSlidingWindow() {
  const slidingWindowSelect = document.getElementById('sidebarSlidingWindow');
  const sinceDateInput = document.getElementById('sidebarSinceDate');
  const untilDateInput = document.getElementById('sidebarUntilDate');

  if (!slidingWindowSelect || !sinceDateInput || !untilDateInput) return;

  slidingWindowSelect.addEventListener('change', () => {
    toggleSidebarDateInputs();
    updateSidebarQueryPreview();
  });

  const clearSlidingWindowAndEnableInput = (input) => {
    if (slidingWindowSelect.value) {
      slidingWindowSelect.value = '';
      toggleSidebarDateInputs();
      updateSidebarQueryPreview();
      setTimeout(() => input.focus(), 0);
    }
  };

  sinceDateInput.addEventListener('click', () => {
    clearSlidingWindowAndEnableInput(sinceDateInput);
  });

  untilDateInput.addEventListener('click', () => {
    clearSlidingWindowAndEnableInput(untilDateInput);
  });

  sinceDateInput.addEventListener('input', () => {
    if (sinceDateInput.value && slidingWindowSelect.value) {
      slidingWindowSelect.value = '';
      toggleSidebarDateInputs();
      updateSidebarQueryPreview();
    }
  });

  untilDateInput.addEventListener('input', () => {
    if (untilDateInput.value && slidingWindowSelect.value) {
      slidingWindowSelect.value = '';
      toggleSidebarDateInputs();
      updateSidebarQueryPreview();
    }
  });
}

function toggleSidebarDateInputs() {
  const slidingWindowValue = document.getElementById('sidebarSlidingWindow')?.value;
  const sinceDateInput = document.getElementById('sidebarSinceDate');
  const untilDateInput = document.getElementById('sidebarUntilDate');
  const presetButtons = document.querySelectorAll('#builderTab .preset-btn');
  const slidingWindowInfo = document.getElementById('sidebarSlidingWindowInfo');

  if (!sinceDateInput || !untilDateInput) return;

  if (slidingWindowValue) {
    sinceDateInput.readOnly = true;
    untilDateInput.readOnly = true;
    sinceDateInput.style.opacity = '0.5';
    untilDateInput.style.opacity = '0.5';
    sinceDateInput.style.cursor = 'pointer';
    untilDateInput.style.cursor = 'pointer';
    presetButtons.forEach(btn => {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'pointer';
    });
    if (slidingWindowInfo) slidingWindowInfo.style.display = 'block';
  } else {
    sinceDateInput.readOnly = false;
    untilDateInput.readOnly = false;
    sinceDateInput.style.opacity = '1';
    untilDateInput.style.opacity = '1';
    sinceDateInput.style.cursor = '';
    untilDateInput.style.cursor = '';
    presetButtons.forEach(btn => {
      btn.style.opacity = '1';
      btn.style.cursor = '';
    });
    if (slidingWindowInfo) slidingWindowInfo.style.display = 'none';
  }
}

function initializeSidebarFormListeners() {
  const inputs = document.querySelectorAll('#builderTab input, #builderTab select');
  inputs.forEach(input => {
    input.addEventListener('input', updateSidebarQueryPreview);
    input.addEventListener('change', updateSidebarQueryPreview);
  });
}

function initializeSidebarBuilderButtons() {
  const saveBtn = document.getElementById('sidebarSaveBtn');
  const resetBtn = document.getElementById('sidebarResetBtn');
  const cancelEditBtn = document.getElementById('sidebarCancelEditBtn');
  const queryPreviewContainer = document.querySelector('#builderTab .query-preview');

  if (saveBtn) saveBtn.addEventListener('click', saveSidebarSearch);
  if (resetBtn) resetBtn.addEventListener('click', resetSidebarForm);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelSidebarEdit);

  if (queryPreviewContainer) {
    queryPreviewContainer.addEventListener('click', () => {
      if (!queryPreviewContainer.classList.contains('disabled')) {
        applySidebarSearch();
      }
    });
  }
}

function getSidebarFormValues() {
  const slidingWindow = document.getElementById('sidebarSlidingWindow')?.value || null;

  const filters = {
    keywords: document.getElementById('sidebarKeywords')?.value || '',
    minFaves: document.getElementById('sidebarMinFaves')?.value || null,
    minRetweets: document.getElementById('sidebarMinRetweets')?.value || null,
    minReplies: document.getElementById('sidebarMinReplies')?.value || null,
    slidingWindow: slidingWindow,
    sinceDate: slidingWindow ? null : (document.getElementById('sidebarSinceDate')?.value || null),
    untilDate: slidingWindow ? null : (document.getElementById('sidebarUntilDate')?.value || null),
    fromUser: document.getElementById('sidebarFromUser')?.value || null,
    toUser: document.getElementById('sidebarToUser')?.value || null,
    mentionsUser: document.getElementById('sidebarMentionsUser')?.value || null,
    blueVerified: document.getElementById('sidebarBlueVerified')?.checked || false,
    follows: document.getElementById('sidebarFollows')?.checked || false,
    hasMedia: document.getElementById('sidebarHasMedia')?.checked || false,
    hasImages: document.getElementById('sidebarHasImages')?.checked || false,
    hasVideos: document.getElementById('sidebarHasVideos')?.checked || false,
    hasLinks: document.getElementById('sidebarHasLinks')?.checked || false,
    quoteOnly: document.getElementById('sidebarQuoteOnly')?.checked || false,
    lang: document.getElementById('sidebarLang')?.value || null
  };

  const repliesValue = document.querySelector('#builderTab input[name="sidebarReplies"]:checked')?.value;
  if (repliesValue === 'exclude') filters.includeReplies = false;
  else if (repliesValue === 'only') filters.includeReplies = true;

  const retweetsValue = document.querySelector('#builderTab input[name="sidebarRetweets"]:checked')?.value;
  if (retweetsValue === 'exclude') filters.includeRetweets = false;
  else if (retweetsValue === 'only') filters.includeRetweets = true;

  return filters;
}

function updateSidebarQueryPreview() {
  const filters = getSidebarFormValues();
  currentSidebarBuilder = new QueryBuilder().fromFilters(filters);
  const query = currentSidebarBuilder.build();

  const preview = document.getElementById('sidebarQueryPreview');
  const previewContainer = document.querySelector('#builderTab .query-preview');

  if (!preview || !previewContainer) return;

  if (query) {
    preview.textContent = query;
    preview.style.color = '#1e3a8a';
    previewContainer.classList.remove('disabled');
  } else {
    preview.textContent = 'Enter search criteria above...';
    preview.style.color = '#9ca3af';
    previewContainer.classList.add('disabled');
  }
}

async function applySidebarSearch() {
  const query = currentSidebarBuilder.build();
  if (!query) {
    alert('Please enter search criteria first');
    return;
  }

  // Apply search directly to current page
  applySearchToPage(query);
}

async function saveSidebarSearch() {
  const query = currentSidebarBuilder.build();
  if (!query) {
    alert('Please enter search criteria first');
    return;
  }

  const categorySelect = document.getElementById('sidebarSearchCategory');
  const selectedCategory = categorySelect?.value || 'Uncategorized';
  const filters = getSidebarFormValues();

  if (editingSidebarSearchId) {
    const searches = await StorageManager.getSavedSearches();
    const existingSearch = searches.find(s => s.id === editingSidebarSearchId);

    if (!existingSearch) {
      alert('Search not found');
      cancelSidebarEdit();
      return;
    }

    const name = prompt('Enter a name for this search:', existingSearch.name);
    if (!name) return;

    await StorageManager.updateSearch(editingSidebarSearchId, {
      name: name,
      query: query,
      filters: filters,
      category: selectedCategory,
      ...(existingSearch.category !== selectedCategory && !existingSearch.isCustomColor
        ? { color: await StorageManager.getCategoryColor(selectedCategory) }
        : {})
    });

    alert('Search updated successfully!');
    cancelSidebarEdit();
    loadSidebarSearches();
  } else {
    const name = prompt('Enter a name for this search:');
    if (!name) return;

    await StorageManager.saveSearch({
      name: name,
      query: query,
      filters: filters,
      category: selectedCategory
    });

    alert('Search saved successfully!');
    resetSidebarForm();
    loadSidebarSearches();
  }
}

function resetSidebarForm() {
  const form = document.getElementById('sidebarSearchForm');
  if (form) form.reset();
  currentSidebarBuilder.reset();
  cancelSidebarEdit();
  toggleSidebarDateInputs();
  initializeSidebarDefaultDates();
}

function cancelSidebarEdit() {
  editingSidebarSearchId = null;
  const editingBanner = document.getElementById('sidebarEditingBanner');
  const saveBtn = document.getElementById('sidebarSaveBtn');
  if (editingBanner) editingBanner.classList.add('hidden');
  if (saveBtn) saveBtn.textContent = 'Save Search';
}

function enterSidebarEditMode(searchId, searchName) {
  editingSidebarSearchId = searchId;
  const editingBanner = document.getElementById('sidebarEditingBanner');
  const editingSearchName = document.getElementById('sidebarEditingSearchName');
  const saveBtn = document.getElementById('sidebarSaveBtn');

  if (editingSearchName) editingSearchName.textContent = searchName;
  if (editingBanner) editingBanner.classList.remove('hidden');
  if (saveBtn) saveBtn.textContent = 'Update Search';
}

async function editSidebarSearch(id) {
  const searches = await StorageManager.getSavedSearches();
  const search = searches.find(s => s.id === id);

  if (!search) return;

  // Switch to builder tab
  switchSidebarTab('builder');

  const filters = search.filters;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = val || false;
  };

  setVal('sidebarKeywords', filters.keywords);
  setVal('sidebarMinFaves', filters.minFaves);
  setVal('sidebarMinRetweets', filters.minRetweets);
  setVal('sidebarMinReplies', filters.minReplies);
  setVal('sidebarSlidingWindow', filters.slidingWindow);
  setVal('sidebarSinceDate', filters.sinceDate);
  setVal('sidebarUntilDate', filters.untilDate);
  setVal('sidebarFromUser', filters.fromUser);
  setVal('sidebarToUser', filters.toUser);
  setVal('sidebarMentionsUser', filters.mentionsUser);
  setChecked('sidebarBlueVerified', filters.blueVerified);
  setChecked('sidebarFollows', filters.follows);
  setChecked('sidebarHasMedia', filters.hasMedia);
  setChecked('sidebarHasImages', filters.hasImages);
  setChecked('sidebarHasVideos', filters.hasVideos);
  setChecked('sidebarHasLinks', filters.hasLinks);
  setChecked('sidebarQuoteOnly', filters.quoteOnly);
  setVal('sidebarLang', filters.lang);

  const categorySelect = document.getElementById('sidebarSearchCategory');
  const colorIndicator = document.getElementById('sidebarCategoryColorIndicator');
  if (categorySelect) categorySelect.value = search.category;
  if (colorIndicator) colorIndicator.style.backgroundColor = search.color;

  if (filters.includeReplies === false) {
    const el = document.querySelector('#builderTab input[name="sidebarReplies"][value="exclude"]');
    if (el) el.checked = true;
  } else if (filters.includeReplies === true) {
    const el = document.querySelector('#builderTab input[name="sidebarReplies"][value="only"]');
    if (el) el.checked = true;
  } else {
    const el = document.querySelector('#builderTab input[name="sidebarReplies"][value="any"]');
    if (el) el.checked = true;
  }

  if (filters.includeRetweets === false) {
    const el = document.querySelector('#builderTab input[name="sidebarRetweets"][value="exclude"]');
    if (el) el.checked = true;
  } else if (filters.includeRetweets === true) {
    const el = document.querySelector('#builderTab input[name="sidebarRetweets"][value="only"]');
    if (el) el.checked = true;
  } else {
    const el = document.querySelector('#builderTab input[name="sidebarRetweets"][value="any"]');
    if (el) el.checked = true;
  }

  toggleSidebarDateInputs();
  updateSidebarQueryPreview();
  enterSidebarEditMode(id, search.name);
}

async function initializeSidebarCategoryDropdown() {
  const categorySelect = document.getElementById('sidebarSearchCategory');
  const colorIndicator = document.getElementById('sidebarCategoryColorIndicator');

  if (!categorySelect || !colorIndicator) return;

  await populateSidebarCategoryDropdown();

  categorySelect.addEventListener('change', async () => {
    const selectedCategory = categorySelect.value;
    const categoryColors = await StorageManager.getCategoryColors();
    const color = categoryColors[selectedCategory] || '#6b7280';
    colorIndicator.style.backgroundColor = color;
  });

  const initialCategory = categorySelect.value;
  const categoryColors = await StorageManager.getCategoryColors();
  colorIndicator.style.backgroundColor = categoryColors[initialCategory] || '#6b7280';
}

async function populateSidebarCategoryDropdown() {
  const categories = await StorageManager.getCategories();
  const categorySelect = document.getElementById('sidebarSearchCategory');

  if (!categorySelect) return;

  categorySelect.innerHTML = categories.map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('');

  if (categories.includes('Uncategorized')) {
    categorySelect.value = 'Uncategorized';
  }
}

// ===================================
// CATEGORIES TAB JAVASCRIPT
// ===================================

async function initializeSidebarCategoriesTab() {
  const addBtn = document.getElementById('sidebarAddCategoryBtn');
  const nameInput = document.getElementById('sidebarNewCategoryName');

  if (!addBtn || !nameInput) return;

  addBtn.addEventListener('click', handleSidebarAddCategory);

  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSidebarAddCategory();
    }
  });

  await loadSidebarCategoriesList();
}

async function handleSidebarAddCategory() {
  const nameInput = document.getElementById('sidebarNewCategoryName');
  const colorInput = document.getElementById('sidebarNewCategoryColor');
  const name = nameInput?.value.trim();
  const color = colorInput?.value;

  if (!name) {
    alert('Please enter a category name');
    return;
  }

  try {
    await StorageManager.createCategory(name, color);
    if (nameInput) nameInput.value = '';
    if (colorInput) colorInput.value = '#6b7280';
    await loadSidebarCategoriesList();
    await populateSidebarCategoryDropdown();
    await loadSidebarSearches();
  } catch (error) {
    alert(error.message);
  }
}

async function loadSidebarCategoriesList() {
  const categories = await StorageManager.getCategories();
  const categoryColors = await StorageManager.getCategoryColors();
  const usageCounts = await StorageManager.getAllCategoryUsageCounts();
  const container = document.getElementById('sidebarCategoriesList');

  if (!container) return;

  container.innerHTML = '';

  categories.forEach(category => {
    const color = categoryColors[category] || '#6b7280';
    const count = usageCounts[category] || 0;
    const item = createSidebarCategoryItem(category, color, count);
    container.appendChild(item);
  });
}

function createSidebarCategoryItem(categoryName, color, usageCount) {
  const item = document.createElement('div');
  item.className = 'category-item';
  item.style.borderLeftColor = color;
  item.dataset.category = categoryName;

  const usageText = usageCount === 1 ? '1 search' : `${usageCount} searches`;

  item.innerHTML = `
    <div class="category-item-info">
      <div class="category-item-color" style="background-color: ${color}"></div>
      <div class="category-item-details">
        <div class="category-item-name" data-category="${categoryName}">${categoryName}</div>
        <div class="category-item-usage">${usageText}</div>
      </div>
    </div>
    <div class="category-item-actions">
      <input type="color" value="${color}" data-category="${categoryName}" title="Change color">
      <button class="category-action-btn rename-btn" data-category="${categoryName}" title="Rename">✏️</button>
      <button class="category-action-btn delete delete-btn" data-category="${categoryName}" title="Delete" ${categoryName === 'Uncategorized' ? 'disabled' : ''}>🗑️</button>
    </div>
  `;

  const colorPicker = item.querySelector('input[type="color"]');
  colorPicker.addEventListener('change', async (e) => {
    await handleSidebarCategoryColorChange(categoryName, e.target.value);
  });

  const renameBtn = item.querySelector('.rename-btn');
  renameBtn.addEventListener('click', () => {
    handleSidebarRenameCategory(categoryName);
  });

  const deleteBtn = item.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    handleSidebarDeleteCategory(categoryName, usageCount);
  });

  return item;
}

async function handleSidebarCategoryColorChange(categoryName, newColor) {
  await StorageManager.setCategoryColor(categoryName, newColor);
  await StorageManager.updateSearchesInCategory(categoryName, newColor);

  const item = document.querySelector(`#sidebarCategoriesList [data-category="${categoryName}"]`)?.closest('.category-item');
  if (item) {
    const colorPreview = item.querySelector('.category-item-color');
    if (colorPreview) colorPreview.style.backgroundColor = newColor;
    item.style.borderLeftColor = newColor;
  }

  await loadSidebarSearches();
}

async function handleSidebarRenameCategory(oldName) {
  const newName = prompt(`Rename category "${oldName}" to:`, oldName);

  if (!newName || newName === oldName) return;

  try {
    const result = await StorageManager.renameCategory(oldName, newName);

    if (result.renamed) {
      const message = result.searchesUpdated > 0
        ? `Category renamed successfully! ${result.searchesUpdated} searches updated.`
        : 'Category renamed successfully!';
      alert(message);

      await loadSidebarCategoriesList();
      await populateSidebarCategoryDropdown();
      await loadSidebarSearches();
    }
  } catch (error) {
    alert(error.message);
  }
}

async function handleSidebarDeleteCategory(categoryName, usageCount) {
  if (categoryName === 'Uncategorized') {
    alert('Cannot delete the Uncategorized category');
    return;
  }

  const message = usageCount > 0
    ? `Delete "${categoryName}"?\n\n${usageCount} searches will be moved to "Uncategorized".`
    : `Delete "${categoryName}"?`;

  if (!confirm(message)) return;

  try {
    const result = await StorageManager.deleteCategory(categoryName);

    if (result.deleted) {
      const successMsg = result.searchesMoved > 0
        ? `Category deleted. ${result.searchesMoved} searches moved to Uncategorized.`
        : 'Category deleted successfully!';
      alert(successMsg);

      await new Promise(resolve => setTimeout(resolve, 100));

      await loadSidebarCategoriesList();
      await populateSidebarCategoryDropdown();
      await loadSidebarSearches();
    }
  } catch (error) {
    alert(error.message);
  }
}

// Listen for storage changes to update sidebar in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && (changes.savedSearches || changes.categories || changes.categoryColors)) {
    // Reload sidebar searches when relevant data changes
    if (sidebarElement && sidebarVisible) {
      loadSidebarSearches();
    }
    // Update category dropdown if categories changed
    if (changes.categories || changes.categoryColors) {
      populateSidebarCategoryDropdown();
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeSidebar, 1000);
  });
} else {
  setTimeout(initializeSidebar, 1000);
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (sidebarElement && !document.body.contains(sidebarElement)) {
      setTimeout(initializeSidebar, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });