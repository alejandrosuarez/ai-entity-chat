import { test, expect } from '@playwright/test';
import { NotificationLoaderPage, EntityDetailPage } from './helpers/NotificationLoaderPage';

test.describe('Notification Loader - Simplified Tests', () => {
  const testData = {
    dummyUrl: 'https://example.com/dummy-chat',
    chatId: '123',
    entityId: 'abc',
  };

  test.beforeEach(async ({ page }) => {
    // Mock the entity API endpoint
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
            attributes: { test_attribute: 'test_value' },
          },
        }),
      });
    });
  });

  test('main workflow using page objects', async ({ page }) => {
    const loaderPage = new NotificationLoaderPage(page);
    const entityPage = new EntityDetailPage(page);

    // Step 1: Navigate to notification loader
    await loaderPage.goto(testData.dummyUrl, testData.chatId, testData.entityId);

    // Step 2: Verify page loaded correctly
    await loaderPage.assertPageLoaded();
    await loaderPage.assertIframeVisible(testData.dummyUrl);
    await loaderPage.assertIframeProperties();
    await loaderPage.assertChatInfo(testData.chatId, testData.entityId);
    await loaderPage.assertButtonsEnabled();

    // Step 3: Click close button
    await loaderPage.clickClose();

    // Step 4: Verify redirect to entity page
    await entityPage.assertUrl(testData.entityId);
    await entityPage.assertPageLoaded(testData.entityId);
    await entityPage.assertSuccessIndicators();
  });

  test('entity details expansion', async ({ page }) => {
    const loaderPage = new NotificationLoaderPage(page);

    await loaderPage.goto(testData.dummyUrl, testData.chatId, testData.entityId);
    await loaderPage.assertPageLoaded();
    
    // Expand entity details
    await loaderPage.expandEntityDetails();
    await loaderPage.assertEntityDetails();
    await loaderPage.assertEntityAttributes();
  });

  test('missing URL handling', async ({ page }) => {
    const loaderPage = new NotificationLoaderPage(page);
    const entityPage = new EntityDetailPage(page);

    await loaderPage.gotoWithoutUrl(testData.chatId, testData.entityId);
    await loaderPage.assertNoUrlError();
    
    await loaderPage.clickClose();
    await entityPage.assertUrl(testData.entityId);
  });

  test('missing entity ID handling', async ({ page }) => {
    const loaderPage = new NotificationLoaderPage(page);

    await loaderPage.gotoWithoutEntityId(testData.dummyUrl, testData.chatId);
    await loaderPage.assertIframeVisible(testData.dummyUrl);
    
    await loaderPage.clickClose();
    
    // Should redirect to home page
    await page.waitForURL('/');
    expect(page.url()).toMatch(/\/$/);
  });
});
