import { Page } from '@playwright/test';

/**
 * Wait for page to be ready: domcontentloaded + fixed delay
 */
export async function waitForPageReady(page: Page, delayMs = 2000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(delayMs);
}

/**
 * Navigate to URL and wait for page ready
 */
export async function gotoAndWait(page: Page, url: string, delayMs = 2000): Promise<void> {
  await page.goto(url);
  await waitForPageReady(page, delayMs);
}
