import { test, expect } from '@playwright/test';

test.describe('Notification Loader Regression Tests', () => {
  const testData = {
    dummyUrl: 'https://example.com/dummy-chat',
    chatId: '123',
    entityId: 'abc',
  };

  test.beforeEach(async ({ page }) => {
    // Mock the entity API endpoint to avoid 404s during testing
    await page.route('/api/entities/abc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entity: {
            id: 'abc',
            display_name: 'Test Entity',
            entity_type: 'test',
            disabled: false,
            description: 'Test entity for regression testing',
            attributes: {
              test_attribute: 'test_value',
            },
          },
        }),
      });
    });
  });

  test('should complete the notification loader workflow successfully', async ({ page }) => {
    // Step 1: Visit the notification loader page with required parameters
    const notificationUrl = `/notification-loader?url=${encodeURIComponent(testData.dummyUrl)}&chatId=${testData.chatId}&entityId=${testData.entityId}`;
    await page.goto(notificationUrl);

    // Verify the page loads correctly
    await expect(page).toHaveTitle(/ai-entity-chat/);
    
    // Verify header content is visible
    await expect(page.locator('h1:has-text("Chat Session")')).toBeVisible();
    await expect(page.locator('text=You\'ve been invited to join a chat')).toBeVisible();

    // Step 2: Assert iframe renders with the dummy URL
    const iframe = page.locator('iframe[title="Chat Interface"]');
    await expect(iframe).toBeVisible();
    
    // Verify the iframe has the correct src attribute
    const iframeSrc = await iframe.getAttribute('src');
    expect(iframeSrc).toBe(testData.dummyUrl);

    // Verify iframe dimensions and properties
    await expect(iframe).toHaveClass(/h-\[600px\]/);
    await expect(iframe).toHaveAttribute('allow', 'microphone; camera; clipboard-read; clipboard-write');
    await expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');

    // Verify chat ID and entity ID are displayed correctly
    await expect(page.locator(`text=Chat ID: ${testData.chatId.substring(0, 16)}`)).toBeVisible();
    await expect(page.locator(`text=Entity: ${testData.entityId}`)).toBeVisible();

    // Verify both action buttons are present and enabled
    const openFullScreenButton = page.locator('button:has-text("Open Full Screen")');
    const closeButton = page.locator('button:has-text("Close")');
    
    await expect(openFullScreenButton).toBeVisible();
    await expect(openFullScreenButton).toBeEnabled();
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toBeEnabled();

    // Step 3: Click the Close button
    await closeButton.click();

    // Step 4: Assert new URL matches the expected entity page
    await page.waitForURL(`/entities/${testData.entityId}**`);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(new RegExp(`/entities/${testData.entityId}`));

    // Verify we're on the entity detail page
    await expect(page.locator('h1:has-text("Entity Details")')).toBeVisible();
    await expect(page.locator('text=Successfully navigated to entity detail page')).toBeVisible();
    
    // Verify the entity ID is displayed correctly on the detail page
    await expect(page.locator(`text=${testData.entityId}`)).toBeVisible();
    
    // Verify the success indicators are present
    await expect(page.locator('text=Smoke Test Passed!')).toBeVisible();
    await expect(page.locator('text=Close button correctly redirected to entity detail page')).toBeVisible();
  });

  test('should handle missing URL parameter gracefully', async ({ page }) => {
    // Visit notification loader without URL parameter
    const notificationUrl = `/notification-loader?chatId=${testData.chatId}&entityId=${testData.entityId}`;
    await page.goto(notificationUrl);

    // Should show error state for missing URL
    await expect(page.locator('text=No chat URL provided')).toBeVisible();
    await expect(page.locator('text=Please use a valid notification link to access the chat')).toBeVisible();

    // Close button should still work
    const closeButton = page.locator('button:has-text("Close")');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Should redirect to entity page
    await page.waitForURL(`/entities/${testData.entityId}**`);
    expect(page.url()).toMatch(new RegExp(`/entities/${testData.entityId}`));
  });

  test('should handle missing entityId parameter', async ({ page }) => {
    // Visit notification loader without entityId parameter
    const notificationUrl = `/notification-loader?url=${encodeURIComponent(testData.dummyUrl)}&chatId=${testData.chatId}`;
    await page.goto(notificationUrl);

    // Iframe should still render
    const iframe = page.locator('iframe[title="Chat Interface"]');
    await expect(iframe).toBeVisible();

    // Close button should redirect to home page when no entityId
    const closeButton = page.locator('button:has-text("Close")');
    await closeButton.click();

    // Should redirect to home page (/)
    await page.waitForURL('/');
    expect(page.url()).toMatch(/\/$|\/$/);
  });

  test('should preserve query parameters when redirecting to entity page', async ({ page }) => {
    // Add extra query parameters to test preservation
    const extraParams = 'source=notification&timestamp=123456';
    const notificationUrl = `/notification-loader?url=${encodeURIComponent(testData.dummyUrl)}&chatId=${testData.chatId}&entityId=${testData.entityId}&${extraParams}`;
    await page.goto(notificationUrl);

    // Wait for iframe to load
    const iframe = page.locator('iframe[title="Chat Interface"]');
    await expect(iframe).toBeVisible();

    // Click close button
    const closeButton = page.locator('button:has-text("Close")');
    await closeButton.click();

    // Verify parameters are preserved in the redirect
    await page.waitForURL(`/entities/${testData.entityId}**`);
    const currentUrl = page.url();
    expect(currentUrl).toContain('source=notification');
    expect(currentUrl).toContain('timestamp=123456');
    expect(currentUrl).toContain(`chatId=${testData.chatId}`);
  });

  test('should open full screen chat in new tab', async ({ page, context }) => {
    // Visit notification loader
    const notificationUrl = `/notification-loader?url=${encodeURIComponent(testData.dummyUrl)}&chatId=${testData.chatId}&entityId=${testData.entityId}`;
    await page.goto(notificationUrl);

    // Wait for iframe to load
    const iframe = page.locator('iframe[title="Chat Interface"]');
    await expect(iframe).toBeVisible();

    // Set up listener for new tab
    const pagePromise = context.waitForEvent('page');
    
    // Click open full screen button
    const openFullScreenButton = page.locator('button:has-text("Open Full Screen")');
    await openFullScreenButton.click();

    // Verify new tab opens with correct URL
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe(testData.dummyUrl);
  });

  test('should display entity details when expanded', async ({ page }) => {
    // Visit notification loader
    const notificationUrl = `/notification-loader?url=${encodeURIComponent(testData.dummyUrl)}&chatId=${testData.chatId}&entityId=${testData.entityId}`;
    await page.goto(notificationUrl);

    // Wait for page to load
    await expect(page.locator('h1:has-text("Chat Session")')).toBeVisible();

    // Click entity details toggle
    const entityDetailsButton = page.locator('button:has-text("Entity Details")');
    await expect(entityDetailsButton).toBeVisible();
    await entityDetailsButton.click();

    // Wait for entity details to load and display
    await expect(page.locator('h3:has-text("Entity Information")')).toBeVisible();
    await expect(page.locator('text=Test Entity')).toBeVisible();
    await expect(page.locator('text=test')).toBeVisible(); // entity type
    await expect(page.locator('text=Active')).toBeVisible(); // status
    await expect(page.locator('text=Test entity for regression testing')).toBeVisible(); // description

    // Verify attributes section
    await expect(page.locator('h4:has-text("Attributes")')).toBeVisible();
    await expect(page.locator('text=test_attribute')).toBeVisible();
    await expect(page.locator('text=test_value')).toBeVisible();
  });
});
