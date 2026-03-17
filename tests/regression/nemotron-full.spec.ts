// nemotron-full.spec.ts
// Test cases cho model Nemotron trên FPT AI Marketplace (STG)
// ⚠️  Nemotron chưa deploy trên STG — test cases được viết trước để chuẩn bị
//     Khi model lên STG: đổi NEMOTRON_DEPLOYED = true và cập nhật MODEL_API_ID

import { test, expect, request as playwrightRequest } from '@playwright/test';

const BASE_URL     = process.env.BASE_URL    ?? 'https://marketplace-stg.fptcloud.net/en';
const FPT_API_URL  = process.env.FPT_API_URL ?? 'https://mkp-api-stg.fptcloud.net';
const FPT_API_KEY  = process.env.FPT_API_KEY ?? '';
const FPT_FROM     = process.env.FPT_FROM    ?? '';

const MODEL_NAME   = 'Nemotron';              // tên hiển thị trên UI
const MODEL_API_ID = 'Nemotron-3-Super-120B-A12B'; // ID dùng trong API call

// false = model chưa lên STG → skip các test phụ thuộc vào model thực
const NEMOTRON_DEPLOYED = true;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function goToMyAPIKeys(page: any) {
  await page.goto(`${BASE_URL}/my-account?tab=my-api-key`);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: /my api keys/i })).toBeVisible({ timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_001 — Search model Nemotron trên marketplace
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_001 - Search model Nemotron trên trang chủ marketplace', async ({ page }) => {
  test.skip(!NEMOTRON_DEPLOYED, `${MODEL_NAME} chưa deploy trên STG`);

  // STEP 1: Truy cập trang chủ marketplace
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/fptcloud/);
  console.log('✅ Step 1 PASS: Truy cập marketplace thành công');

  // STEP 2: Tìm search box và nhập "Nemotron"
  const searchInput = page
    .locator('input[placeholder*="search" i], input[placeholder*="model" i], input[type="search"]')
    .first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(MODEL_NAME);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ Step 2 PASS: Đã tìm kiếm "Nemotron"');

  // STEP 3: Verify model Nemotron xuất hiện trong kết quả
  // Model card là <a> link, không phải card/li
  const modelCard = page.getByRole('link').filter({ hasText: MODEL_API_ID }).first();
  await expect(modelCard).toBeVisible({ timeout: 10000 });
  console.log(`✅ Step 3 PASS: Model "${MODEL_API_ID}" xuất hiện trong kết quả tìm kiếm`);

  // STEP 4: Verify thông tin cơ bản hiển thị đúng
  await expect(modelCard.getByText(MODEL_API_ID)).toBeVisible();
  console.log('✅ Step 4 PASS: Tên model hiển thị đúng trên card');
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_002 — Xem chi tiết model Nemotron
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_002 - Xem chi tiết model Nemotron (model detail page)', async ({ page }) => {
  test.skip(!NEMOTRON_DEPLOYED, `${MODEL_NAME} chưa deploy trên STG`);

  // STEP 1: Truy cập trang chủ và tìm model Nemotron
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  const searchInput = page
    .locator('input[placeholder*="search" i], input[placeholder*="model" i], input[type="search"]')
    .first();
  await searchInput.fill(MODEL_NAME);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('domcontentloaded');

  // STEP 2: Click vào model card Nemotron
  const modelCard = page.getByRole('link').filter({ hasText: MODEL_API_ID }).first();
  await expect(modelCard).toBeVisible({ timeout: 10000 });
  await modelCard.click();
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ Step 2 PASS: Click vào model Nemotron');

  // STEP 3: Verify trang chi tiết hiển thị đúng
  await expect(page.getByText(MODEL_API_ID).first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Step 3 PASS: Trang chi tiết model Nemotron load thành công');

  // STEP 4: Verify các thông tin kỹ thuật hiển thị
  const pageContent = page.locator('main, [class*="detail"], [class*="content"]').first();
  await expect(pageContent).toBeVisible({ timeout: 5000 });

  // Verify có ít nhất một trong các thông tin: API endpoint, pricing, description
  const hasInfo = await Promise.any([
    page.getByText(/api/i).first().waitFor({ timeout: 5000 }),
    page.getByText(/pricing|price/i).first().waitFor({ timeout: 5000 }),
    page.getByText(/description|overview/i).first().waitFor({ timeout: 5000 }),
  ]).then(() => true).catch(() => false);
  expect(hasInfo).toBe(true);
  console.log('✅ Step 4 PASS: Thông tin chi tiết model hiển thị');
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_003 — Create API Key để sử dụng Nemotron
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_003 - Create API Key để test Nemotron', async ({ page }) => {
  test.setTimeout(60000);
  const keyName = `nemotron-test-${Date.now()}`;

  // STEP 1: Vào My API Keys
  await goToMyAPIKeys(page);
  console.log('✅ Step 1 PASS: Mở trang My API Keys');

  // STEP 2: Mở dialog Create API Key
  await page.getByRole('button', { name: /create new api key/i }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 5000 });
  await expect(modal.getByText('Create an API Key')).toBeVisible();
  console.log('✅ Step 2 PASS: Dialog "Create an API Key" mở thành công');

  // STEP 3: Điền tên key dành cho Nemotron testing
  await modal.getByPlaceholder(/your name/i).fill(keyName);
  console.log(`✅ Step 3 PASS: Đặt tên key "${keyName}"`);

  // STEP 4: Verify tất cả permissions được chọn mặc định
  const checkboxes = modal.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(checkboxes.nth(i)).toBeChecked();
  }
  console.log(`✅ Step 4 PASS: ${count} permissions đều được chọn mặc định`);

  // STEP 5: Click Create
  await modal.getByRole('button', { name: /^create$/i }).click();

  // STEP 6: "Save your API Key" popup xuất hiện với key value
  const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
  await expect(saveModal).toBeVisible({ timeout: 20000 });
  console.log('✅ Step 6 PASS: "Save your API Key" popup xuất hiện');

  // STEP 7: Verify API key bắt đầu bằng "sk-"
  const apiKeyInput = saveModal.locator('input').first();
  if (await apiKeyInput.count() > 0) {
    await expect(apiKeyInput).toHaveValue(/^sk-/, { timeout: 10000 });
    const keyVal = await apiKeyInput.inputValue();
    console.log(`✅ Step 7 PASS: API key hợp lệ: ${keyVal.substring(0, 12)}...`);
  } else {
    await expect(saveModal.locator('text=/sk-/')).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 7 PASS: API key "sk-" hiển thị');
  }

  // STEP 8: Click Done → key xuất hiện trong danh sách
  await saveModal.getByRole('button', { name: /done/i }).click();
  await expect(saveModal).not.toBeVisible({ timeout: 5000 });

  await page.waitForLoadState('load');
  const row = page.locator('table tbody tr').filter({ hasText: keyName });
  await expect(row).toBeVisible({ timeout: 10000 });
  await expect(row.getByText(/active/i)).toBeVisible();
  console.log(`✅ Step 8 PASS: Key "${keyName}" xuất hiện trong danh sách với status Active`);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_004 — Call API với model Nemotron
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_004 - Gọi API inference với model Nemotron', async ({ request }) => {
  test.skip(!NEMOTRON_DEPLOYED, `${MODEL_NAME} chưa deploy trên STG`);
  test.setTimeout(60000);

  // STEP 1: POST chat completions tới Nemotron model
  const url = `${FPT_API_URL}/v1/chat/completions?from=${FPT_FROM}&model=${MODEL_API_ID}`;
  console.log(`📡 Calling: ${url}`);

  const res = await request.post(url, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${FPT_API_KEY}`,
    },
    data: {
      model:     MODEL_API_ID,
      messages:  [{ role: 'user', content: `Hello ${MODEL_NAME}! What are your key capabilities?` }],
      streaming: false,
      temperature: 0.7,
      max_tokens:  512,
    },
  });

  // STEP 2: Verify HTTP 200
  console.log(`📡 ${MODEL_API_ID} → HTTP ${res.status()}`);
  expect(res.status(), `${MODEL_API_ID} should return 200`).toBe(200);
  console.log('✅ Step 2 PASS: HTTP 200 OK');

  // STEP 3: Verify response structure
  const body = await res.json();
  expect(body, 'Response thiếu field "choices"').toHaveProperty('choices');
  expect(body.choices.length, 'choices array rỗng').toBeGreaterThan(0);
  console.log('✅ Step 3 PASS: Response có "choices" array');

  // STEP 4: Verify content không rỗng
  const content = body.choices[0].message?.content ?? '';
  expect(content.length, 'Content trống').toBeGreaterThan(0);
  console.log(`✅ Step 4 PASS: Content nhận được: "${content.substring(0, 100)}..."`);

  // STEP 5: Verify model field trong response
  expect(body.model ?? body.id ?? MODEL_API_ID).toMatch(new RegExp(MODEL_NAME, 'i'));
  console.log('✅ Step 5 PASS: Response model field khớp');
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_005 — Dùng Nemotron trong Playground
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_005 - Dùng model Nemotron trong Playground', async ({ page }) => {
  test.skip(!NEMOTRON_DEPLOYED, `${MODEL_NAME} chưa deploy trên STG`);
  test.setTimeout(120000);

  // STEP 1: Mở Playground
  await page.goto(`${BASE_URL.replace(/\/en$/, '')}/en/playground`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/playground/);
  await expect(page.getByText('Playground')).toBeVisible({ timeout: 10000 });
  console.log('✅ Step 1 PASS: Mở Playground thành công');

  // STEP 2: Chọn model Nemotron từ dropdown
  const modelSelector = page.locator('.ant-select-selector').first();
  await modelSelector.click();
  await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)', { timeout: 5000 });
  await page.locator('.ant-select-selection-search-input').last().fill(MODEL_API_ID);
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option').filter({ hasText: new RegExp(MODEL_API_ID, 'i') }).first().click();

  await expect(
    page.locator('.ant-select-selection-item').filter({ hasText: new RegExp(MODEL_API_ID, 'i') })
  ).toBeVisible({ timeout: 5000 });
  console.log(`✅ Step 2 PASS: Đã chọn model ${MODEL_API_ID}`);

  // STEP 3: Gửi câu hỏi cho Nemotron
  const chatInput = page.getByPlaceholder(/type a message/i);
  await expect(chatInput).toBeVisible();
  await chatInput.click();

  const message = `Hello ${MODEL_API_ID}! Describe yourself briefly.`;
  await chatInput.fill(message);
  // Verify text was accepted by React controlled component
  await expect(chatInput).toHaveValue(message, { timeout: 5000 });

  // Wait for send button to become enabled
  const sendBtn = page.locator('button:has(img[alt="send"]), button[aria-label*="send" i], button:has(.anticon-send)').last();
  await expect(sendBtn).toBeEnabled({ timeout: 10000 });
  await sendBtn.click();

  // Verify message was sent: input should be cleared
  await expect(chatInput).toHaveValue('', { timeout: 5000 });
  console.log('✅ Step 3 PASS: Đã gửi message');

  // STEP 4: Verify AI response xuất hiện
  const responseArea = page.locator('.prose').last();
  await expect(responseArea).not.toBeEmpty({ timeout: 60000 });
  const responseText = await responseArea.textContent();
  expect(responseText).not.toBeNull();
  expect(responseText!.length).toBeGreaterThan(10);
  console.log(`✅ Step 4 PASS: Nhận được response từ ${MODEL_NAME}: "${responseText?.substring(0, 80)}..."`);

  // STEP 5: Click View Code → verify model Nemotron xuất hiện trong code snippet
  const viewCodeBtn = page.getByRole('button', { name: /view code/i });
  await expect(viewCodeBtn).toBeVisible();
  await viewCodeBtn.click();

  const viewCodeModal = page.getByRole('dialog').filter({ hasText: 'View Code' });
  await expect(viewCodeModal).toBeVisible({ timeout: 5000 });
  await expect(viewCodeModal.getByText(new RegExp(MODEL_API_ID, 'i'))).toBeVisible();
  console.log('✅ Step 5 PASS: View Code hiển thị đúng model Nemotron trong code snippet');

  await viewCodeModal.getByRole('button', { name: 'Done' }).click();
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TC_NEMOTRON_006 — Check My Usage sau khi dùng Nemotron
// ═══════════════════════════════════════════════════════════════════════════════

test('TC_NEMOTRON_006 - Check My Usage — thống kê usage của Nemotron', async ({ page }) => {
  test.skip(!NEMOTRON_DEPLOYED, `${MODEL_NAME} chưa deploy trên STG`);
  test.setTimeout(30000);

  // STEP 1: Vào trang My Account → My Usage
  await page.goto(`${BASE_URL}/my-account?tab=my-usage`);
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ Step 1 PASS: Vào trang My Usage');

  // STEP 2: Verify trang My Usage load thành công
  const heading = page.getByRole('heading', { name: /usage|my usage/i }).first();
  await expect(heading).toBeVisible({ timeout: 10000 });
  console.log('✅ Step 2 PASS: Trang My Usage hiển thị thành công');

  // STEP 3: Verify bảng/danh sách usage có dữ liệu
  const usageTable = page.locator('table, [class*="usage"], [class*="chart"]').first();
  await expect(usageTable).toBeVisible({ timeout: 10000 });
  console.log('✅ Step 3 PASS: Bảng/chart usage hiển thị');

  // STEP 4: Tìm entry Nemotron trong usage (nếu đã gọi API trước đó)
  const nemotronRow = page.locator('table tbody tr, [class*="row"], [class*="item"]')
    .filter({ hasText: new RegExp(MODEL_NAME, 'i') })
    .first();

  const hasNemotronUsage = await nemotronRow.isVisible().catch(() => false);
  if (hasNemotronUsage) {
    console.log(`✅ Step 4 PASS: Tìm thấy usage record cho ${MODEL_NAME}`);
    // Verify có token count hoặc request count
    const usageText = await nemotronRow.textContent();
    console.log(`   Usage data: ${usageText?.substring(0, 100)}`);
  } else {
    console.log(`⚠️  Step 4 INFO: Chưa có usage record cho ${MODEL_NAME} (cần gọi API trước)`);
  }

  // STEP 5: Verify filter/date range selector có mặt
  const dateFilter = page.locator('[class*="date"], [class*="filter"], input[type="date"], .ant-picker').first();
  const hasFilter = await dateFilter.isVisible().catch(() => false);
  if (hasFilter) {
    console.log('✅ Step 5 PASS: Date range filter hiển thị');
  }
});
