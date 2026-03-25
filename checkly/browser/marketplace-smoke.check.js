const { BrowserCheck, Frequency } = require('checkly/constructs');

new BrowserCheck('marketplace-homepage-browser', {
  name:      '🖥️  Marketplace — Homepage loads',
  activated: true,
  frequency: Frequency.EVERY_30M,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'ui', 'smoke'],
  code: {
    content: `
const { expect } = require('@playwright/test');

async function run(page) {
  await page.goto('https://marketplace.fptcloud.com/en');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/marketplace\\.fptcloud\\.com/);
  const modelCard = page.getByRole('link').filter({ hasText: /GLM|Qwen|DeepSeek|SaoLa|Llama/i });
  await expect(modelCard.first()).toBeVisible({ timeout: 15000 });
}

module.exports = { run };
    `.trim(),
  },
});
