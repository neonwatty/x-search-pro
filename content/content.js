let sidebarVisible = false;
let sidebarElement = null;

console.log('[CONTENT SCRIPT] Loaded on:', window.location.href);
console.log('[CONTENT SCRIPT] Document ready state:', document.readyState);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[CONTENT SCRIPT] Received message:', request);
  console.log('[CONTENT SCRIPT] Message action:', request.action);

  if (request.action === 'applySearch') {
    console.log('[CONTENT SCRIPT] Applying search with query:', request.query);
    applySearchToPage(request.query);
    console.log('[CONTENT SCRIPT] Search applied, sending success response');
    sendResponse({ success: true });
  }
  return true;
});

function applySearchToPage(query) {
  console.log('[CONTENT SCRIPT] applySearchToPage called with query:', query);

  const searchInput = document.querySelector('input[data-testid="SearchBox_Search_Input"]') ||
                      document.querySelector('input[aria-label="Search query"]') ||
                      document.querySelector('input[placeholder*="Search"]');

  console.log('[CONTENT SCRIPT] Search input found:', !!searchInput);
  if (searchInput) {
    console.log('[CONTENT SCRIPT] Search input element:', searchInput);
  }

  if (searchInput) {
    console.log('[CONTENT SCRIPT] Setting search input value to:', query);
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    const currentUrl = window.location.href;
    setTimeout(() => {
      const form = searchInput.closest('form');
      console.log('[CONTENT SCRIPT] Form found:', !!form);
      if (form) {
        console.log('[CONTENT SCRIPT] Submitting form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        setTimeout(() => {
          if (window.location.href === currentUrl) {
            console.log('[CONTENT SCRIPT] Form submit did not navigate, using direct URL navigation');
            window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
          }
        }, 500);
      } else {
        console.log('[CONTENT SCRIPT] No form found, dispatching Enter key');
        searchInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true,
          cancelable: true
        }));

        setTimeout(() => {
          if (window.location.href === currentUrl) {
            console.log('[CONTENT SCRIPT] Enter key did not navigate, using direct URL navigation');
            window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
          }
        }, 500);
      }
    }, 100);
  } else {
    console.log('[CONTENT SCRIPT] No search input found, redirecting to search URL');
    window.location.href = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
  }
}

function initializeSidebar() {
  if (sidebarElement) return;

  sidebarElement = document.createElement('div');
  sidebarElement.id = 'x-search-tabs-sidebar';
  sidebarElement.className = 'x-search-tabs-sidebar';
  sidebarElement.innerHTML = `
    <div class="sidebar-toggle" id="sidebarToggle">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z"/>
      </svg>
    </div>
    <div class="sidebar-panel" id="sidebarPanel">
      <div class="sidebar-header">
        <h3>Saved Searches</h3>
        <button class="close-btn" id="closeSidebar">×</button>
      </div>
      <div class="sidebar-content">
        <input type="text" id="sidebarSearchFilter" placeholder="Filter searches..." class="sidebar-search" />
        <div id="sidebarSearchList" class="sidebar-search-list"></div>
        <div id="sidebarEmptyState" class="sidebar-empty-state">
          <p>No saved searches yet.</p>
          <p>Click the extension icon to create one!</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sidebarElement);

  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('closeSidebar').addEventListener('click', () => {
    sidebarVisible = false;
    updateSidebarVisibility();
  });

  document.getElementById('sidebarSearchFilter').addEventListener('input', filterSidebarSearches);

  loadSidebarSearches();
}

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  updateSidebarVisibility();
  if (sidebarVisible) {
    loadSidebarSearches();
  }
}

function updateSidebarVisibility() {
  const panel = document.getElementById('sidebarPanel');
  const toggle = document.getElementById('sidebarToggle');

  if (sidebarVisible) {
    panel.classList.add('visible');
    toggle.classList.add('active');
  } else {
    panel.classList.remove('visible');
    toggle.classList.remove('active');
  }
}

async function loadSidebarSearches() {
  const searches = await StorageManager.getSavedSearches();
  const listContainer = document.getElementById('sidebarSearchList');
  const emptyState = document.getElementById('sidebarEmptyState');

  if (searches.length === 0) {
    listContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  listContainer.innerHTML = searches.map(search => `
    <div class="sidebar-search-item" data-id="${search.id}" style="border-left-color: ${search.color}">
      <div class="sidebar-item-header">
        <span class="sidebar-item-name">${search.name}</span>
        <span class="sidebar-item-category">${search.category}</span>
      </div>
      <div class="sidebar-item-query">${search.query}</div>
    </div>
  `).join('');

  listContainer.querySelectorAll('.sidebar-search-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      const search = searches.find(s => s.id === id);
      if (search) {
        await StorageManager.incrementUseCount(id);
        applySearchToPage(search.query);
        sidebarVisible = false;
        updateSidebarVisibility();
      }
    });
  });
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

function isSearchPage() {
  return window.location.pathname.includes('/search') ||
         window.location.pathname === '/explore';
}

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