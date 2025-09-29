# E2E Testing with Playwright

Comprehensive end-to-end testing for the X Search Pro Chrome extension using Playwright.

## Prerequisites

- Node.js 18+
- Dedicated X.com test account
- Chrome/Chromium browser

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npm run test:install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and add your X.com test credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
TEST_X_USERNAME=your_test_username
TEST_X_PASSWORD=your_test_password
```

**Important**: Never commit your `.env` file. It's already in `.gitignore`.

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in Headed Mode (with Browser UI)
```bash
npm run test:e2e:headed
```

### Run Tests with Playwright UI
```bash
npm run test:e2e:ui
```

### Run Specific Test Suite
```bash
npm run test:workflows      # Run workflow tests only
npm run test:unit           # Run unit tests only
```

### Run Single Test File
```bash
npx playwright test tests/e2e/workflows/create-save-search.spec.ts
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── setup/
│   └── auth.setup.ts              # X.com authentication
├── unit/
│   └── query-builder.spec.ts      # QueryBuilder unit tests
├── e2e/
│   ├── workflows/
│   │   ├── create-save-search.spec.ts
│   │   └── apply-saved-search.spec.ts
│   ├── popup/                     # Popup UI tests
│   ├── content/                   # Content script tests
│   └── integration/               # Integration tests
├── fixtures/
│   └── extension.ts               # Extension context fixture
├── helpers/
│   └── x-page-helpers.ts          # X.com page helpers
└── page-objects/
    ├── PopupPage.ts               # Popup page object
    └── SidebarPage.ts             # Sidebar page object
```

## Authentication

Tests use a global setup that:
1. Logs into X.com once with your test credentials
2. Saves the authentication state to `tests/.auth/user.json`
3. Reuses this state across all E2E tests

This approach:
- **Speeds up tests** (no repeated logins)
- **Tests real X.com integration** with authenticated sessions
- **Maintains security** (credentials only in `.env`)

## Test Projects

The test suite is organized into 3 projects:

### 1. Setup (`--project=setup`)
- Authenticates with X.com
- Runs before E2E tests
- Creates `tests/.auth/user.json`

### 2. Unit (`--project=unit`)
- Tests library functions (QueryBuilder, etc.)
- No X.com authentication needed
- Fast execution

### 3. E2E (`--project=e2e`)
- Tests full user workflows
- Uses saved authentication state
- Tests real X.com integration

## Writing Tests

### Example: Basic Workflow Test

```typescript
import { test, expect } from '../../fixtures/extension';
import { PopupPage } from '../../page-objects/PopupPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('My Workflow', () => {
  test('should do something', async ({ context, extensionId }) => {
    // Create X.com page (authenticated)
    const page = await context.newPage();
    const xHelper = new XPageHelpers(page);
    await xHelper.navigateToExplore();

    // Open extension popup
    const popupPage = new PopupPage(
      await context.newPage(),
      extensionId
    );
    await popupPage.open();

    // Test your workflow
    await popupPage.fillKeywords('test');
    await popupPage.clickApply();

    // Verify on X.com
    await xHelper.verifyOnSearchPage();
  });
});
```

## Page Objects

Use page objects for cleaner, reusable test code:

### PopupPage
```typescript
const popupPage = new PopupPage(page, extensionId);
await popupPage.open();
await popupPage.fillKeywords('test');
await popupPage.setMinFaves(50);
await popupPage.clickApply();
```

### SidebarPage
```typescript
const sidebar = new SidebarPage(page);
await sidebar.waitForInjection();
await sidebar.toggle();
await sidebar.clickSearch('Viral Content');
```

### XPageHelpers
```typescript
const xHelper = new XPageHelpers(page);
await xHelper.navigateToExplore();
await xHelper.verifySearchApplied('min_faves:50');
await xHelper.verifyOnSearchPage();
```

## Test Coverage

Current test coverage includes:

### Workflow Tests
- ✓ Create & Save Search (with X.com integration)
- ✓ Apply Saved Search from Sidebar
- ✓ Apply Saved Search from Popup
- ✓ Filter Saved Searches

### Unit Tests
- ✓ QueryBuilder (17 test cases)
  - Engagement filters
  - Date filters
  - User filters
  - Content type filters
  - Complex queries
  - Reset functionality

### Component Tests
- Popup UI interactions
- Sidebar injection & behavior
- Search application on X.com

## Troubleshooting

### Authentication Fails
1. Verify credentials in `.env` are correct
2. Check if X.com login UI has changed
3. Try running setup manually: `npm run test:setup`
4. Delete `tests/.auth/user.json` and re-run

### Extension Not Loading
1. Verify `manifest.json` is valid
2. Check extension files are built
3. Look for errors in Playwright output
4. Run in headed mode to see browser: `npm run test:e2e:headed`

### Tests Are Flaky
1. Increase timeouts in test
2. Add explicit waits for elements
3. Check network conditions
4. Verify X.com selectors haven't changed

### Can't Find Element
1. X.com may have changed their HTML
2. Update selectors in page helpers
3. Use Playwright Inspector: `npm run test:e2e:debug`
4. Check if element is in iframe

## CI/CD Integration

Tests can run in GitHub Actions:

```yaml
- name: Create .env file
  run: |
    echo "TEST_X_USERNAME=${{ secrets.TEST_X_USERNAME }}" >> .env
    echo "TEST_X_PASSWORD=${{ secrets.TEST_X_PASSWORD }}" >> .env

- name: Run tests
  run: npm run test:e2e
```

Add `TEST_X_USERNAME` and `TEST_X_PASSWORD` to repository secrets.

## Best Practices

1. **Use Page Objects** - Encapsulate page logic
2. **Wait for Elements** - Always wait for visibility
3. **Test Isolation** - Each test should be independent
4. **Descriptive Names** - Test names should explain intent
5. **Clean Up** - Close pages/contexts after tests
6. **Mock When Needed** - Mock prompts, alerts, confirms
7. **Verify State** - Assert expected outcomes
8. **Handle Timing** - Use proper waits, not fixed timeouts

## Performance Tips

- Tests run with `workers: 1` (extension requires isolation)
- Authentication cached (no repeated logins)
- Unit tests run in parallel to E2E tests
- Use `--headed=false` in CI for faster execution

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Support

For issues or questions:
1. Check test output and screenshots in `test-results/`
2. View HTML report: `npm run test:report`
3. Run in debug mode: `npm run test:e2e:debug`
4. Check X.com selectors are up to date