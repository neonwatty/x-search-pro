document.addEventListener('DOMContentLoaded', async () => {
  await initializeTemplates();
  initializeTabs();
  await loadSettings();
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
    });
  });
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
