interface MockStorageData {
  [key: string]: unknown;
}

interface MockTab {
  id: number;
  url: string;
  windowId: number;
  active?: boolean;
  lastAccessed?: number;
}

class MockChromeStorage {
  private data: MockStorageData = {};

  async get(keys: string[]): Promise<MockStorageData> {
    const result: MockStorageData = {};
    keys.forEach(key => {
      if (this.data[key] !== undefined) {
        result[key] = this.data[key];
      }
    });
    return result;
  }

  async set(items: MockStorageData): Promise<void> {
    Object.assign(this.data, items);
  }

  clear(): void {
    this.data = {};
  }

  getData(): MockStorageData {
    return { ...this.data };
  }
}

export class MockChromeTabs {
  private tabs: MockTab[] = [];
  private nextTabId = 1;

  async query(options: { url?: string | string[]; active?: boolean }): Promise<MockTab[]> {
    let filtered = [...this.tabs];

    if (options.url) {
      const patterns = Array.isArray(options.url) ? options.url : [options.url];
      filtered = filtered.filter(tab => {
        return patterns.some((pattern: string) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(tab.url);
        });
      });
    }

    if (options.active) {
      filtered = filtered.filter(tab => tab.active);
    }

    return filtered;
  }

  async update(tabId: number, updateInfo: Partial<MockTab>): Promise<MockTab | undefined> {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, updateInfo);
    }
    return tab;
  }

  async create(createInfo: { url: string }): Promise<MockTab> {
    const newTab: MockTab = {
      id: this.nextTabId++,
      url: createInfo.url,
      windowId: 1,
      active: true,
      lastAccessed: Date.now()
    };
    this.tabs.push(newTab);
    return newTab;
  }

  async sendMessage(_tabId: number, _message: unknown): Promise<{ success: boolean }> {
    return { success: true };
  }

  addTab(tab: Partial<MockTab>): MockTab {
    const newTab: MockTab = {
      id: tab.id || this.nextTabId++,
      url: tab.url || 'https://example.com',
      windowId: tab.windowId || 1,
      active: tab.active,
      lastAccessed: tab.lastAccessed || Date.now()
    };
    this.tabs.push(newTab);
    return newTab;
  }

  getTabs(): MockTab[] {
    return [...this.tabs];
  }

  clear(): void {
    this.tabs = [];
    this.nextTabId = 1;
  }
}

export class MockChromeWindows {
  async update(windowId: number, updateInfo: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { id: windowId, ...updateInfo };
  }
}

export class MockChromeRuntime {
  private messageListeners: Array<(message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => void> = [];

  onMessage = {
    addListener: (callback: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => void) => {
      this.messageListeners.push(callback);
    }
  };

  async sendMessage(_message: unknown): Promise<{ success: boolean }> {
    return { success: true };
  }

  triggerMessage(message: unknown, sender: Record<string, unknown> = {}) {
    this.messageListeners.forEach(listener => {
      listener(message, sender, () => {});
    });
  }
}

export function createMockChrome() {
  return {
    storage: {
      sync: new MockChromeStorage()
    },
    tabs: new MockChromeTabs(),
    windows: new MockChromeWindows(),
    runtime: new MockChromeRuntime()
  };
}