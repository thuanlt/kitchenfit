// ai-auth.setup.ts — login ai.fptcloud.com một lần, lưu session
import { test as setup } from '@playwright/test';
import path from 'path';

const APP_ENV    = process.env.APP_ENV ?? 'test';
const AI_BASE_URL = process.env.AI_BASE_URL ?? 'https://ai.fptcloud.com';
const authFile   = path.join(__dirname, `../playwright/.auth/${APP_ENV}-ai-user.json`);

setup('authenticate ai.fptcloud.com', async ({ page }) => {

  await page.goto(AI_BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Click Sign in/Sign up
  await page.locator('button:has-text("Sign in/Sign up")').click();
  await page.locator('.semi-modal.semi-modal-centered').waitFor({ state: 'visible', timeout: 5000 });

  // Click Continue with FPT ID → redirect sang id.fptcloud.com
  await Promise.all([
    page.waitForURL(/id\.fptcloud\.com/, { timeout: 15000 }),
    page.locator('button.semi-button-outline:has-text("Continue with FPT ID")').click(),
  ]);

  // Điền credentials từ .env / .env.<APP_ENV>
  await page.locator('#username').fill(process.env.FPT_USERNAME!);
  await page.locator('#password').fill(process.env.FPT_PASSWORD!);
  await page.locator('#kc-signup-button').click();

  // Chờ redirect về ai.fptcloud.com
  await page.waitForURL(/ai\.fptcloud\.com/, { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Lưu storage state
  await page.context().storageState({ path: authFile });
  console.log(`✅ AI Auth setup [${APP_ENV}]: session saved to`, authFile);
});
