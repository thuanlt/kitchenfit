// auth.setup.ts — chạy 1 lần, lưu session cho tất cả tests
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const APP_ENV  = process.env.APP_ENV ?? 'test';
const BASE_URL = process.env.BASE_URL ?? 'https://marketplace.fptcloud.com/en';
const authFile = path.join(__dirname, `../playwright/.auth/${APP_ENV}-user.json`);

setup('authenticate', async ({ page }) => {

  // Truy cập marketplace
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(/fptcloud/);

  // Click Sign in/Sign up
  const signInBtn = page.locator('button:has-text("Sign in/Sign up")').or(page.getByText('Sign in/Sign up')).first();
  await expect(signInBtn).toBeVisible({ timeout: 10000 });
  await signInBtn.click();

  // Click Continue with FPT ID
  const continueWithFptId = page.getByRole('button', { name: /continue with fpt id/i });
  await expect(continueWithFptId).toBeVisible({ timeout: 5000 });

  await Promise.all([
    page.waitForURL(/id\.fptcloud\.com/, { timeout: 10000 }),
    continueWithFptId.click(),
  ]);

  // Điền credentials từ .env / .env.<APP_ENV>
  await page.getByPlaceholder(/username|email/i).fill(process.env.FPT_USERNAME!);
  await page.locator('input[type="password"]').fill(process.env.FPT_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Chờ redirect về marketplace
  await page.waitForURL(new RegExp(new URL(BASE_URL).hostname.replace('.', '\\.')), { timeout: 15000 });
  await expect(page).toHaveURL(/fptcloud/);

  // Lưu storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
  console.log(`✅ Auth setup [${APP_ENV}]: session saved to`, authFile);
});
