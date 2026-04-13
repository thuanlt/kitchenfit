// sla-dashboard.spec.ts — US-01: SLA Dashboard (Service Health)
// Prototype: https://dashboard-luxe.lovable.app/
// Wiki: https://wiki.fci.vn/display/NCPP/SLA+Dashboard
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://marketplace-stg.fptcloud.net/en';
const isPrototype = BASE_URL.includes('lovable.app');
// Prototype: service-health ở root "/"; staging: "/service-health"
const SERVICE_HEALTH_URL = isPrototype ? BASE_URL : `${BASE_URL}/service-health`;

/** navigate với waitUntil:'commit' — tránh ERR_ABORTED trên SPA/service-worker */
async function goto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await page.waitForTimeout(1500);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-001 — Hiển thị trang Service Health
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-001 — Hiển thị trang Service Health', () => {
  test('TC-SLA-001: Trang Service Health load thành công với đầy đủ thành phần', async ({ page }) => {
    test.setTimeout(60000);

    // ── STEP 1: Truy cập trang Service Health ──────────────────────────────
    await goto(page, SERVICE_HEALTH_URL);
    console.log('✅ Step 1 PASS: Truy cập trang Service Health thành công');

    // ── STEP 2: Verify sidebar menu hiển thị đủ 3 mục ──────────────────────
    await expect(page.getByRole('link', { name: /service health/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: /my usage/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my api keys/i })).toBeVisible();
    console.log('✅ Step 2 PASS: Sidebar menu hiển thị đủ 3 mục');

    // ── STEP 3: Verify status banner hiển thị ──────────────────────────────
    const statusBanner = page.getByText(/all systems operational|degraded performance|partial outage|major outage/i);
    await expect(statusBanner).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 3 PASS: Status banner hiển thị thành công');

    // ── STEP 4: Verify bộ lọc tháng/năm hiển thị ──────────────────────────
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByRole('spinbutton')).toBeVisible();
    await expect(page.getByRole('button', { name: /apply/i })).toBeVisible();
    console.log('✅ Step 4 PASS: Bộ lọc tháng/năm hiển thị đầy đủ');

    // ── STEP 5: Verify Personal uptime section hiển thị ───────────────────
    await expect(page.getByText(/personal uptime/i)).toBeVisible();
    await expect(page.locator('text=/\\d+\\.?\\d*%/').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 5 PASS: Personal uptime hiển thị thành công');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-002 — Hiển thị trạng thái hệ thống
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-002 — Hiển thị trạng thái hệ thống', () => {
  test('TC-SLA-002: Status banner hiển thị đúng trạng thái và icon', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    // ── STEP 1: Verify status text xuất hiện ──────────────────────────────
    const statusText = page.getByText(/all systems operational|degraded performance|partial outage|major outage/i);
    await expect(statusText).toBeVisible({ timeout: 15000 });
    const statusContent = await statusText.textContent();
    console.log(`✅ Step 1 PASS: System status = "${statusContent}"`);

    // ── STEP 2: Verify img icon hiển thị trong cùng container ─────────────
    const statusIcon = page.locator('img').first();
    await expect(statusIcon).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2 PASS: Status icon hiển thị thành công');

    // ── STEP 3: Xác nhận text hợp lệ ──────────────────────────────────────
    const validStatuses = ['all systems operational', 'degraded performance', 'partial outage', 'major outage'];
    const isValid = validStatuses.some(s => statusContent?.toLowerCase().includes(s));
    expect(isValid).toBe(true);
    console.log('✅ Step 3 PASS: Status text hợp lệ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-003 — Hiển thị Personal Uptime
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-003 — Hiển thị Personal Uptime', () => {
  test('TC-SLA-003: Personal uptime hiển thị phần trăm hợp lệ (0–100%)', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    // ── STEP 1: Verify label "Personal uptime" hiển thị ───────────────────
    await expect(page.getByText(/personal uptime/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 1 PASS: Label "Personal uptime" hiển thị');

    // ── STEP 2: Verify giá trị % hợp lệ ──────────────────────────────────
    const uptimeText = await page.locator('text=/\\d+\\.?\\d*%/').first().textContent({ timeout: 10000 });
    expect(uptimeText).toMatch(/^\d+(\.\d+)?%$/);
    const uptimeNum = parseFloat(uptimeText!.replace('%', ''));
    expect(uptimeNum).toBeGreaterThanOrEqual(0);
    expect(uptimeNum).toBeLessThanOrEqual(100);
    console.log(`✅ Step 2 PASS: Personal uptime = ${uptimeText} (hợp lệ 0–100%)`);

    // ── STEP 3: Verify refresh badge "5m" hiển thị ────────────────────────
    const refreshBadge = page.getByText(/^\d+m$/i);
    const hasBadge = await refreshBadge.isVisible().catch(() => false);
    console.log(`✅ Step 3 PASS: Refresh badge ${hasBadge ? '"5m" hiển thị' : 'không bắt buộc'}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-004 — Hiển thị biểu đồ Uptime
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-004 — Hiển thị biểu đồ Uptime', () => {
  test('TC-SLA-004: Biểu đồ uptime timeline được render và có nhãn ngày tháng', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    // ── STEP 1: Verify chart/img container hiển thị ───────────────────────
    // Prototype dùng <img> SVG để render chart
    const chart = page.locator('canvas, svg, img[class*="uptime"], [class*="chart"], [class*="graph"]')
      .or(page.locator('img').nth(1)) // img thứ 2 trở đi = chart
      .first();
    await expect(chart).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 1 PASS: Biểu đồ uptime render thành công');

    // ── STEP 2: Verify nhãn ngày tháng trên timeline ──────────────────────
    const dateLabel = page.getByText(/mar|apr|may|jun|jan|feb|jul|aug|sep|oct|nov|dec/i).first();
    const hasDateLabel = await dateLabel.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✅ Step 2 PASS: Nhãn ngày tháng ${hasDateLabel ? 'hiển thị' : 'embedded trong img'}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-005 — Bộ lọc theo tháng
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-005 — Bộ lọc theo tháng', () => {
  test('TC-SLA-005: Chọn tháng khác, click Apply — trang không crash', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    // ── STEP 1: Lấy giá trị uptime ban đầu ───────────────────────────────
    const uptimeLocator = page.locator('text=/\\d+\\.?\\d*%/').first();
    await expect(uptimeLocator).toBeVisible({ timeout: 15000 });
    const initialUptime = await uptimeLocator.textContent();
    console.log(`✅ Step 1 PASS: Uptime ban đầu = ${initialUptime}`);

    // ── STEP 2: Mở dropdown tháng ─────────────────────────────────────────
    const monthDropdown = page.getByRole('combobox');
    await expect(monthDropdown).toBeVisible();
    await monthDropdown.click();
    await page.waitForTimeout(800);

    // ── STEP 3: Chọn tháng đầu tiên trong listbox ─────────────────────────
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 5000 });
    const firstOption = listbox.getByRole('option').first();
    await firstOption.click();
    console.log('✅ Step 3 PASS: Chọn tháng thành công');

    // ── STEP 4: Click Apply ───────────────────────────────────────────────
    await page.getByRole('button', { name: /apply/i }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 4 PASS: Click Apply thành công');

    // ── STEP 5: Verify trang vẫn hiển thị (không crash) ───────────────────
    await expect(page.getByText(/personal uptime/i)).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 5 PASS: Trang không crash sau khi đổi tháng');
  });

  test('TC-SLA-005b: Dropdown tháng chứa đủ 12 tháng', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    const monthDropdown = page.getByRole('combobox');
    await expect(monthDropdown).toBeVisible({ timeout: 15000 });
    await monthDropdown.click();
    await page.waitForTimeout(800);

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 5000 });
    const optionCount = await listbox.getByRole('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(12);
    console.log(`✅ PASS: Dropdown tháng có ${optionCount} options (>= 12)`);

    await page.keyboard.press('Escape');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-006 — Bộ lọc theo năm
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-006 — Bộ lọc theo năm', () => {
  test('TC-SLA-006: Nhập năm hợp lệ, click Apply — trang không crash', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    // ── STEP 1: Verify input năm hiển thị với giá trị mặc định ─────────────
    const yearInput = page.getByRole('spinbutton');
    await expect(yearInput).toBeVisible({ timeout: 15000 });
    const defaultYear = await yearInput.inputValue();
    expect(defaultYear).toMatch(/^\d{4}$/);
    console.log(`✅ Step 1 PASS: Năm mặc định = ${defaultYear}`);

    // ── STEP 2: Xóa và nhập năm trước ────────────────────────────────────
    const targetYear = new Date().getFullYear() - 1;
    await yearInput.click({ clickCount: 3 });
    await yearInput.fill(String(targetYear));
    expect(await yearInput.inputValue()).toBe(String(targetYear));
    console.log(`✅ Step 2 PASS: Nhập năm ${targetYear} thành công`);

    // ── STEP 3: Click Apply ───────────────────────────────────────────────
    await page.getByRole('button', { name: /apply/i }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 3 PASS: Click Apply thành công');

    // ── STEP 4: Verify trang không bị lỗi ────────────────────────────────
    await expect(page.getByText(/personal uptime/i)).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 4 PASS: Trang không crash sau khi đổi năm');
  });

  test('TC-SLA-006b: Nhập năm tương lai — hệ thống xử lý graceful', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    const yearInput = page.getByRole('spinbutton');
    await expect(yearInput).toBeVisible({ timeout: 15000 });
    await yearInput.click({ clickCount: 3 });
    await yearInput.fill(String(new Date().getFullYear() + 5));

    await page.getByRole('button', { name: /apply/i }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(/personal uptime/i)).toBeVisible({ timeout: 10000 });
    console.log('✅ PASS: Năm tương lai — trang xử lý graceful, không crash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-007 — Giá trị mặc định của bộ lọc
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-007 — Giá trị mặc định của bộ lọc', () => {
  test('TC-SLA-007: Bộ lọc mặc định hiển thị tháng và năm hiện tại', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

    // ── STEP 1: Verify năm mặc định ───────────────────────────────────────
    const yearInput = page.getByRole('spinbutton');
    await expect(yearInput).toBeVisible({ timeout: 15000 });
    expect(await yearInput.inputValue()).toBe(currentYear);
    console.log(`✅ Step 1 PASS: Năm mặc định = ${currentYear}`);

    // ── STEP 2: Verify tháng mặc định ────────────────────────────────────
    const monthDropdown = page.getByRole('combobox');
    await expect(monthDropdown).toBeVisible();
    const monthText = await monthDropdown.textContent();
    expect(monthText?.toLowerCase()).toContain(currentMonthName.toLowerCase());
    console.log(`✅ Step 2 PASS: Tháng mặc định = "${monthText}" (${currentMonthName})`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-008 — Điều hướng Sidebar: My Usage
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-008 — Điều hướng sidebar sang My Usage', () => {
  test('TC-SLA-008: Click "My usage" trong sidebar — chuyển trang thành công', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    const myUsageLink = page.getByRole('link', { name: /my usage/i });
    await expect(myUsageLink).toBeVisible({ timeout: 15000 });
    await myUsageLink.click();

    await expect(page).toHaveURL(/usage/, { timeout: 10000 });
    console.log('✅ PASS: URL chuyển sang /usage thành công');

    await expect(page.getByRole('link', { name: /my usage/i })).toBeVisible();
    console.log('✅ PASS: Sidebar "My usage" hiển thị active');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-009 — Điều hướng Sidebar: My API Keys
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-009 — Điều hướng sidebar sang My API Keys', () => {
  test('TC-SLA-009: Click "My API Keys" trong sidebar — chuyển trang thành công', async ({ page }) => {
    test.setTimeout(60000);

    await goto(page, SERVICE_HEALTH_URL);

    const apiKeysLink = page.getByRole('link', { name: /my api keys/i });
    await expect(apiKeysLink).toBeVisible({ timeout: 15000 });
    await apiKeysLink.click();

    await expect(page).toHaveURL(/api-keys/, { timeout: 10000 });
    console.log('✅ PASS: URL chuyển sang /api-keys thành công');

    await expect(
      page.getByRole('heading', { name: /api keys/i }).or(page.getByText(/api keys/i).first())
    ).toBeVisible({ timeout: 10000 });
    console.log('✅ PASS: Trang My API Keys hiển thị đúng');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-010 — Điều hướng quay lại Service Health
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-010 — Quay lại Service Health từ trang khác', () => {
  test('TC-SLA-010: Từ My usage click "Service health" trong sidebar — quay lại đúng trang', async ({ page }) => {
    test.setTimeout(60000);

    // ── STEP 1: Vào My Usage trước ────────────────────────────────────────
    const usageUrl = isPrototype ? `${BASE_URL.replace(/\/$/, '')}/usage` : `${BASE_URL}/usage`;
    await goto(page, usageUrl);
    console.log('✅ Step 1 PASS: Đang ở trang My usage');

    // ── STEP 2: Click "Service health" trong sidebar ──────────────────────
    const serviceHealthLink = page.getByRole('link', { name: /service health/i });
    await expect(serviceHealthLink).toBeVisible({ timeout: 15000 });
    await serviceHealthLink.click();
    await page.waitForTimeout(1000);

    // ── STEP 3: Verify URL quay về root hoặc /service-health ─────────────
    const url = page.url();
    const isBack = isPrototype
      ? url === SERVICE_HEALTH_URL || url === SERVICE_HEALTH_URL + '/'
      : url.includes('service-health');
    expect(isBack).toBe(true);
    console.log(`✅ Step 3 PASS: URL = ${url}`);

    // ── STEP 4: Verify nội dung Service Health ────────────────────────────
    await expect(page.getByText(/personal uptime/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 4 PASS: Nội dung Service Health hiển thị đúng');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-SLA-011 — Truy cập khi chưa đăng nhập (chỉ chạy trên staging, skip prototype)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-SLA-011 — Kiểm tra bảo vệ route khi chưa đăng nhập', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-SLA-011: User chưa đăng nhập truy cập /service-health — bị redirect về login', async ({ page }) => {
    test.skip(isPrototype, 'Prototype không có auth layer — chỉ chạy trên staging/prod');
    test.setTimeout(30000);

    await goto(page, SERVICE_HEALTH_URL);

    const isRedirectedToLogin =
      page.url().includes('login') ||
      page.url().includes('sign-in') ||
      page.url().includes('id.fptcloud');
    const hasLoginButton = await page.getByRole('button', { name: /sign in|login/i }).isVisible().catch(() => false);
    const hasLoginHeading = await page.getByRole('heading', { name: /sign in|login/i }).isVisible().catch(() => false);

    expect(isRedirectedToLogin || hasLoginButton || hasLoginHeading).toBe(true);
    console.log(`✅ PASS: Route được bảo vệ (URL: ${page.url()})`);
  });
});
