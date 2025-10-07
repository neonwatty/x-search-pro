# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

X Search Pro is a Chrome extension (Manifest V3) that allows users to build a personal library of X/Twitter searches with smart auto-updating time ranges. Built with vanilla JavaScript, no frameworks or build tools required.

**Key Feature**: Sliding window searches - searches with `slidingWindow` property ('1d', '1w', '1m') that automatically update their date ranges when applied, ensuring searches always show recent content without manual date adjustments.

## Development Commands

```bash
# Code quality
npm run lint              # ESLint - check for code issues
npm run typecheck         # TypeScript type checking

# Testing
npm test                  # Unit tests only (fast, no X.com credentials needed)
npm run test:install      # Install Playwright browsers (first time only)
npm run test:unit         # Same as npm test
npm run test:e2e          # Full E2E tests (requires .env with X.com credentials)
npm run test:e2e:headed   # E2E with visible browser
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:debug    # Debug mode with inspector
npm run test:workflows    # Workflow tests only
npm run test:report       # Open HTML test report

# Pre-push validation (runs automatically via Husky)
npm run validate:pre-push # Lint + typecheck + unit + e2e tests

# Build
npm run build:zip         # Create distribution zip for Chrome Web Store
```

## Architecture

### Core Components

**Extension Structure** (Manifest V3):
- `manifest.json` - Extension configuration with permissions for storage, activeTab, and x.com/twitter.com hosts
- `background/service-worker.js` - Background service worker that initializes default templates on install
- `popup/` - Extension popup UI with tabs for Search Builder, Saved Searches, Categories, and Settings
- `content/content.js` - Content script injected into x.com/twitter.com pages that manages sidebar and applies searches
- `lib/` - Shared libraries loaded by both popup and content scripts

**Shared Libraries** (`lib/`):
- `query-builder.js` - `QueryBuilder` class that builds X search queries from filter objects
- `storage.js` - `StorageManager` singleton for Chrome storage operations (uses `chrome.storage.sync`)
- `templates.js` - Default search templates initialized on first install

### Data Flow

1. **Creating a search**: User fills form in popup → `QueryBuilder` generates query string → `StorageManager.saveSearch()` saves to Chrome sync storage
2. **Applying a search**: User clicks search (popup or sidebar) → Query rebuilt (with fresh dates if `slidingWindow` set) → Message sent to content script → `applySearchToPage()` fills search box on x.com
3. **Sliding windows**: When search has `filters.slidingWindow` ('1d'/'1w'/'1m'), `QueryBuilder.calculateSlidingDates()` recalculates `since`/`until` dates dynamically when building query

### Storage Schema

Uses `chrome.storage.sync` with these keys:
- `savedSearches` - Array of search objects with `{id, name, query, filters, category, color, isCustomColor, slidingWindow, useCount}`
- `categories` - Array of category names
- `categoryColors` - Object mapping category names to hex colors
- `sidebarVisible` - Boolean for sidebar toggle state
- `sidebarCollapsed` - Boolean for sidebar collapsed state
- `templatesInitialized` - Boolean flag to prevent re-initializing default templates

### Query Building System

`QueryBuilder` class supports:
- Engagement filters: `min_faves`, `min_retweets`, `min_replies` (also max versions using negative syntax)
- Date filters: Fixed dates OR sliding windows that auto-update
- User filters: `from:`, `to:`, `@mention`, `filter:blue_verified`, `filter:follows`
- Content filters: `filter:media/images/videos/links/replies/retweets/quote`
- Language: `lang:XX`

**Critical sliding window logic** (`query-builder.js:163-193`):
- If `filters.slidingWindow` is set, `calculateSlidingDates()` computes fresh dates relative to today
- This ensures searches with sliding windows always show recent content when applied

### Sidebar System

The sidebar (`content/content.js:66-147`) is injected into x.com pages:
- Persists across page navigations via `MutationObserver` watching for SPA route changes
- Toggle button pinned to right edge of screen
- Sidebar panel slides in/out with CSS transforms
- Can be collapsed to icon-only view
- Syncs with storage changes in real-time via `chrome.storage.onChanged` listener

## Testing

### Test Structure
- `tests/unit/` - Fast unit tests for QueryBuilder, storage, templates (97 tests)
- `tests/e2e/workflows/` - End-to-end tests using test page (fast, no auth required)
- `tests/fixtures/` - Custom Playwright fixtures for extension context
  - `test-page.html` - Lightweight HTML page that mimics X.com structure for testing
  - `extension.ts` - Extension fixture that uses `manifest.test.json` for file:// access
- `tests/page-objects/` - Page object models (PopupPage, SidebarPage)
- `tests/helpers/` - Test helpers
  - `test-page-helpers.ts` - TestPageHelpers for test page navigation
  - `x-page-helpers.ts` - XPageHelpers for X.com integration tests (2 tests only)
- `tests/setup/` - Auth setup for X.com integration tests (rarely needed)

### Test Page Architecture

**Why**: X.com authentication rate limits make automated testing unreliable. 97% of E2E tests only test sidebar/popup UI, not actual X.com functionality.

**How it works**:
1. `manifest.test.json` - Test manifest that includes `file:///*` in content_scripts matches
2. `test-page.html` - Mock page with X.com-compatible data attributes and test helpers
3. `TestPageHelpers` - Helper class for navigating to test page and verifying sidebar behavior
4. Extension fixture creates temp extension directory with test manifest for each test run

**Test page features**:
- Mock search input with `data-testid="SearchBox_Search_Input"`
- Mock account switcher button for login checks
- JavaScript helpers: `window.getTestPageState()`, `window.resetTestPageState()`
- Search history tracking: `window.__SEARCH_HISTORY__`

**X.com integration tests** (2 tests in `apply-saved-search.spec.ts`):
- "should apply saved search from sidebar on X.com" - Tests actual search application
- "should apply sliding window search with fresh dates from sidebar" - Tests sliding window dates on X.com
- These require `.env` with X.com credentials and may hit rate limits

### Parallel Test Execution

**Performance**: Tests run with **4 workers in parallel** (3-4x faster than sequential)

**How it works**:
- Each worker gets isolated Chrome profile: `tests/.auth/user-data-worker-${workerIndex}`
- Each worker gets isolated extension directory: `/tmp/x-search-pro-test-extension-worker-${workerIndex}`
- No storage conflicts between parallel tests
- Config: `fullyParallel: true`, `workers: 4` locally, `workers: 2` in CI

**Speed improvements**:
- 13 tests: 17.6s (was ~65s sequential)
- 15 tests: 30.2s (was ~90s sequential)
- Full E2E suite: ~25-35s (was 2-3 minutes)

### Running Individual Tests
```bash
# Single test file (uses test page, no auth needed)
npx playwright test tests/unit/query-builder.spec.ts

# E2E test with test page (fast)
npx playwright test tests/e2e/workflows/create-save-search.spec.ts

# Single test by name
npx playwright test -g "sliding window"

# Debug specific test
npx playwright test tests/e2e/workflows/sliding-window.spec.ts --debug

# X.com integration tests only (requires .env)
npx playwright test tests/e2e/workflows/apply-saved-search.spec.ts -g "on X.com"
```

### E2E Test Requirements
- **Most E2E tests**: No requirements! Run instantly with test page
- **X.com integration tests** (2 tests): Require `.env` file with X.com credentials
- Create placeholder auth file to skip setup: `echo '{}' > tests/.auth/user.json`
- Never commit `.env` or auth state files

## Common Patterns

### Adding a New Filter to QueryBuilder
1. Add property to `filters` object in constructor (`query-builder.js:3-31`)
2. Add setter method (`setFoo(value) { this.filters.foo = value; return this; }`)
3. Add filter logic in `build()` method to generate X search syntax
4. Update popup form HTML and `getFormValues()` in `popup.js`
5. Add unit tests in `tests/unit/query-builder.spec.ts`

### Storage Operations
Always use `StorageManager` methods, never direct `chrome.storage` calls:
```javascript
// Get searches
const searches = await StorageManager.getSavedSearches();

// Save new search
await StorageManager.saveSearch({ name, query, filters, category });

// Update search
await StorageManager.updateSearch(id, { name: 'New Name' });

// Delete search
await StorageManager.deleteSearch(id);
```

### Writing E2E Tests

**Most tests (test page - fast, no auth)**:
```javascript
import { test } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { TestPageHelpers } from '../../helpers/test-page-helpers';

test('your test', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const testPageHelper = new TestPageHelpers(page);
  await testPageHelper.navigateToTestPage();

  const sidebar = new SidebarPage(page);
  await sidebar.waitForInjection();
  await sidebar.ensureVisible();

  // Test sidebar interactions
  await sidebar.fillKeywords('AI');
  const preview = await sidebar.getQueryPreview();
  // ... assertions
});
```

**X.com integration tests (only when absolutely necessary)**:
```javascript
import { test } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test('your X.com test', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const xHelper = new XPageHelpers(page);
  await xHelper.navigateToExplore();

  const sidebar = new SidebarPage(page);
  await sidebar.waitForInjection();

  // Test actual X.com search application
  await sidebar.applySavedSearch('My Search');
  await xHelper.verifyOnSearchPage();
});
```

## Important Constraints

- **No build step**: Pure JavaScript, no transpilation. Keep code browser-compatible.
- **No external dependencies**: Extension code uses only Chrome APIs and vanilla JS. Development dependencies (Playwright, TypeScript, ESLint) are for testing/linting only.
- **Chrome sync storage limits**: 100KB quota, max 8KB per item. Keep saved searches lean.
- **X.com DOM changes**: Search input selectors in `content.js:24-27` may need updates if X.com redesigns their UI.
- **Manifest V3 only**: No `chrome.runtime.sendMessage` from popup to content script (different contexts). Use `chrome.tabs.sendMessage` instead.

## Pre-Push Hook

Husky runs full validation suite before every `git push`:
1. ESLint
2. TypeScript type checking
3. Unit tests (97 tests)
4. E2E tests (parallel execution with 4 workers, no X.com auth required!)

Total time: ~30-45 seconds with parallel execution (was 2-3 minutes before!). Bypass with `git push --no-verify` (emergencies only).

## Local Testing Workflow

1. Make code changes
2. Go to `chrome://extensions/`
3. Click reload icon on "X Search Pro" extension card
4. Test on x.com or twitter.com
5. Run `npm test` to verify unit tests
6. Run `npm run test:e2e:headed` to see E2E tests in action (uses test page, fast!)
7. X.com integration tests only needed for major releases (run monthly)
