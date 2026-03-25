/**
 * homepage.spec.ts
 * Playwright script chạy bởi Checkly browser check
 * Verify FPT AI Marketplace homepage có thể truy cập và hiển thị model list
 */

import { expect, test } from '@playwright/test';

test('FPT Marketplace — homepage smoke', async ({ page }) => {
  await page.goto('https://marketplace.fptcloud.com/en');
  await page.waitForLoadState('networkidle');

  // Verify trang load thành công
  await expect(page).toHaveURL(/marketplace\.fptcloud\.com/);

  // Verify có ít nhất 1 model card hiển thị
  const modelCards = page.getByRole('link').filter({ hasText: /GLM|Qwen|DeepSeek|SaoLa|Llama/i });
  await expect(modelCards.first()).toBeVisible({ timeout: 15000 });
});
