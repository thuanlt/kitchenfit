// create-api-key-full.spec.ts
// Điều kiện: Login thành công (storageState từ auth.setup.ts)
// Luồng: Homepage → Get Your API Keys → Create API Key

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://marketplace.fptcloud.com/en';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function goToMyAPIKeys(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: /get your api keys/i }).click();
  await page.waitForURL(/my-account.*tab=my-api-key/);
  await expect(page.getByRole('heading', { name: /my api keys/i })).toBeVisible({ timeout: 10000 });
}

async function openCreateDialog(page: Page) {
  await page.getByRole('button', { name: /create new api key/i }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 5000 });
  await expect(modal.getByText('Create an API Key')).toBeVisible();
  return modal;
}

// ─── TC_APIKEY_002 ──────────────────────────────────────────────────────────

test('TC_APIKEY_002 - Luồng từ Homepage: Get Your API Keys → mở My API Keys', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Verify nút "Get Your API Keys" tồn tại trên Homepage (chờ JS render xong)
  const btn = page.getByRole('button', { name: /get your api keys/i });
  await expect(btn).toBeVisible({ timeout: 10000 });

  // Click → redirect sang My API Keys
  await btn.click();
  await page.waitForURL(/my-account.*tab=my-api-key/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: /my api keys/i })).toBeVisible({ timeout: 10000 });
});

// ─── TC_APIKEY_003 ──────────────────────────────────────────────────────────

test('TC_APIKEY_003 - Dialog "Create an API Key" mở thành công', async ({ page }) => {
  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);

  // Verify dialog hiển thị đúng title
  await expect(modal.getByText('Create an API Key')).toBeVisible();

  // Verify Name field có mặt (required)
  await expect(modal.getByPlaceholder(/your name/i)).toBeVisible();
  await expect(modal.getByText(/Name/)).toBeVisible();

  // Verify Permission section có mặt (required)
  await expect(modal.getByText(/Permission/)).toBeVisible();

  // Verify Cancel và Create buttons
  await expect(modal.getByRole('button', { name: /cancel/i })).toBeVisible();
  await expect(modal.getByRole('button', { name: /^create$/i })).toBeVisible();
});

// ─── TC_APIKEY_004 ──────────────────────────────────────────────────────────

test('TC_APIKEY_004 - Tất cả Permission checkboxes được chọn mặc định', async ({ page }) => {
  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);

  // Chờ dialog content load xong (permissions được fetch async từ API)
  await expect(modal.getByPlaceholder('Your Name')).toBeVisible({ timeout: 10000 });
  await expect(modal.getByRole('checkbox').first()).toBeVisible({ timeout: 10000 });

  // Ant Design dùng role="checkbox" (không phải input[type="checkbox"])
  const checkboxes = modal.getByRole('checkbox');
  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(0);

  // Verify tất cả đều checked
  for (let i = 0; i < count; i++) {
    await expect(checkboxes.nth(i)).toBeChecked();
  }
  console.log(`✅ Verified ${count} permission checkboxes đều được chọn mặc định`);
});

// ─── TC_APIKEY_005 ──────────────────────────────────────────────────────────

test('TC_APIKEY_005 - Submit khi Name bỏ trống → hiển thị validation error', async ({ page }) => {
  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);

  // Không điền Name → click Create
  const createBtn = modal.getByRole('button', { name: /^create$/i });
  await createBtn.click();

  // Verify lỗi validation xuất hiện
  const nameError = modal.locator('[class*="error"], [class*="Error"], .ant-form-item-explain-error').first();
  await expect(nameError).toBeVisible({ timeout: 5000 });
  console.log(`✅ Validation error hiển thị: ${await nameError.textContent()}`);
});

// ─── TC_APIKEY_006 ──────────────────────────────────────────────────────────

test('TC_APIKEY_006 - Cancel button đóng dialog không tạo API key', async ({ page }) => {
  await goToMyAPIKeys(page);

  const cancelledKeyName = `should-not-create-${Date.now()}`;
  const modal = await openCreateDialog(page);

  // Điền name nhưng click Cancel
  await modal.getByPlaceholder(/your name/i).fill(cancelledKeyName);
  await modal.getByRole('button', { name: /cancel/i }).click();

  // Dialog đóng
  await expect(modal).not.toBeVisible({ timeout: 5000 });

  // Verify key với tên vừa điền KHÔNG xuất hiện trong danh sách
  await expect(page.locator('table tbody tr').filter({ hasText: cancelledKeyName })).toHaveCount(0, { timeout: 5000 });
});

// ─── TC_APIKEY_007 ──────────────────────────────────────────────────────────

test('TC_APIKEY_007 - X button đóng dialog không tạo API key', async ({ page }) => {
  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);

  // Click nút X để đóng
  const closeBtn = modal.getByRole('button', { name: /close/i });
  await closeBtn.click();

  await expect(modal).not.toBeVisible({ timeout: 5000 });
});

// ─── TC_APIKEY_008 ──────────────────────────────────────────────────────────

test('TC_APIKEY_008 - Tạo API Key thành công với tất cả permissions mặc định', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-auto-key-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);

  // Điền Name
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);

  // Giữ nguyên tất cả permissions mặc định → click Create
  await modal.getByRole('button', { name: /^create$/i }).click();

  // "Save your API Key" popup xuất hiện
  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });
  console.log(`✅ "Save your API Key" popup xuất hiện sau khi tạo thành công`);
});

// ─── TC_APIKEY_009 ──────────────────────────────────────────────────────────

test('TC_APIKEY_009 - "Save your API Key" popup hiển thị đúng nội dung', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-auto-key-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);
  await modal.getByRole('button', { name: /^create$/i }).click();

  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });

  // Verify title
  await expect(saveModal.getByText('Save your API Key')).toBeVisible();

  // Verify API key value bắt đầu bằng sk- (dùng locator để auto-retry)
  const apiKeyInput = saveModal.locator('input').first();
  const apiKeyText = saveModal.locator('text=/sk-/');
  const hasInput = await apiKeyInput.count() > 0;
  if (hasInput) {
    await expect(apiKeyInput).toHaveValue(/^sk-/, { timeout: 20000 });
    const val = await apiKeyInput.inputValue();
    console.log(`✅ API key value: ${val.substring(0, 12)}...`);
  } else {
    await expect(apiKeyText).toBeVisible({ timeout: 20000 });
    console.log(`✅ API key sk- text visible`);
  }

  // Verify Done button
  await expect(saveModal.getByRole('button', { name: /done/i })).toBeVisible();
});

// ─── TC_APIKEY_010 ──────────────────────────────────────────────────────────

test('TC_APIKEY_010 - Done button đóng "Save your API Key" popup', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-auto-key-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);
  await modal.getByRole('button', { name: /^create$/i }).click();

  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });

  // Click Done
  await saveModal.getByRole('button', { name: /done/i }).click();

  // Popup đóng
  await expect(saveModal).not.toBeVisible({ timeout: 5000 });
});

// ─── TC_APIKEY_011 ──────────────────────────────────────────────────────────

test('TC_APIKEY_011 - API key vừa tạo xuất hiện trong danh sách với status Active', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-auto-key-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);
  await modal.getByRole('button', { name: /^create$/i }).click();

  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });
  await saveModal.getByRole('button', { name: /done/i }).click();

  // Verify API key xuất hiện trong bảng
  await page.waitForLoadState('load');
  const row = page.locator('table tbody tr').filter({ hasText: apiKeyName });
  await expect(row).toBeVisible({ timeout: 10000 });

  // Verify status = Active
  await expect(row.getByText(/active/i)).toBeVisible();
  console.log(`✅ API key "${apiKeyName}" xuất hiện trong danh sách với status Active`);
});

// ─── TC_APIKEY_012 ──────────────────────────────────────────────────────────

test('TC_APIKEY_012 - Tạo API Key với một số permissions bỏ chọn → thành công', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-partial-perm-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);

  // Bỏ chọn 2 permissions đầu tiên
  const checkboxes = modal.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  if (count >= 2) {
    await checkboxes.nth(0).uncheck();
    await checkboxes.nth(1).uncheck();
  }

  await modal.getByRole('button', { name: /^create$/i }).click();

  // Vẫn tạo thành công
  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });
  await saveModal.getByRole('button', { name: /done/i }).click();

  // Xuất hiện trong danh sách
  const row = page.locator('table tbody tr').filter({ hasText: apiKeyName });
  await expect(row).toBeVisible({ timeout: 10000 });
  console.log(`✅ API key với partial permissions tạo thành công`);
});

// ─── TC_APIKEY_013 ──────────────────────────────────────────────────────────

test('TC_APIKEY_013 - Uncheck tất cả permissions rồi check lại tất cả → Create thành công', async ({ page }) => {
  test.setTimeout(60000);
  const apiKeyName = `qa-recheck-perm-${Date.now()}`;

  await goToMyAPIKeys(page);
  const modal = await openCreateDialog(page);
  await modal.getByPlaceholder(/your name/i).fill(apiKeyName);

  const checkboxes = modal.locator('input[type="checkbox"]');
  const count = await checkboxes.count();

  // Uncheck tất cả
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).uncheck();
  }
  // Check lại tất cả
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).check();
  }

  await modal.getByRole('button', { name: /^create$/i }).click();

  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });
  await saveModal.getByRole('button', { name: /done/i }).click();

  const row = page.locator('table tbody tr').filter({ hasText: apiKeyName });
  await expect(row).toBeVisible({ timeout: 10000 });
});
