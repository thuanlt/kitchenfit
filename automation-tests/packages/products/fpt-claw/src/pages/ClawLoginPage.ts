import { Page, Locator } from '@playwright/test';

export class ClawLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email' });
  }

  passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  signInButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  async loginWithEnv(): Promise<void> {
    const email    = process.env.CLAW_USERNAME!;
    const password = process.env.CLAW_PASSWORD!;
    return this.login(email, password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.goto('https://dev-claw.fptcloud.net/login', { waitUntil: 'domcontentloaded' });
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.signInButton().click();
    await this.page.waitForURL(/\/overview|\/dashboard|\/home|\/chat/, { timeout: 15000 });
  }
}
