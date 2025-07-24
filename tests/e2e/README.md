# End-to-End Testing with Playwright

This directory contains E2E tests using [Playwright](https://playwright.dev/) to ensure the notification loader functionality works correctly across different browsers and scenarios.

## Test Overview

### Notification Loader Regression Tests

The main test suite (`notification-loader.spec.ts`) covers the critical user flow:

1. **Visit notification loader page** with parameters: `url`, `chatId`, and `entityId`
2. **Assert iframe renders** with the correct source URL
3. **Click Close button** to navigate away
4. **Assert redirection** to the correct entity detail page (`/entities/{entityId}`)

### Test Scenarios Covered

- ✅ **Happy Path**: Complete workflow with all parameters
- ✅ **Missing URL**: Graceful handling when `url` parameter is missing
- ✅ **Missing Entity ID**: Correct fallback behavior
- ✅ **Parameter Preservation**: Query parameters maintained during redirect
- ✅ **Full Screen Feature**: Opening chat in new tab
- ✅ **Entity Details**: Expandable entity information display

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Specific Test Execution

```bash
# Run only notification loader tests
npx playwright test notification-loader.spec.ts

# Run specific test by name
npx playwright test --grep "should complete the notification loader workflow"

# Run on specific browser
npx playwright test --project=chromium
```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retry**: 2 retries on CI, 0 locally
- **Reports**: HTML locally, JUnit on CI
- **Artifacts**: Screenshots and videos on failure

## CI/CD Integration

### GitHub Actions

The E2E tests run automatically on:

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches
- **Manual trigger** via workflow dispatch

### CI Jobs

1. **e2e-tests**: Main E2E test suite on Chromium
2. **cross-browser-tests**: Full browser matrix (main branch only)
3. **notification-loader-smoke-test**: Quick regression test for critical flow

### Test Artifacts

On test failures, the following artifacts are uploaded:

- Playwright HTML reports
- Screenshots of failures
- Videos of failed tests
- Test result files

## Page Object Pattern

The tests use the Page Object pattern for maintainability:

### `NotificationLoaderPage`

Helper class for notification loader interactions:

```typescript
const loaderPage = new NotificationLoaderPage(page);
await loaderPage.goto(url, chatId, entityId);
await loaderPage.assertIframeVisible(expectedSrc);
await loaderPage.clickClose();
```

### `EntityDetailPage`

Helper class for entity detail page interactions:

```typescript
const entityPage = new EntityDetailPage(page);
await entityPage.assertPageLoaded(entityId);
await entityPage.assertSuccessIndicators();
```

## Test Data

Tests use consistent test data:

```typescript
const testData = {
  dummyUrl: 'https://example.com/dummy-chat',
  chatId: '123',
  entityId: 'abc',
};
```

## API Mocking

Tests mock the entity API endpoint to ensure consistent behavior:

```typescript
await page.route('/api/entities/abc', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ entity: mockEntityData }),
  });
});
```

## Debugging Tips

### Local Debugging

1. **Use UI Mode**: `npm run test:e2e:ui` for interactive debugging
2. **Run Headed**: `npm run test:e2e:headed` to see browser actions
3. **Debug Mode**: `npm run test:e2e:debug` for step-by-step debugging
4. **Console Logs**: Add `console.log()` statements in tests

### CI Debugging

1. **Check Artifacts**: Download Playwright reports from failed CI runs
2. **Screenshots**: Review failure screenshots in artifacts
3. **Videos**: Watch recorded videos of test failures
4. **Logs**: Examine CI job logs for error details

## Best Practices

### Writing Tests

- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Use page objects for reusable interactions
- ✅ Mock external dependencies
- ✅ Verify both positive and negative scenarios

### Maintenance

- 🔄 Update selectors when UI changes
- 🔄 Keep test data consistent and realistic
- 🔄 Review and update mocks when APIs change
- 🔄 Monitor test flakiness and fix unstable tests

## Troubleshooting

### Common Issues

1. **Timeouts**: Increase timeout or wait for specific elements
2. **Flaky Tests**: Add proper waits and retry logic
3. **Selector Issues**: Use more stable selectors (data-testid, roles)
4. **Environment Issues**: Verify local setup and dependencies

### Getting Help

- [Playwright Documentation](https://playwright.dev/docs)
- [Playwright Discord](https://discord.gg/playwright-807756831384403968)
- [Project Issues](../../issues) for project-specific problems
