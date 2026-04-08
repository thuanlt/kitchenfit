import { Page, Locator, expect } from '@playwright/test';

export class SuccessPage {
  readonly page: Page;
  readonly logoutButton: Locator;
  readonly successMessage: Locator;
  readonly expectedURL: string = 'https://practicetestautomation.com/logged-in-successfully/';

  constructor(page: Page) {
    this.page = page;
    this.logoutButton = page.locator('button:has-text("Log out")');
    this.successMessage = page.locator('body');
  }

  async waitForSuccessPage() {
    await this.page.waitForURL('**/logged-in-successfully/**');
  }

  async verifyURLContainsLoggedIn(): Promise<boolean> {
    return this.page.url().includes('/logged-in-successfully/');
  }

  async verifySuccessMessage(expectedText: string = 'Congratulations'): Promise<boolean> {
    const content = await this.page.content();
    return content?.includes(expectedText) || false;
  }

  async isLogoutButtonVisible(): Promise<boolean> {
    try {
      await this.logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    await this.logoutButton.click();
  }

  async verifyLogoutSuccessful(loginPageURL: string) {
    await this.page.waitForURL(loginPageURL);
    expect(this.page.url()).toBe(loginPageURL);
  }

  async getPageContent(): Promise<string | null> {
    return await this.page.content();
  }
}
