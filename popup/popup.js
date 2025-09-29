let currentBuilder = new QueryBuilder();

document.addEventListener('DOMContentLoaded', async () => {
  await initializeTemplates();
  initializeTabs();
  initializeCollapsibleSections();
  initializeDefaultDates();
  initializeDatePresets();
  initializeFormListeners();
  initializeButtons();
  await loadSavedSearches();
  await loadSettings();
  await initializeCategoriesTab();
  await initializeCategoryDropdown();
});

function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });

      document.getElementById(`${targetTab}-tab`).classList.remove('hidden');

      if (targetTab === 'saved') {
        loadSavedSearches();
      } else if (targetTab === 'categories') {
        loadCategoriesList();
      }
    });
  });
}

function initializeCollapsibleSections() {
  const sections = document.querySelectorAll('.collapsible');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });
  });
}

function initializeDefaultDates() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sinceDate = document.getElementById('sinceDate');
  const untilDate = document.getElementById('untilDate');

  sinceDate.value = weekAgo.toISOString().split('T')[0];
  untilDate.value = today.toISOString().split('T')[0];

  updateQueryPreview();
}

function initializeDatePresets() {
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const today = new Date();
      const sinceDate = document.getElementById('sinceDate');

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

      updateQueryPreview();
    });
  });
}

function initializeFormListeners() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('input', updateQueryPreview);
    input.addEventListener('change', updateQueryPreview);
  });
}

function initializeButtons() {
  document.getElementById('applyBtn').addEventListener('click', applySearch);
  document.getElementById('saveBtn').addEventListener('click', saveSearch);
  document.getElementById('resetBtn').addEventListener('click', resetForm);
  document.getElementById('searchFilter').addEventListener('input', filterSavedSearches);
}

function getFormValues() {
  const filters = {
    keywords: document.getElementById('keywords').value,
    minFaves: document.getElementById('minFaves').value || null,
    minRetweets: document.getElementById('minRetweets').value || null,
    minReplies: document.getElementById('minReplies').value || null,
    sinceDate: document.getElementById('sinceDate').value || null,
    untilDate: document.getElementById('untilDate').value || null,
    fromUser: document.getElementById('fromUser').value || null,
    toUser: document.getElementById('toUser').value || null,
    mentionsUser: document.getElementById('mentionsUser').value || null,
    verified: document.getElementById('verified').checked,
    blueVerified: document.getElementById('blueVerified').checked,
    follows: document.getElementById('follows').checked,
    hasMedia: document.getElementById('hasMedia').checked,
    hasImages: document.getElementById('hasImages').checked,
    hasVideos: document.getElementById('hasVideos').checked,
    hasLinks: document.getElementById('hasLinks').checked,
    quoteOnly: document.getElementById('quoteOnly').checked,
    lang: document.getElementById('lang').value || null
  };

  const repliesValue = document.querySelector('input[name="replies"]:checked').value;
  if (repliesValue === 'exclude') filters.includeReplies = false;
  else if (repliesValue === 'only') filters.includeReplies = true;

  const retweetsValue = document.querySelector('input[name="retweets"]:checked').value;
  if (retweetsValue === 'exclude') filters.includeRetweets = false;
  else if (retweetsValue === 'only') filters.includeRetweets = true;

  return filters;
}

function updateQueryPreview() {
  const filters = getFormValues();
  currentBuilder = new QueryBuilder().fromFilters(filters);
  const query = currentBuilder.build();

  const preview = document.getElementById('queryPreview');
  if (query) {
    preview.textContent = query;
    preview.style.color = '#1e3a8a';
  } else {
    preview.textContent = 'Enter search criteria above...';
    preview.style.color = '#9ca3af';
  }
}

async function applySearch() {
  const query = currentBuilder.build();
  if (!query) {
    alert('Please enter search criteria first');
    return;
  }

  let tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] });

  console.log('[DEBUG] applySearch - Found tabs:', tabs.length);
  console.log('[DEBUG] applySearch - Tab details:', tabs.map(t => ({ id: t.id, url: t.url, active: t.active, lastAccessed: t.lastAccessed })));

  if (tabs.length > 0) {
    const activeTab = tabs.find(t => t.active);
    const tab = activeTab || tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];

    console.log('[DEBUG] applySearch - Selected tab:', { id: tab.id, url: tab.url, active: tab.active });
    console.log('[DEBUG] applySearch - Sending message with query:', query);

    try {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'applySearch',
        query: query
      });
      console.log('[DEBUG] applySearch - Message sent successfully, response:', response);
    } catch (error) {
      console.error('[DEBUG] applySearch - Failed to send message, navigating directly:', error);
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
      await chrome.tabs.update(tab.id, { url: searchUrl });
    }

    window.close();
  } else {
    console.log('[DEBUG] applySearch - No X.com tabs found, creating new tab');
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
    await chrome.tabs.create({ url: searchUrl });
    window.close();
  }
}

async function saveSearch() {
  const query = currentBuilder.build();
  if (!query) {
    alert('Please enter search criteria first');
    return;
  }

  const name = prompt('Enter a name for this search:');
  if (!name) return;

  const categorySelect = document.getElementById('searchCategory');
  const selectedCategory = categorySelect.value;
  const filters = getFormValues();

  await StorageManager.saveSearch({
    name: name,
    query: query,
    filters: filters,
    category: selectedCategory
  });

  const categoryColor = await StorageManager.getCategoryColor(selectedCategory);
  alert(`Search saved successfully!\nCategory: ${selectedCategory}\nColor: ${categoryColor}`);
  await loadSavedSearches();
}

function resetForm() {
  document.getElementById('search-form').reset();
  currentBuilder.reset();
  updateQueryPreview();
}

async function loadSavedSearches() {
  const searches = await StorageManager.getSavedSearches();
  const container = document.getElementById('savedSearches');
  const emptyState = document.getElementById('emptyState');

  if (searches.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = searches.map(search => createSavedSearchItem(search)).join('');

  container.querySelectorAll('.saved-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.icon-btn')) {
        applySavedSearch(item.dataset.id);
      }
    });
  });

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editSearch(btn.closest('.saved-item').dataset.id);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSearch(btn.closest('.saved-item').dataset.id);
    });
  });
}

function createSavedSearchItem(search) {
  const useText = search.useCount > 0
    ? `Used ${search.useCount} times`
    : 'Never used';

  return `
    <div class="saved-item" data-id="${search.id}" style="border-left-color: ${search.color}">
      <div class="saved-item-header">
        <div class="saved-item-title">${search.name}</div>
        <div class="saved-item-actions">
          <button class="icon-btn edit-btn" title="Edit">✏️</button>
          <button class="icon-btn delete-btn" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="saved-item-query">${search.query}</div>
      <div class="saved-item-meta">
        <span class="category-badge">${search.category}</span>
        <span>${useText}</span>
      </div>
    </div>
  `;
}

async function applySavedSearch(id) {
  const searches = await StorageManager.getSavedSearches();
  const search = searches.find(s => s.id === id);

  if (!search) return;

  await StorageManager.incrementUseCount(id);

  let tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] });

  console.log('[DEBUG] applySavedSearch - Found tabs:', tabs.length);
  console.log('[DEBUG] applySavedSearch - Tab details:', tabs.map(t => ({ id: t.id, url: t.url, active: t.active, lastAccessed: t.lastAccessed })));

  if (tabs.length > 0) {
    const activeTab = tabs.find(t => t.active);
    const tab = activeTab || tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];

    console.log('[DEBUG] applySavedSearch - Selected tab:', { id: tab.id, url: tab.url, active: tab.active });
    console.log('[DEBUG] applySavedSearch - Sending message with query:', search.query);

    try {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'applySearch',
        query: search.query
      });
      console.log('[DEBUG] applySavedSearch - Message sent successfully, response:', response);
    } catch (error) {
      console.error('[DEBUG] applySavedSearch - Failed to send message, navigating directly:', error);
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(search.query)}&src=typed_query`;
      await chrome.tabs.update(tab.id, { url: searchUrl });
    }

    window.close();
  } else {
    console.log('[DEBUG] applySavedSearch - No X.com tabs found, creating new tab');
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(search.query)}&src=typed_query`;
    await chrome.tabs.create({ url: searchUrl });
    window.close();
  }
}

async function editSearch(id) {
  const searches = await StorageManager.getSavedSearches();
  const search = searches.find(s => s.id === id);

  if (!search) return;

  document.querySelector('.tab[data-tab="builder"]').click();

  const filters = search.filters;
  document.getElementById('keywords').value = filters.keywords || '';
  document.getElementById('minFaves').value = filters.minFaves || '';
  document.getElementById('minRetweets').value = filters.minRetweets || '';
  document.getElementById('minReplies').value = filters.minReplies || '';
  document.getElementById('sinceDate').value = filters.sinceDate || '';
  document.getElementById('untilDate').value = filters.untilDate || '';
  document.getElementById('fromUser').value = filters.fromUser || '';
  document.getElementById('toUser').value = filters.toUser || '';
  document.getElementById('mentionsUser').value = filters.mentionsUser || '';
  document.getElementById('verified').checked = filters.verified || false;
  document.getElementById('blueVerified').checked = filters.blueVerified || false;
  document.getElementById('follows').checked = filters.follows || false;
  document.getElementById('hasMedia').checked = filters.hasMedia || false;
  document.getElementById('hasImages').checked = filters.hasImages || false;
  document.getElementById('hasVideos').checked = filters.hasVideos || false;
  document.getElementById('hasLinks').checked = filters.hasLinks || false;
  document.getElementById('quoteOnly').checked = filters.quoteOnly || false;
  document.getElementById('lang').value = filters.lang || '';

  if (filters.includeReplies === false) {
    document.querySelector('input[name="replies"][value="exclude"]').checked = true;
  } else if (filters.includeReplies === true) {
    document.querySelector('input[name="replies"][value="only"]').checked = true;
  } else {
    document.querySelector('input[name="replies"][value="any"]').checked = true;
  }

  if (filters.includeRetweets === false) {
    document.querySelector('input[name="retweets"][value="exclude"]').checked = true;
  } else if (filters.includeRetweets === true) {
    document.querySelector('input[name="retweets"][value="only"]').checked = true;
  } else {
    document.querySelector('input[name="retweets"][value="any"]').checked = true;
  }

  updateQueryPreview();
}

async function deleteSearch(id) {
  if (!confirm('Are you sure you want to delete this search?')) return;

  await StorageManager.deleteSearch(id);
  await loadSavedSearches();
}

// Export functionality removed

// Import functionality removed

function filterSavedSearches() {
  const filter = document.getElementById('searchFilter').value.toLowerCase();
  const items = document.querySelectorAll('.saved-item');

  items.forEach(item => {
    const name = item.querySelector('.saved-item-title').textContent.toLowerCase();
    const query = item.querySelector('.saved-item-query').textContent.toLowerCase();
    const category = item.querySelector('.category-badge').textContent.toLowerCase();

    if (name.includes(filter) || query.includes(filter) || category.includes(filter)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Category Management Functions
async function initializeCategoriesTab() {
  const addBtn = document.getElementById('addCategoryBtn');
  const nameInput = document.getElementById('newCategoryName');

  addBtn.addEventListener('click', handleAddCategory);

  // Allow Enter key to add category
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  });

  await loadCategoriesList();
}

async function handleAddCategory() {
  const nameInput = document.getElementById('newCategoryName');
  const colorInput = document.getElementById('newCategoryColor');
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    alert('Please enter a category name');
    return;
  }

  try {
    await StorageManager.createCategory(name, color);
    nameInput.value = '';
    colorInput.value = '#6b7280';
    await loadCategoriesList();
    await populateCategoryDropdown(); // Update dropdown in search builder
    await loadSavedSearches(); // Refresh saved searches if visible
  } catch (error) {
    alert(error.message);
  }
}

async function loadCategoriesList() {
  const categories = await StorageManager.getCategories();
  const categoryColors = await StorageManager.getCategoryColors();
  const usageCounts = await StorageManager.getAllCategoryUsageCounts();
  const container = document.getElementById('categoriesList');

  if (!container) return; // Tab not initialized yet

  container.innerHTML = '';

  categories.forEach(category => {
    const color = categoryColors[category] || '#6b7280';
    const count = usageCounts[category] || 0;
    const item = createCategoryItem(category, color, count);
    container.appendChild(item);
  });
}

function createCategoryItem(categoryName, color, usageCount) {
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

  // Color picker event
  const colorPicker = item.querySelector('input[type="color"]');
  colorPicker.addEventListener('change', async (e) => {
    await handleCategoryColorChange(categoryName, e.target.value);
  });

  // Rename button event
  const renameBtn = item.querySelector('.rename-btn');
  renameBtn.addEventListener('click', () => {
    handleRenameCategory(categoryName);
  });

  // Delete button event
  const deleteBtn = item.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    handleDeleteCategory(categoryName, usageCount);
  });

  return item;
}

async function handleCategoryColorChange(categoryName, newColor) {
  await StorageManager.setCategoryColor(categoryName, newColor);
  await StorageManager.updateSearchesInCategory(categoryName, newColor);

  // Update the color preview
  const item = document.querySelector(`[data-category="${categoryName}"]`).closest('.category-item');
  const colorPreview = item.querySelector('.category-item-color');
  colorPreview.style.backgroundColor = newColor;
  item.style.borderLeftColor = newColor;

  // Refresh saved searches to show new colors
  await loadSavedSearches();
}

async function handleRenameCategory(oldName) {
  const newName = prompt(`Rename category "${oldName}" to:`, oldName);

  if (!newName || newName === oldName) return;

  try {
    const result = await StorageManager.renameCategory(oldName, newName);

    if (result.renamed) {
      const message = result.searchesUpdated > 0
        ? `Category renamed successfully! ${result.searchesUpdated} searches updated.`
        : 'Category renamed successfully!';
      alert(message);

      await loadCategoriesList();
      await populateCategoryDropdown(); // Update dropdown in search builder
      await loadSavedSearches();
    }
  } catch (error) {
    alert(error.message);
  }
}

async function handleDeleteCategory(categoryName, usageCount) {
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

      // Small delay to ensure storage write is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      await loadCategoriesList();
      await populateCategoryDropdown(); // Update dropdown in search builder
      await loadSavedSearches();
    }
  } catch (error) {
    alert(error.message);
  }
}

// Category Dropdown in Search Builder
async function initializeCategoryDropdown() {
  const categorySelect = document.getElementById('searchCategory');
  const colorIndicator = document.getElementById('categoryColorIndicator');

  await populateCategoryDropdown();

  categorySelect.addEventListener('change', async () => {
    const selectedCategory = categorySelect.value;
    const categoryColors = await StorageManager.getCategoryColors();
    const color = categoryColors[selectedCategory] || '#6b7280';
    colorIndicator.style.backgroundColor = color;
  });

  // Initialize color indicator
  const initialCategory = categorySelect.value;
  const categoryColors = await StorageManager.getCategoryColors();
  colorIndicator.style.backgroundColor = categoryColors[initialCategory] || '#6b7280';
}

async function populateCategoryDropdown() {
  const categories = await StorageManager.getCategories();
  const categorySelect = document.getElementById('searchCategory');

  categorySelect.innerHTML = categories.map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('');

  // Set default to Uncategorized if it exists
  if (categories.includes('Uncategorized')) {
    categorySelect.value = 'Uncategorized';
  }
}

async function loadSettings() {
  const settings = await chrome.storage.sync.get(['sidebarVisible']);
  const sidebarPinned = document.getElementById('sidebarPinned');

  sidebarPinned.checked = settings.sidebarVisible !== false;

  sidebarPinned.addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ sidebarVisible: e.target.checked });

    const [tab] = await chrome.tabs.query({ active: true, url: ['*://x.com/*', '*://twitter.com/*'] });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSidebarVisibility',
        visible: e.target.checked
      }).catch(() => {});
    }
  });
}