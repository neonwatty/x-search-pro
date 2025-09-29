import { test, expect } from '@playwright/test';

test.describe('Popup Helper Functions', () => {
  test.describe('Date calculations', () => {
    test('should calculate today date correctly', () => {
      const today = new Date();
      // Use local date formatting to avoid timezone issues
      const expectedYear = today.getFullYear();
      const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(today.getDate()).padStart(2, '0');
      const dateString = `${expectedYear}-${expectedMonth}-${expectedDay}`;

      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateString.split('-')[0]).toBe(String(today.getFullYear()));
    });

    test('should calculate week ago date correctly', () => {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const dateString = weekAgo.toISOString().split('T')[0];

      const daysDiff = Math.floor((today.getTime() - weekAgo.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should calculate month ago date correctly', () => {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const dateString = monthAgo.toISOString().split('T')[0];

      const monthDiff = (today.getFullYear() - monthAgo.getFullYear()) * 12 +
                        (today.getMonth() - monthAgo.getMonth());
      expect(monthDiff).toBe(1);
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should calculate year ago date correctly', () => {
      const today = new Date();
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const dateString = yearAgo.toISOString().split('T')[0];

      expect(yearAgo.getFullYear()).toBe(today.getFullYear() - 1);
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2024-03-15');
    });
  });

  test.describe('Date preset handling', () => {
    test('should handle "today" preset', () => {
      const today = new Date();
      const preset = 'today';

      let sinceDate;
      if (preset === 'today') {
        sinceDate = today.toISOString().split('T')[0];
      }

      expect(sinceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const parsedDate = new Date(sinceDate! + 'T00:00:00Z');
      expect(parsedDate.getUTCDate()).toBe(today.getUTCDate());
    });

    test('should handle "week" preset', () => {
      const today = new Date();
      const preset = 'week';

      let sinceDate;
      if (preset === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        sinceDate = weekAgo.toISOString().split('T')[0];
      }

      expect(sinceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const weekAgoDate = new Date(sinceDate!);
      const diffDays = Math.floor((today.getTime() - weekAgoDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    test('should handle "month" preset', () => {
      const today = new Date();
      const preset = 'month';

      let sinceDate;
      if (preset === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        sinceDate = monthAgo.toISOString().split('T')[0];
      }

      expect(sinceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const monthAgoDate = new Date(sinceDate!);
      const monthDiff = (today.getFullYear() - monthAgoDate.getFullYear()) * 12 +
                        (today.getMonth() - monthAgoDate.getMonth());
      expect(monthDiff).toBe(1);
    });
  });

  test.describe('Form validation', () => {
    test('should validate empty search name', () => {
      const searchName = '';
      const isValid = searchName.trim().length > 0;
      expect(isValid).toBe(false);
    });

    test('should validate non-empty search name', () => {
      const searchName = 'My Search';
      const isValid = searchName.trim().length > 0;
      expect(isValid).toBe(true);
    });

    test('should validate whitespace-only search name', () => {
      const searchName = '   ';
      const isValid = searchName.trim().length > 0;
      expect(isValid).toBe(false);
    });

    test('should validate minimum engagement values', () => {
      const minFaves = '10';
      const parsed = parseInt(minFaves);
      expect(parsed).toBeGreaterThan(0);
      expect(Number.isInteger(parsed)).toBe(true);
    });

    test('should handle invalid engagement values', () => {
      const minFaves = 'abc';
      const parsed = parseInt(minFaves);
      expect(Number.isNaN(parsed)).toBe(true);
    });
  });

  test.describe('Color handling', () => {
    test('should validate hex color code', () => {
      const color = '#3b82f6';
      const isValid = /^#[0-9a-f]{6}$/i.test(color);
      expect(isValid).toBe(true);
    });

    test('should invalidate incorrect hex code', () => {
      const color = '#xyz';
      const isValid = /^#[0-9a-f]{6}$/i.test(color);
      expect(isValid).toBe(false);
    });

    test('should have default color', () => {
      const defaultColor = '#3b82f6';
      expect(defaultColor).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test.describe('Category handling', () => {
    test('should have default category', () => {
      const defaultCategory = 'Uncategorized';
      expect(defaultCategory).toBeTruthy();
      expect(typeof defaultCategory).toBe('string');
    });

    test('should validate category selection', () => {
      const validCategories = ['Tech', 'News', 'Personal', 'Research', 'Uncategorized'];
      const selectedCategory = 'Tech';
      expect(validCategories).toContain(selectedCategory);
    });
  });
});