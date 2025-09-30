# Testing Guide

Comprehensive testing for X Search Pro using Playwright for E2E and unit tests.

## Prerequisites

- Node.js 18+
- Chrome/Chromium browser
- Dedicated X.com test account (for E2E tests only)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (first time only)
npm run test:install

# 3. Create .env file for E2E tests
cp .env.example .env
# Edit .env and add your X.com test credentials:
#   TEST_X_USERNAME=your_test_username
#   TEST_X_PASSWORD=your_test_password

# 4. Run tests
npm test                 # Unit tests only (no credentials needed)
npm run test:e2e         # Full E2E suite (requires credentials)
```

**Important**: Never commit your `.env` file. It's already in `.gitignore`.

## Running Tests

```bash
# Quick tests (no X.com credentials needed)
npm test                      # Unit tests only (~5 seconds)
npm run lint                  # ESLint
npm run typecheck             # TypeScript validation

# E2E tests (requires X.com credentials)
npm run test:e2e              # All E2E tests (headless)
npm run test:e2e:headed       # E2E with visible browser
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:debug        # Debug mode with inspector

# Specific test suites
npm run test:workflows        # Workflow tests only
npm run test:unit             # Alias for npm test

# View results
npm run test:report           # Open HTML report
```

**Pro tip**: Run `npm test` frequently during development. It's fast and catches most issues.

## Test Structure

```
tests/
├── setup/                         # X.com authentication setup
├── unit/                          # Unit tests (QueryBuilder, etc.)
├── e2e/workflows/                 # End-to-end workflow tests
├── fixtures/                      # Test fixtures (extension context)
├── helpers/                       # Page helpers (X.com interactions)
└── page-objects/                  # Page object models (PopupPage, SidebarPage)
```

## How Testing Works

### Test Projects

1. **Setup** - Authenticates with X.com once, saves session to `tests/.auth/user.json`
2. **Unit** - Fast tests for library functions (QueryBuilder, storage, etc.) - no authentication needed
3. **E2E** - Full workflow tests using saved authentication - tests real X.com integration

### Authentication

E2E tests use a global setup that:
- Logs into X.com once with your test credentials
- Saves authentication state to `tests/.auth/user.json`
- Reuses this state across all tests (no repeated logins)

This approach is **fast** (single login), **secure** (credentials in `.env` only), and **realistic** (tests actual X.com pages).

## Writing Tests

Use page objects for clean, maintainable tests:

```typescript
import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test('create and apply search', async ({ context, extensionId }) => {
  // Setup X.com page (authenticated)
  const page = await context.newPage();
  const xHelper = new XPageHelpers(page);
  await xHelper.navigateToExplore();

  // Open popup and create search
  const popup = new PopupPage(await context.newPage(), extensionId);
  await popup.open();
  await popup.fillKeywords('test');
  await popup.setMinFaves(50);
  await popup.clickApply();

  // Verify on X.com
  await xHelper.verifySearchApplied('min_faves:50');
});
```

### Available Page Objects

- **PopupPage** - Extension popup interactions
- **SidebarPage** - Sidebar toggle and search selection
- **XPageHelpers** - X.com page navigation and verification

## Test Coverage

### Unit Tests (97 tests)
- QueryBuilder - Engagement, date, user, content type filters
- Storage operations
- Template loading

### E2E Workflow Tests
- Create & save search with X.com integration
- Apply saved searches from sidebar and popup
- Filter saved searches
- Category management

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Authentication fails** | 1. Verify `.env` credentials<br>2. Delete `tests/.auth/user.json` and re-run<br>3. Run `npm run test:setup` manually |
| **Extension not loading** | 1. Check `manifest.json` is valid<br>2. Run in headed mode: `npm run test:e2e:headed` |
| **Flaky tests** | 1. Increase timeouts<br>2. Add explicit waits<br>3. Check X.com selectors haven't changed |
| **Can't find element** | 1. Use debug mode: `npm run test:e2e:debug`<br>2. Update selectors in page helpers<br>3. Check if X.com HTML changed |

## CI/CD Integration

Add test credentials to GitHub Actions secrets, then:

```yaml
- name: Create .env file
  run: |
    echo "TEST_X_USERNAME=${{ secrets.TEST_X_USERNAME }}" >> .env
    echo "TEST_X_PASSWORD=${{ secrets.TEST_X_PASSWORD }}" >> .env

- name: Run tests
  run: npm run test:e2e
```

## Best Practices

- ✅ Use page objects for reusable code
- ✅ Wait for elements (avoid fixed timeouts)
- ✅ Keep tests isolated and independent
- ✅ Use descriptive test names
- ✅ Run unit tests frequently during development
- ✅ Check HTML report after failures: `npm run test:report`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)