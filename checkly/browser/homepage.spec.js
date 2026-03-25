// Playwright test script — chạy bởi Checkly browser check
// File này KHÔNG import checkly/constructs

const { expect } = require('@playwright/test');

async function run(page) {
  await page.goto('https://marketplace.fptcloud.com/en');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/marketplace\.fptcloud\.com/);
  const modelCard = page.getByRole('link').filter({ hasText: /GLM|Qwen|DeepSeek|SaoLa|Llama/i });
  await expect(modelCard.first()).toBeVisible({ timeout: 15000 });
}

module.exports = { run };
