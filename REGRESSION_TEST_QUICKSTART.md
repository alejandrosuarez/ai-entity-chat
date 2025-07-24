# Notification Loader Regression Test - Quick Start

## 🚀 Run the Exact Test Scenario

To run the specific regression test that automates the requested scenario:

```bash
# Run just the main regression test
npx playwright test --grep "should complete the notification loader workflow successfully"

# Run with visual feedback (see the browser)
npx playwright test --grep "should complete the notification loader workflow successfully" --headed

# Run in debug mode (step through each action)
npx playwright test --grep "should complete the notification loader workflow successfully" --debug
```

## 📋 What This Test Does

The test automates exactly what was requested:

1. **Visits** `/notification-loader?url=https%3A//example.com/dummy-chat&chatId=123&entityId=abc`
2. **Asserts** iframe renders with `src="https://example.com/dummy-chat"`
3. **Clicks** the "Close" button
4. **Asserts** URL changes to `/entities/abc`
5. **Verifies** entity detail page loads successfully

## ⚡ Prerequisites

```bash
# Install dependencies (one time)
npm install

# Install browsers (one time)
npx playwright install
```

## 🎯 Test Results

When the test passes, you'll see:
```
✓ [chromium] › notification-loader.spec.ts:32:7 › should complete the notification loader workflow successfully
```

When it fails, you'll get:
- Detailed error messages
- Screenshots of the failure
- Step-by-step execution trace

## 🔄 CI Integration

This test runs automatically in CI on:
- Every push to `main` or `develop`
- Every pull request
- Can be triggered manually

## 📊 View All Available Tests

```bash
# See all notification loader tests
npx playwright test notification-loader --list

# Run all notification loader tests
npx playwright test notification-loader

# Run in UI mode for interactive development
npx playwright test notification-loader --ui
```

## 🐛 If Tests Fail

1. **Check the error message** - it will tell you exactly what failed
2. **Run with `--headed`** to see what's happening visually
3. **Use `--debug`** to step through the test
4. **Check test artifacts** in `playwright-report/` folder

## ✅ Success Criteria

The regression test passes when:
- ✅ Notification loader page loads with all parameters
- ✅ Iframe appears with correct dummy URL
- ✅ Close button is clickable
- ✅ Clicking Close redirects to `/entities/abc`
- ✅ Entity detail page shows success message

**This ensures the critical notification loader workflow will never break!** 🛡️
