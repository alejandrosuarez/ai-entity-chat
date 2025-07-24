import { Page, Locator, expect } from '@playwright/test';

export class NotificationLoaderPage {
  readonly page: Page;
  readonly iframe: Locator;
  readonly openFullScreenButton: Locator;
  readonly closeButton: Locator;
  readonly entityDetailsButton: Locator;
  readonly chatSessionHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.iframe = page.locator('iframe[title="Chat Interface"]');
    this.openFullScreenButton = page.locator('button:has-text("Open Full Screen")');
    this.closeButton = page.locator('button:has-text("Close")');
    this.entityDetailsButton = page.locator('button:has-text("Entity Details")');
    this.chatSessionHeader = page.locator('h1:has-text("Chat Session")');
  }

  async goto(url: string, chatId: string, entityId: string, additionalParams: string = '') {
    const queryParams = new URLSearchParams({
      url: url,
      chatId: chatId,
      entityId: entityId,
    });

    if (additionalParams) {
      const additional = new URLSearchParams(additionalParams);
      additional.forEach((value, key) => {
        queryParams.append(key, value);
      });
    }

    const notificationUrl = `/notification-loader?${queryParams.toString()}`;
    await this.page.goto(notificationUrl);
  }

  async gotoWithoutUrl(chatId: string, entityId: string) {
    const queryParams = new URLSearchParams({
      chatId: chatId,
      entityId: entityId,
    });

    const notificationUrl = `/notification-loader?${queryParams.toString()}`;
    await this.page.goto(notificationUrl);
  }

  async gotoWithoutEntityId(url: string, chatId: string) {
    const queryParams = new URLSearchParams({
      url: url,
      chatId: chatId,
    });

    const notificationUrl = `/notification-loader?${queryParams.toString()}`;
    await this.page.goto(notificationUrl);
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveTitle(/ai-entity-chat/);
    await expect(this.chatSessionHeader).toBeVisible();
    await expect(this.page.locator('text=You\'ve been invited to join a chat')).toBeVisible();
  }

  async assertIframeVisible(expectedSrc: string) {
    await expect(this.iframe).toBeVisible();
    const iframeSrc = await this.iframe.getAttribute('src');
    expect(iframeSrc).toBe(expectedSrc);
  }

  async assertIframeProperties() {
    await expect(this.iframe).toHaveClass(/h-\[600px\]/);
    await expect(this.iframe).toHaveAttribute('allow', 'microphone; camera; clipboard-read; clipboard-write');
    await expect(this.iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
  }

  async assertChatInfo(chatId: string, entityId: string) {
    await expect(this.page.locator(`text=Chat ID: ${chatId.substring(0, 16)}`)).toBeVisible();
    await expect(this.page.locator(`text=Entity: ${entityId}`)).toBeVisible();
  }

  async assertButtonsEnabled() {
    await expect(this.openFullScreenButton).toBeVisible();
    await expect(this.openFullScreenButton).toBeEnabled();
    await expect(this.closeButton).toBeVisible();
    await expect(this.closeButton).toBeEnabled();
  }

  async clickClose() {
    await this.closeButton.click();
  }

  async clickOpenFullScreen() {
    await this.openFullScreenButton.click();
  }

  async assertNoUrlError() {
    await expect(this.page.locator('text=No chat URL provided')).toBeVisible();
    await expect(this.page.locator('text=Please use a valid notification link to access the chat')).toBeVisible();
  }

  async expandEntityDetails() {
    await expect(this.entityDetailsButton).toBeVisible();
    await this.entityDetailsButton.click();
  }

  async assertEntityDetails() {
    await expect(this.page.locator('h3:has-text("Entity Information")')).toBeVisible();
    await expect(this.page.locator('text=Test Entity')).toBeVisible();
    await expect(this.page.locator('text=test')).toBeVisible(); // entity type
    await expect(this.page.locator('text=Active')).toBeVisible(); // status
    await expect(this.page.locator('text=Test entity for regression testing')).toBeVisible(); // description
  }

  async assertEntityAttributes() {
    await expect(this.page.locator('h4:has-text("Attributes")')).toBeVisible();
    await expect(this.page.locator('text=test_attribute')).toBeVisible();
    await expect(this.page.locator('text=test_value')).toBeVisible();
  }
}

export class EntityDetailPage {
  readonly page: Page;
  readonly entityDetailsHeader: Locator;
  readonly successMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.entityDetailsHeader = page.locator('h1:has-text("Entity Details")');
    this.successMessage = page.locator('text=Smoke Test Passed!');
    this.backButton = page.locator('button:has-text("← Back to Notification")');
  }

  async assertPageLoaded(entityId: string) {
    await expect(this.entityDetailsHeader).toBeVisible();
    await expect(this.page.locator('text=Successfully navigated to entity detail page')).toBeVisible();
    await expect(this.page.locator(`text=${entityId}`)).toBeVisible();
  }

  async assertSuccessIndicators() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.page.locator('text=Close button correctly redirected to entity detail page')).toBeVisible();
  }

  async assertUrl(entityId: string) {
    await this.page.waitForURL(`/entities/${entityId}**`);
    const currentUrl = this.page.url();
    expect(currentUrl).toMatch(new RegExp(`/entities/${entityId}`));
  }

  async assertUrlWithParams(entityId: string, params: string[]) {
    await this.assertUrl(entityId);
    const currentUrl = this.page.url();
    params.forEach(param => {
      expect(currentUrl).toContain(param);
    });
  }
}
