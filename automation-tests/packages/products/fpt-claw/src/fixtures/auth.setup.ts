// auth.setup.ts — chạy 1 lần, lưu session cho smoke/regression tests
import { test as setup } from '@playwright/test';
import path from 'path';
import { ClawLoginPage } from '@pages/ClawLoginPage';

const APP_ENV  = process.env.APP_ENV ?? 'test';
const authFile = path.join(__dirname, `../../playwright/.auth/${APP_ENV}-user.json`);

setup('authenticate', async ({ page }) => {
  const loginPage = new ClawLoginPage(page);
  await loginPage.loginWithEnv();
  await page.context().storageState({ path: authFile });
});
