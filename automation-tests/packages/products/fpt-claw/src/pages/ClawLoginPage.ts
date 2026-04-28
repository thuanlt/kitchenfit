import { Page, Locator } from '@playwright/test';

export class ClawLoginPage {
  readonly page: Page;
  private readonly baseUrl: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl || process.env.FPT_CLAW_URL || process.env.BASE_URL || 'https://claw.fptcloud.com';
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
    const loginUrl = this.baseUrl.endsWith('/') 
      ? `${this.baseUrl}login` 
      : `${this.baseUrl}/login`;
    
    await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.signInButton().click();
    
    // Wait for navigation with increased timeout
    try {
      await this.page.waitForURL(/\/overview|\/dashboard|\/home|\/chat/, { timeout: 30000 });
    } catch (error) {
      // Log current URL for debugging
      const currentUrl = this.page.url();
      console.log(`Login timeout. Current URL: ${currentUrl}`);
      throw error;
    }
  }
}