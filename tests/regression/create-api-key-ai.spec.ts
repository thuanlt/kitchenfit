/**
 * create-api-key-ai.spec.ts
 * Phiên bản AI của create-api-key-full.spec.ts dùng @zerostep/playwright.
 *
 * Mục đích: Test UI regression bằng ngôn ngữ tự nhiên — tự adapt khi locator thay đổi.
 * So sánh với classic: tests/regression/create-api-key-full.spec.ts
 *
 * Yêu cầu:
 *   ZEROSTEP_TOKEN=<token>  trong .env  (lấy tại app.zerostep.com)
 *
 * Chạy:
 *   npx cross-env APP_ENV=prod npx playwright test tests/regression/create-api-key-ai.spec.ts --project=regression
 */

import { test, expect } from '@playwright/test';
import { ai } from '../../utils/playwright-ai';  // Custom AI helper — dùng FPT AI (Qwen2.5-VL + GLM-4.7)

const BASE_URL = 'https://marketplace.fptcloud.com/en';

// ── Helper: navigate đến My API Keys ─────────────────────────────────────────
async function goToMyAPIKeys(page: any, testObj: any) {
  await page.goto(`${BASE_URL}/my-account?tab=my-api-key`);
  await ai('wait for My API Keys heading to be visible', { page, test: testObj });
}

// ── TC_APIKEY_003_AI ──────────────────────────────────────────────────────────
test('TC_APIKEY_003_AI — Dialog "Create an API Key" mở thành công', async ({ page }) => {
  test.setTimeout(60_000);

  await goToMyAPIKeys(page, test);

  // AI tìm và click nút tạo key — không cần biết text chính xác
  await ai('click the button to create a new API key', { page, test });
  await page.waitForTimeout(1500);

  // AI verify dialog content
  await ai('verify that a "Create an API Key" dialog is visible', { page, test });
  await ai('verify that a Name input field is present in the dialog', { page, test });
  await ai('verify that Permission section is visible in the dialog', { page, test });
  await ai('verify that Cancel and Create buttons are visible in the dialog', { page, test });

  console.log('✅ TC_APIKEY_003_AI PASS: Dialog content verified bằng AI');
});

// ── TC_APIKEY_005_AI ──────────────────────────────────────────────────────────
test('TC_APIKEY_005_AI — Submit khi Name bỏ trống → hiển thị validation error', async ({ page }) => {
  test.setTimeout(60_000);

  await goToMyAPIKeys(page, test);
  await ai('click the button to create a new API key', { page, test });
  await page.waitForTimeout(1500);
  await ai('verify that the Create an API Key dialog is open', { page, test });

  // Không điền Name — click Create thẳng
  await ai('click the Create button in the dialog without filling in the Name field', { page, test });
  await page.waitForTimeout(1000); // chờ validation render

  // AI verify lỗi validation
  await ai('verify that a validation error message appears for the Name field', { page, test });

  const hasError = await ai(
    'is there a validation error message visible near the Name field?',
    { page, test }
  );
  expect(hasError).toBeTruthy();

  console.log('✅ TC_APIKEY_005_AI PASS: Validation error verified bằng AI');
});

// ── TC_APIKEY_011_AI ──────────────────────────────────────────────────────────
test('TC_APIKEY_011_AI — API key vừa tạo xuất hiện trong danh sách với status Active', async ({ page }) => {
  test.setTimeout(90_000);

  const apiKeyName = `qa-auto-ai-${Date.now()}`;

  await goToMyAPIKeys(page, test);

  // STEP 1: Mở dialog
  await ai('click the button to create a new API key', { page, test });
  await page.waitForTimeout(1500); // chờ dialog animate
  await ai('verify that the Create an API Key dialog is open', { page, test });
  console.log('✅ Step 1: Dialog mở thành công');

  // STEP 2: Điền tên
  await ai(`fill the Name field in the dialog with the value "${apiKeyName}"`, { page, test });
  console.log(`✅ Step 2: Đã điền tên: "${apiKeyName}"`);

  // STEP 3: Giữ nguyên permissions mặc định → click Create
  await ai('click the Create button in the dialog', { page, test });

  // STEP 4: Verify popup "Save your API Key" xuất hiện (chờ API call tạo key)
  await page.waitForTimeout(5000);
  await ai('verify that a "Save your API Key" popup or dialog is visible', { page, test });

  // STEP 5: Verify API key bắt đầu bằng sk-
  const keyVisible = await ai(
    'is there an API key value starting with "sk-" visible in the save dialog?',
    { page, test }
  );
  expect(keyVisible).toBeTruthy();
  console.log('✅ Step 4: Save popup và API key sk- verified');

  // STEP 6: Click Done
  await ai('click the Done button in the save API key dialog', { page, test });
  await page.waitForTimeout(1500); // chờ dialog close animation
  await ai('verify that the save dialog is closed', { page, test });
  console.log('✅ Step 5: Done clicked, popup đóng');

  // STEP 7: Verify key xuất hiện trong danh sách
  await ai(`verify that the API key named "${apiKeyName}" appears in the list`, { page, test });

  // STEP 8: Verify status Active
  const isActive = await ai(
    `is the API key named "${apiKeyName}" showing status "Active" in the list?`,
    { page, test }
  );
  expect(isActive).toBeTruthy();

  console.log(`✅ Step 6: "${apiKeyName}" xuất hiện trong danh sách với status Active`);
  console.log('✅ TC_APIKEY_011_AI PASS');
});
