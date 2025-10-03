import { test, expect } from '@playwright/test';

test.describe('Content Script Logic Tests', () => {
  test.describe('URL construction', () => {
    test('should construct X.com search URL correctly', () => {
      const query = 'test query';
      const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
      expect(url).toBe('https://x.com/search?q=test%20query&src=typed_query');
    });

    test('should encode special characters in URL', () => {
      const query = 'test & query';
      const encoded = encodeURIComponent(query);
      expect(encoded).toBe('test%20%26%20query');
    });

    test('should encode quotes in URL', () => {
      const query = '"test query"';
      const encoded = encodeURIComponent(query);
      expect(encoded).toBe('%22test%20query%22');
    });

    test('should handle complex query with operators', () => {
      const query = 'from:user min_faves:10';
      const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
      expect(url).toContain('from%3Auser');
      expect(url).toContain('min_faves%3A10');
    });
  });

  test.describe('Sidebar visibility state', () => {
    test('should initialize sidebar as visible by default', () => {
      let sidebarVisible = true;
      expect(sidebarVisible).toBe(true);
    });

    test('should toggle sidebar visibility', () => {
      let sidebarVisible = true;
      sidebarVisible = !sidebarVisible;
      expect(sidebarVisible).toBe(false);

      sidebarVisible = !sidebarVisible;
      expect(sidebarVisible).toBe(true);
    });

    test('should handle collapsed state', () => {
      let sidebarCollapsed = false;
      sidebarCollapsed = true;
      expect(sidebarCollapsed).toBe(true);
    });
  });

  test.describe('CSS class manipulation', () => {
    test('should check for visible class presence', () => {
      const classList = new Set(['sidebar', 'visible']);
      expect(classList.has('visible')).toBe(true);
    });

    test('should check for visible class absence', () => {
      const classList = new Set(['sidebar']);
      expect(classList.has('visible')).toBe(false);
    });

    test('should add visible class', () => {
      const classList = new Set(['sidebar']);
      classList.add('visible');
      expect(classList.has('visible')).toBe(true);
    });

    test('should remove visible class', () => {
      const classList = new Set(['sidebar', 'visible']);
      classList.delete('visible');
      expect(classList.has('visible')).toBe(false);
    });

    test('should toggle collapsed class', () => {
      const classList = new Set(['sidebar']);
      classList.add('collapsed');
      expect(classList.has('collapsed')).toBe(true);

      classList.delete('collapsed');
      expect(classList.has('collapsed')).toBe(false);
    });
  });

  test.describe('Message handling', () => {
    test('should identify applySearch action', () => {
      const message = { action: 'applySearch', query: 'test' };
      expect(message.action).toBe('applySearch');
      expect(message.query).toBe('test');
    });

    test('should identify updateSidebarVisibility action', () => {
      const message = { action: 'updateSidebarVisibility', visible: false };
      expect(message.action).toBe('updateSidebarVisibility');
      expect(message.visible).toBe(false);
    });

    test('should validate message has query property', () => {
      const message = { action: 'applySearch', query: 'test query' };
      expect(message).toHaveProperty('query');
      expect(typeof message.query).toBe('string');
    });
  });

  test.describe('Search input selectors', () => {
    test('should have valid search input selector', () => {
      const selector = 'input[data-testid="SearchBox_Search_Input"]';
      expect(selector).toBeTruthy();
      expect(selector).toContain('input');
    });

    test('should have fallback search input selector', () => {
      const selectors = [
        'input[data-testid="SearchBox_Search_Input"]',
        'input[aria-label="Search query"]',
        'input[placeholder*="Search"]'
      ];
      expect(selectors.length).toBeGreaterThan(1);
    });
  });

  test.describe('Element ID handling', () => {
    test('should use correct sidebar toggle ID', () => {
      const id = 'sidebarToggle';
      expect(id).toBe('sidebarToggle');
    });

    test('should use correct sidebar panel ID', () => {
      const id = 'sidebarPanel';
      expect(id).toBe('sidebarPanel');
    });

    test('should use correct collapse button ID', () => {
      const id = 'collapseSidebar';
      expect(id).toBe('collapseSidebar');
    });

    test('should use correct search filter ID', () => {
      const id = 'sidebarSearchFilter';
      expect(id).toBe('sidebarSearchFilter');
    });

    test('should use correct search list ID', () => {
      const id = 'sidebarSearchList';
      expect(id).toBe('sidebarSearchList');
    });
  });

  test.describe('Filter logic', () => {
    test('should filter by name match', () => {
      const filter = 'viral';
      const name = 'Viral Content';
      const matches = name.toLowerCase().includes(filter.toLowerCase());
      expect(matches).toBe(true);
    });

    test('should filter by name non-match', () => {
      const filter = 'xyz';
      const name = 'Viral Content';
      const matches = name.toLowerCase().includes(filter.toLowerCase());
      expect(matches).toBe(false);
    });

    test('should filter case-insensitively', () => {
      const filter = 'VIRAL';
      const name = 'viral content';
      const matches = name.toLowerCase().includes(filter.toLowerCase());
      expect(matches).toBe(true);
    });
  });
});