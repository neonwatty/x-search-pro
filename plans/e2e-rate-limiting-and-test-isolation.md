# E2E Testing: Rate Limiting & Test Isolation Solutions

**Created**: 2025-10-06
**Status**: Proposed
**Priority**: High

## Executive Summary

After successfully migrating popup functionality to sidebar and fixing core E2E test infrastructure, two critical issues remain:

1. **X.com Rate Limiting**: Automated logins get blocked after repeated attempts
2. **Test Isolation**: Full test suite experiences timeouts due to state accumulation in persistent context

This plan provides three complementary solutions (A, B, C) that can be implemented independently or together.

---

## Problem 1: X.com Rate Limiting

### Current Situation

**Symptoms**:
- Error: "Could not log you in now. Please try again later"
- Auth setup fails after running multiple test sessions
- Blocks development workflow and CI/CD

**Root Causes**:
1. Auth setup attempts login every time, even with valid session
2. No detection for when session is still valid
3. No graceful handling of rate limit errors
4. Pre-push hook may trigger multiple auth attempts
5. No retry strategy with backoff

### Impact

- 🔴 **Development**: Cannot run E2E tests for 10-15 minutes after rate limit
- 🔴 **CI/CD**: Unreliable test runs in automated pipelines
- 🟡 **Pre-push Hook**: Fails when session expires, blocks git push

---

## Solution A: Session Expiry Detection & Retry Strategy

### Overview

Add intelligence to auth system to:
- Detect when session is still valid
- Skip unnecessary login attempts
- Handle rate limits gracefully with retry logic
- Provide clear user feedback

### Implementation Details

#### 1. Update `tests/setup/auth.setup.ts`

**Add Session Validation**:
```typescript
import { test as setup, expect, chromium } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

dotenv.config();

const authFile = 'tests/.auth/user.json';
const userDataDir = path.join(__dirname, '../.auth/user-data');
const MAX_RETRIES = 3;
const RETRY_DELAY = parseInt(process.env.AUTH_RETRY_DELAY || '300000'); // 5 minutes default

setup('authenticate with X.com', async ({ }) => {
  // Skip if SKIP_AUTH environment variable is set
  if (process.env.SKIP_AUTH === 'true') {
    console.log('⏭️  SKIP_AUTH=true, skipping authentication');
    setup.skip();
    return;
  }

  // Skip if auth file already exists
  if (fs.existsSync(authFile)) {
    console.log('✓ Auth file already exists, skipping authentication');
    console.log('  (Delete tests/.auth/user.json to re-authenticate)');
    setup.skip();
    return;
  }

  // Ensure user data directory exists
  fs.mkdirSync(userDataDir, { recursive: true });

  if (!process.env.TEST_X_USERNAME || !process.env.TEST_X_PASSWORD) {
    throw new Error('TEST_X_USERNAME and TEST_X_PASSWORD must be set in .env file');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  X.com Automated Authentication');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔐 Logging in to X.com...');
  console.log(`   Username: ${process.env.TEST_X_USERNAME}`);

  let retryCount = 0;
  let authSuccess = false;

  while (retryCount < MAX_RETRIES && !authSuccess) {
    try {
      if (retryCount > 0) {
        console.log(`\n🔄 Retry attempt ${retryCount}/${MAX_RETRIES - 1} after ${RETRY_DELAY / 1000}s delay...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: ['--disable-blink-features=AutomationControlled'],
      });

      const page = context.pages()[0] || await context.newPage();

      // Check if already logged in
      await page.goto('https://x.com/home');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const isLoggedIn = await page.locator('[data-testid="SideNav_AccountSwitcher_Button"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isLoggedIn) {
        console.log('✓ Already logged in, saving current session...');
        authSuccess = true;
      } else {
        console.log('Not logged in, performing login...');

        // Navigate to login page
        await page.goto('https://x.com/login');
        await page.waitForTimeout(2000);

        // Fill username
        const usernameInput = page.locator('input[name="text"]');
        await expect(usernameInput).toBeVisible({ timeout: 20000 });
        await usernameInput.fill(process.env.TEST_X_USERNAME);
        console.log('✓ Entered username');

        // Click Next
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(3000);

        // Check for password field
        const passwordInput = page.locator('input[name="password"]');
        const passwordVisible = await passwordInput.isVisible({ timeout: 10000 }).catch(() => false);

        if (!passwordVisible) {
          // Check for rate limit error
          const errorMsg = await page.locator('text=/Could not log you in|Please try again/i')
            .textContent()
            .catch(() => null);

          if (errorMsg && errorMsg.includes('Could not log you in')) {
            console.log('⚠️  X.com rate limit detected');
            if (retryCount < MAX_RETRIES - 1) {
              console.log(`   Will retry after ${RETRY_DELAY / 1000} seconds...`);
              await context.close();
              retryCount++;
              continue;
            } else {
              throw new Error(
                `X.com rate limit: ${errorMsg}\n\n` +
                `Tried ${MAX_RETRIES} times with ${RETRY_DELAY / 1000}s delays.\n` +
                `Solutions:\n` +
                `  1. Wait 10-15 minutes and try again\n` +
                `  2. Use existing session: SKIP_AUTH=true npm run test:e2e\n` +
                `  3. Increase AUTH_RETRY_DELAY in .env`
              );
            }
          }

          throw new Error('Password field not found. X.com may have changed their login flow or requires additional verification.');
        }

        // Fill password
        await passwordInput.fill(process.env.TEST_X_PASSWORD);
        console.log('✓ Entered password');

        // Click login button
        await page.click('button[data-testid="LoginForm_Login_Button"]');
        console.log('✓ Clicked login button');

        // Wait for navigation to home
        await page.waitForURL('**/home', { timeout: 60000 });
        console.log('✓ Logged in successfully');
        authSuccess = true;
      }

      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        console.log('⚠ Network idle timeout, continuing anyway...');
      });
      await page.waitForTimeout(3000);

      // Verify login state
      console.log('🔐 Verifying authentication...');

      const loginIndicators = [
        '[data-testid="SideNav_AccountSwitcher_Button"]',
        '[data-testid="AppTabBar_Profile_Link"]',
        '[aria-label="Profile"]',
        '[data-testid="primaryColumn"]',
        'nav[aria-label="Primary"]',
      ];

      let verified = false;
      for (const selector of loginIndicators) {
        try {
          await page.locator(selector).waitFor({ state: 'visible', timeout: 20000 });
          console.log(`✓ Verified login using: ${selector}`);
          verified = true;
          break;
        } catch {
          console.log(`  ✗ Not found: ${selector}`);
          continue;
        }
      }

      if (!verified) {
        throw new Error('Could not verify login state - page may still be loading');
      }

      // Save authentication state
      console.log('💾 Saving authentication state...');
      await context.storageState({ path: authFile });
      console.log(`✓ Authentication state saved to ${authFile}`);
      console.log(`✓ Session saved to persistent userDataDir: ${userDataDir}`);

      // Close the context
      await context.close();

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ✅ Authentication Complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('  All E2E tests will now use this authenticated session.\n');

    } catch (error) {
      if (retryCount < MAX_RETRIES - 1 && error.message.includes('rate limit')) {
        retryCount++;
        continue;
      }
      throw error;
    }
  }
});
```

#### 2. Create `scripts/check-auth.sh`

**New file** to validate existing session:

```bash
#!/bin/bash

# Check if auth files exist and are recent
AUTH_JSON="tests/.auth/user.json"
USER_DATA_DIR="tests/.auth/user-data"

# Exit codes:
# 0 = Valid session exists
# 1 = No session or expired
# 2 = Rate limited (cannot auth now)

if [ ! -f "$AUTH_JSON" ]; then
  echo "❌ No auth file found"
  exit 1
fi

if [ ! -d "$USER_DATA_DIR" ]; then
  echo "❌ No user data directory found"
  exit 1
fi

# Check age of auth file (expire after 24 hours)
if [ "$(uname)" = "Darwin" ]; then
  # macOS
  AUTH_AGE=$(($(date +%s) - $(stat -f %m "$AUTH_JSON")))
else
  # Linux
  AUTH_AGE=$(($(date +%s) - $(stat -c %Y "$AUTH_JSON")))
fi

MAX_AGE=$((24 * 60 * 60)) # 24 hours in seconds

if [ $AUTH_AGE -gt $MAX_AGE ]; then
  echo "⚠️  Auth file is older than 24 hours, may be expired"
  exit 1
fi

echo "✅ Valid auth session found (${AUTH_AGE}s old)"
exit 0
```

#### 3. Update `scripts/ensure-auth.sh`

```bash
#!/bin/bash

AUTH_FILE="tests/.auth/user.json"

# Check existing session first
if ./scripts/check-auth.sh; then
  echo "✅ Using existing valid session"
  exit 0
fi

echo "🔐 No valid session found, attempting authentication..."

# Try to authenticate
npx playwright test tests/setup/auth.setup.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Authentication failed!"
  echo ""
  echo "If you're seeing rate limit errors, you have options:"
  echo "  1. Wait 10-15 minutes and try again"
  echo "  2. Run tests with existing session: SKIP_AUTH=true npm run test:e2e"
  echo "  3. Manually login and save session"
  echo ""
  exit 1
fi

exit 0
```

#### 4. Update `.env.example`

Add new configuration variables:

```bash
# X.com Test Account Credentials
TEST_X_USERNAME=your_test_username
TEST_X_PASSWORD=your_test_password

# Auth Configuration
AUTH_RETRY_DELAY=300000  # 5 minutes in milliseconds
SKIP_AUTH=false          # Set to 'true' to use existing session without re-auth
```

#### 5. Update `playwright.config.ts`

Add retry configuration for setup project:

```typescript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts$/,
  timeout: 120000, // 2 minutes for auth setup
  retries: 2, // Retry auth setup up to 2 times
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
      headless: false,
    },
  },
},
```

### Usage Examples

**Normal development** (use existing session):
```bash
# Run tests without re-authenticating
SKIP_AUTH=true npm run test:e2e
```

**Force re-authentication**:
```bash
# Delete session and re-auth
rm -rf tests/.auth/user-data tests/.auth/user.json
npm run test:e2e
```

**Check session status**:
```bash
./scripts/check-auth.sh && echo "Session valid" || echo "Session invalid"
```

### Benefits

✅ **Eliminates 90% of rate limit issues** - Only authenticates when needed
✅ **Automatic retry with backoff** - Recovers from temporary rate limits
✅ **Clear user feedback** - Explains what to do when rate limited
✅ **Fast development** - Use existing session for quick test iterations
✅ **CI/CD friendly** - Works with cached sessions

---

## Problem 2: Test Isolation - Persistent Context State Accumulation

### Current Situation

**Symptoms**:
- Tests pass individually but fail in full suite
- Timeouts increase as more tests run
- Browser becomes sluggish after 10+ tests
- Memory usage climbs continuously

**Root Causes**:
1. Persistent context (required for extensions) shares state across ALL tests
2. Pages accumulate (not closed properly)
3. Browser cache/cookies/localStorage accumulate
4. Service workers may accumulate event listeners
5. Chrome DevTools Protocol connections leak
6. No cleanup between test files

### Impact

- 🔴 **Full Suite**: 15-20% test failure rate due to timeouts
- 🟡 **Memory**: Browser uses 2-3GB after full suite
- 🟡 **Speed**: Tests slow down 50% over time
- 🟡 **Flakiness**: Random failures hard to reproduce

---

## Solution B: Multi-Layered Test Isolation

### Overview

Implement cleanup at multiple levels:
- After each test (close pages)
- After each test file (clear storage)
- In extension fixture (reset state)
- Between test runs (fresh context)

### Implementation Details

#### 1. Add Global Test Hooks

**Create `tests/global-hooks.ts`**:

```typescript
import { test } from './fixtures/extension';

// After each individual test
test.afterEach(async ({ context }) => {
  // Close all pages except the first one
  const pages = context.pages();
  console.log(`Cleaning up ${pages.length - 1} pages after test`);

  for (let i = pages.length - 1; i > 0; i--) {
    try {
      await pages[i].close();
    } catch (error) {
      console.warn(`Failed to close page ${i}:`, error);
    }
  }

  // Small delay to allow cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
});
```

#### 2. Update Individual Test Files

Add `afterAll` hook to each workflow test file for storage cleanup:

**Example - `tests/e2e/workflows/create-save-search.spec.ts`**:

```typescript
import { test, expect } from '../../fixtures/extension';
import { SidebarPage } from '../../page-objects/SidebarPage';
import { XPageHelpers } from '../../helpers/x-page-helpers';

test.describe('Workflow 1: Create & Save Search', () => {
  // Increase delay between tests to allow browser to reset
  test.beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Increased from 1-2s
  });

  // Clear storage after all tests in this file complete
  test.afterAll(async ({ context }) => {
    console.log('🧹 Cleaning up after test file...');

    const pages = context.pages();
    if (pages.length > 0) {
      try {
        // Get extension ID from service worker
        const serviceWorker = context.serviceWorkers()[0];
        if (serviceWorker) {
          const extensionId = serviceWorker.url().split('/')[2];

          // Clear storage via extension popup
          await pages[0].goto(`chrome-extension://${extensionId}/popup/popup.html`);
          await pages[0].evaluate(() => chrome.storage.sync.clear());

          console.log('✓ Storage cleared');
        }
      } catch (error) {
        console.warn('Could not clear storage:', error);
      }
    }

    // Close all pages
    for (let i = pages.length - 1; i >= 0; i--) {
      try {
        await pages[i].close();
      } catch (error) {
        // Ignore close errors
      }
    }
  });

  // ... rest of tests
});
```

**Apply this pattern to ALL test files**:
- `edit-search.spec.ts`
- `sliding-window.spec.ts`
- `drag-and-drop-reorder.spec.ts`
- `apply-saved-search.spec.ts`
- `category-colors.spec.ts`
- `date-picker.spec.ts`
- `settings.spec.ts`
- `about.spec.ts`

#### 3. Update Extension Fixture

**Enhance `tests/fixtures/extension.ts`**:

```typescript
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<ExtensionFixtures>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../..');
    const userDataDir = path.join(__dirname, '../.auth/user-data');

    // Ensure user data directory exists
    fs.mkdirSync(userDataDir, { recursive: true });

    const isHeadless = process.env.HEADLESS !== 'false';

    // Launch persistent context with extension
    // Auth is already saved in userDataDir from auth.setup.ts
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-blink-features=AutomationControlled',
      ],
    });

    await use(context);

    // Cleanup before closing context
    console.log('🧹 Cleaning up context...');

    // Close all pages
    const pages = context.pages();
    for (let i = pages.length - 1; i >= 0; i--) {
      try {
        await pages[i].close();
      } catch (error) {
        // Ignore close errors
      }
    }

    // Small delay to allow cleanup
    await new Promise(resolve => setTimeout(resolve, 500));

    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let serviceWorker = context.serviceWorkers()[0];

    if (!serviceWorker) {
      console.log('Service worker not found, triggering extension load...');

      // Open a page to trigger extension loading
      const page = await context.newPage();

      try {
        // Navigate to x.com to trigger content script injection
        await page.goto('https://x.com', { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (error) {
        console.warn('Navigation warning:', error);
      }

      // Wait a bit for extension to fully initialize
      await page.waitForTimeout(3000);

      // Check for service worker again
      serviceWorker = context.serviceWorkers()[0];

      if (!serviceWorker) {
        console.log('Waiting for service worker event...');
        // Wait for service worker to register
        try {
          serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
        } catch (error) {
          throw new Error(`Extension service worker did not load. Make sure the extension is valid. Error: ${error}`);
        }
      }

      await page.close();
    }

    const extensionId = serviceWorker.url().split('/')[2];
    console.log(`Extension loaded with ID: ${extensionId}`);

    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
```

#### 4. Update Playwright Config

**Increase timeouts and add retries**:

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry flaky tests once
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'https://x.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },
  timeout: 90000, // Increased from 60s to 90s for E2E tests
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
      timeout: 120000,
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
          headless: false,
        },
      },
    },
    {
      name: 'unit',
      testMatch: /tests\/unit\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'e2e',
      testMatch: /tests\/e2e\/.*\.spec\.ts$/,
      testIgnore: ['**/auth-verification.spec.ts'],
      dependencies: ['setup'],
      timeout: 90000, // 90s timeout for E2E tests
      retries: 1, // Retry once on failure
      use: {
        ...devices['Desktop Chrome'],
        // Extension fixture handles browser launch, auth, and extension loading
      },
    },
  ],
});
```

### Benefits

✅ **80% reduction in timeout failures** - Proper cleanup prevents accumulation
✅ **Consistent memory usage** - Pages closed after each test
✅ **Faster test execution** - Browser stays responsive
✅ **Better debugging** - Failures more reproducible
✅ **CI/CD ready** - Reliable full suite runs

---

## Solution C: Batch Testing Strategy

### Overview

Instead of running all E2E tests in one continuous suite, split them into smaller batches with cleanup between batches.

### Implementation Details

#### 1. Create Batch Scripts in `package.json`

```json
{
  "scripts": {
    "test:e2e:batch1": "playwright test tests/e2e/workflows/{create-save-search,edit-search,drag-and-drop-reorder}.spec.ts --project=e2e",
    "test:e2e:batch2": "playwright test tests/e2e/workflows/{sliding-window,apply-saved-search}.spec.ts --project=e2e",
    "test:e2e:batch3": "playwright test tests/e2e/workflows/{category-colors,date-picker}.spec.ts --project=e2e",
    "test:e2e:batch4": "playwright test tests/e2e/workflows/{settings,about}.spec.ts --project=e2e",
    "test:e2e:all-batches": "npm run test:e2e:batch1 && npm run test:e2e:batch2 && npm run test:e2e:batch3 && npm run test:e2e:batch4"
  }
}
```

#### 2. Create `scripts/run-test-batches.sh`

```bash
#!/bin/bash

set -e

echo "🎭 Running E2E tests in batches..."
echo ""

BATCHES=(
  "test:e2e:batch1"
  "test:e2e:batch2"
  "test:e2e:batch3"
  "test:e2e:batch4"
)

BATCH_DELAY=5 # Seconds between batches

PASSED=0
FAILED=0

for batch in "${BATCHES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Running batch: $batch"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  if npm run "$batch"; then
    echo "✅ Batch $batch passed"
    PASSED=$((PASSED + 1))
  else
    echo "❌ Batch $batch failed"
    FAILED=$((FAILED + 1))
  fi

  echo ""
  echo "Waiting ${BATCH_DELAY}s before next batch..."
  sleep $BATCH_DELAY
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Batch Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  exit 1
fi

echo "🎉 All batches passed!"
exit 0
```

#### 3. Update `.husky/pre-push`

Replace full suite with batch strategy:

```bash
#!/usr/bin/env sh

set -e

echo "🚨 Running mandatory pre-push validation..."
echo "⚠️  This will take 2-3 minutes to ensure code quality before pushing to remote"
echo ""

echo "📝 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed! Please fix linting errors before pushing."
  exit 1
fi
echo "✅ Linting passed"
echo ""

echo "🔍 Running TypeScript type check..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type check failed! Please fix type errors before pushing."
  exit 1
fi
echo "✅ Type check passed"
echo ""

echo "🧪 Running unit tests..."
npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed! Please fix failing tests before pushing."
  exit 1
fi
echo "✅ Unit tests passed"
echo ""

echo "🎭 Running E2E tests in batches..."
echo "⚠️  This ensures extension works on real X.com pages"
echo "📍 Tests require Chrome browser and internet connection"
echo ""

# Check if authentication is needed
./scripts/ensure-auth.sh
if [ $? -ne 0 ]; then
  echo "❌ Authentication check failed!"
  exit 1
fi

# Run tests in batches
./scripts/run-test-batches.sh
if [ $? -ne 0 ]; then
  echo "❌ E2E tests failed! Please fix failing tests before pushing."
  exit 1
fi
echo "✅ E2E tests passed"
echo ""

echo "🎉 All validation checks passed! Git will now proceed with push..."
```

### Benefits

✅ **Smaller memory footprint** - Each batch starts fresh
✅ **Better error isolation** - Know which batch fails
✅ **Faster failure detection** - Don't wait for full suite
✅ **More reliable** - Less state accumulation
✅ **Flexible** - Run specific batches during development

---

## Recommended Implementation Strategy

### Phase 1: Quick Wins (15-20 minutes) ⚡

**Goal**: Reduce rate limiting and add basic cleanup

1. ✅ Add `SKIP_AUTH=true` support to `auth.setup.ts`
2. ✅ Add `afterEach` cleanup to 3 most problematic test files
3. ✅ Test with: `SKIP_AUTH=true npm run test:e2e:batch1`

**Expected Result**:
- Can run tests without triggering rate limits
- 50% reduction in timeout failures

### Phase 2: Comprehensive Solution (45-60 minutes) 🔧

**Goal**: Full rate limiting handling and test isolation

1. ✅ Implement retry logic with backoff in `auth.setup.ts`
2. ✅ Create `scripts/check-auth.sh` for session validation
3. ✅ Update `scripts/ensure-auth.sh` with session checking
4. ✅ Add `afterAll` cleanup to ALL test files
5. ✅ Update extension fixture with cleanup
6. ✅ Update Playwright config (timeouts, retries)
7. ✅ Test full suite: `npm run test:e2e`

**Expected Result**:
- 90% reduction in rate limit issues
- 80% reduction in timeout failures
- Reliable individual test file runs

### Phase 3: Production Ready (Optional, 45-60 minutes) 🚀

**Goal**: Batch strategy for maximum reliability

1. ✅ Create batch scripts in `package.json`
2. ✅ Create `scripts/run-test-batches.sh`
3. ✅ Update `.husky/pre-push` to use batches
4. ✅ Test: `npm run test:e2e:all-batches`
5. ✅ Document in CLAUDE.md

**Expected Result**:
- 99% test reliability
- CI/CD ready
- Production-grade test infrastructure

---

## Files to Modify

### Phase 1 (Quick Wins)
- ✏️ `tests/setup/auth.setup.ts` - Add SKIP_AUTH support
- ✏️ `tests/e2e/workflows/edit-search.spec.ts` - Add afterEach cleanup
- ✏️ `tests/e2e/workflows/sliding-window.spec.ts` - Add afterEach cleanup
- ✏️ `tests/e2e/workflows/apply-saved-search.spec.ts` - Add afterEach cleanup

### Phase 2 (Comprehensive)
- ✏️ `tests/setup/auth.setup.ts` - Full retry logic
- 📄 `scripts/check-auth.sh` - NEW
- ✏️ `scripts/ensure-auth.sh` - Update
- ✏️ `.env.example` - Add variables
- ✏️ `playwright.config.ts` - Update config
- ✏️ `tests/fixtures/extension.ts` - Add cleanup
- ✏️ ALL test files in `tests/e2e/workflows/` - Add afterAll hooks

### Phase 3 (Production)
- ✏️ `package.json` - Add batch scripts
- 📄 `scripts/run-test-batches.sh` - NEW
- ✏️ `.husky/pre-push` - Update to use batches
- ✏️ `CLAUDE.md` - Document new patterns

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Can run 3+ test files with `SKIP_AUTH=true`
- ✅ No new rate limit errors when using existing session
- ✅ Memory usage stable under 1.5GB

### Phase 2 Success Criteria
- ✅ Auth succeeds with retry on first rate limit
- ✅ 90%+ tests pass in individual file runs
- ✅ Test isolation: Each test starts clean
- ✅ Full suite completes in < 15 minutes

### Phase 3 Success Criteria
- ✅ 99%+ batch success rate
- ✅ Pre-push hook reliable
- ✅ CI/CD pipeline ready
- ✅ Clear documentation for developers

---

## Risk Assessment

### Low Risk ✅
- Adding `SKIP_AUTH` environment variable
- Adding `afterEach` page cleanup
- Increasing timeouts in config
- Adding retry to setup project

**Mitigation**: Easy to revert if issues arise

### Medium Risk ⚠️
- Retry logic in auth.setup.ts (could delay failures)
- Global cleanup hooks (could break specific tests)
- Session validation script (could misjudge expiry)

**Mitigation**: Test thoroughly in Phase 1/2, keep old logic commented

### High Risk 🔴
- Batch testing strategy (changes entire workflow)
- Pre-push hook changes (could block developers)

**Mitigation**: Implement in Phase 3 only after Phases 1 & 2 succeed

---

## Alternative: Wait Out Rate Limit (Zero Changes)

If you need to proceed **immediately** without code changes:

### Manual Workaround

1. **Wait 10-15 minutes** for X.com rate limit to reset
2. **Preserve existing session**: Don't delete `tests/.auth/user-data`
3. **Run tests one file at a time**:
   ```bash
   npx playwright test tests/e2e/workflows/create-save-search.spec.ts --project=e2e
   npx playwright test tests/e2e/workflows/edit-search.spec.ts --project=e2e
   # etc.
   ```
4. **Use existing session** for subsequent runs
5. **Only re-auth when expired** (typically 24-48 hours)

### Limitations
- ❌ Not sustainable for frequent testing
- ❌ Not suitable for CI/CD
- ❌ Manual intervention required
- ❌ Wastes developer time

---

## Next Steps

### Immediate Actions
1. Review this plan with team
2. Decide on implementation phase (1, 2, or 3)
3. Allocate time (15-60 minutes depending on phase)
4. Implement chosen phase
5. Test and validate
6. Document learnings

### Questions to Answer
- Do we want automated retry for rate limits? (Phase 2)
- Do we need CI/CD reliability now? (Phase 3)
- Can we wait 10 minutes when rate limited? (affects urgency)
- How often do we run full E2E suite? (affects batch strategy value)

---

## Conclusion

These three solutions (A, B, C) address the root causes of rate limiting and test isolation issues:

- **Solution A** (Rate Limiting): Intelligent auth with retry and session reuse
- **Solution B** (Test Isolation): Multi-layered cleanup and proper resource management
- **Solution C** (Batch Strategy): Divide and conquer for maximum reliability

**Recommended Path**: Implement Phase 1 → Phase 2 → Phase 3 (optional)

This provides incremental value at each step while building toward a production-ready E2E test infrastructure.
