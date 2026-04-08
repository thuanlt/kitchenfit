import { Page } from '@playwright/test';

export async function loginWithFptId(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('button', { name: /continue with fpt id/i }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForLoadState('networkidle');
}
