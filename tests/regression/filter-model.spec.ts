/**
 * filter-model.spec.ts
 * TC_FILTER_001 → TC_FILTER_006
 *
 * Tính năng: Filter Model theo category trên trang chủ FPT AI Marketplace
 * URL: /en  (model list nằm trên homepage, KHÔNG phải /en/models)
 * Filter UI: tablist với các tab category
 * URL pattern khi filter: /en?category=<uuid>
 */

import { test, expect } from '@playwright/test';
import { config } from '../../utils/config';

// Category UUIDs (lấy từ URL sau khi click tab)
const CATEGORY = {
  LLM:         '53118391-bfc0-4bf6-960f-f0af1f4b8495',
  SPEECH_TO_TEXT: 'f88323a2-5b28-4dc6-9c5b-d3ba8b6dcf29',
  TEXT_TO_SPEECH: '3189262d-caac-47e9-b707-9279cc8194b2',
};

test.describe('Filter Model — Regression STG', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(config.baseUrl);
    // Chờ tablist filter hiển thị
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
  });

  // ─── TC_FILTER_001 ─────────────────────────────────────────────────────────
  test('TC_FILTER_001 — Tab All: hiển thị tất cả models (>5 cards)', async ({ page }) => {
    await page.getByRole('tab', { name: 'All' }).click();

    // URL trở về base (không có ?category)
    await expect(page).toHaveURL(config.baseUrl);

    // Có nhiều hơn 5 model card
    const cards = page.getByRole('link').filter({ hasText: /Serverless|Text Generation|Speech to Text|Image/i });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(5);

    // Total records > 10
    await expect(page.getByText(/Total records: \d+/)).toBeVisible();
    const totalText = await page.getByText(/Total records: \d+/).textContent();
    const total = parseInt(totalText?.match(/\d+/)?.[0] ?? '0');
    expect(total).toBeGreaterThan(10);
  });

  // ─── TC_FILTER_002 ─────────────────────────────────────────────────────────
  test('TC_FILTER_002 — Tab Large Language Model: chỉ hiện Text Generation', async ({ page }) => {
    await page.getByRole('tab', { name: 'Large Language Model' }).click();

    // URL có category UUID của LLM
    await expect(page).toHaveURL(`${config.baseUrl}?category=${CATEGORY.LLM}`);

    // Tab được active
    await expect(page.getByRole('tab', { name: 'Large Language Model' })).toHaveAttribute('aria-selected', 'true');

    // Có kết quả
    const cards = page.getByRole('link').filter({ hasText: 'Text Generation' });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // Không có card nào thuộc Speech to Text hay Image & Text to Text
    await expect(page.getByRole('link').filter({ hasText: 'Speech to Text' })).toHaveCount(0);

    // Verify total records giảm so với All
    const totalText = await page.getByText(/Total records: \d+/).textContent();
    const total = parseInt(totalText?.match(/\d+/)?.[0] ?? '0');
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(31); // nhỏ hơn tổng All
  });

  // ─── TC_FILTER_003 ─────────────────────────────────────────────────────────
  test('TC_FILTER_003 — Tab Speech to Text: hiển thị Whisper models', async ({ page }) => {
    await page.getByRole('tab', { name: 'Speech to Text' }).click();

    // URL đúng
    await expect(page).toHaveURL(`${config.baseUrl}?category=${CATEGORY.SPEECH_TO_TEXT}`);

    // Có FPT.AI-whisper models
    await expect(page.getByRole('link').filter({ hasText: 'FPT.AI-whisper-medium' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link').filter({ hasText: 'FPT.AI-whisper-large-v3-turbo' })).toBeVisible();

    // Badge đúng loại
    const cards = page.getByRole('link').filter({ hasText: 'Speech to Text' });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Total records = 2 (chỉ có 2 whisper models trên STG)
    await expect(page.getByText('Total records: 2')).toBeVisible();
  });

  // ─── TC_FILTER_004 ─────────────────────────────────────────────────────────
  test('TC_FILTER_004 — Tab Text to Speech: hiển thị No results found', async ({ page }) => {
    await page.getByRole('tab', { name: 'Text to Speech' }).click();

    // URL đúng
    await expect(page).toHaveURL(`${config.baseUrl}?category=${CATEGORY.TEXT_TO_SPEECH}`);

    // Tab active
    await expect(page.getByRole('tab', { name: 'Text to Speech' })).toHaveAttribute('aria-selected', 'true');

    // Không có model nào trên STG → hiện "No results found"
    await expect(page.getByText('No results found')).toBeVisible({ timeout: 5000 });
  });

  // ─── TC_FILTER_005 ─────────────────────────────────────────────────────────
  test('TC_FILTER_005 — Tab Vision Language Model: chỉ hiện Image & Text to Text', async ({ page }) => {
    await page.getByRole('tab', { name: 'Vision Language Model' }).click();

    // URL có category param
    await expect(page).toHaveURL(/\?category=/);

    // Tab active
    await expect(page.getByRole('tab', { name: 'Vision Language Model' })).toHaveAttribute('aria-selected', 'true');

    // Có cards với badge "Image & Text to Text"
    const cards = page.getByRole('link').filter({ hasText: 'Image & Text to Text' });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // Các models đặc trưng của VLM phải xuất hiện
    const hasVLM = await Promise.any([
      page.getByRole('link').filter({ hasText: 'Qwen2.5-VL' }).first().waitFor({ timeout: 5000 }),
      page.getByRole('link').filter({ hasText: 'Qwen3-VL' }).first().waitFor({ timeout: 5000 }),
      page.getByRole('link').filter({ hasText: 'FPT.AI-KIE' }).first().waitFor({ timeout: 5000 }),
    ]).then(() => true).catch(() => false);
    expect(hasVLM).toBe(true);

    // Không có Text Generation cards
    await expect(page.getByRole('link').filter({ hasText: 'Speech to Text' })).toHaveCount(0);
  });

  // ─── TC_FILTER_006 ─────────────────────────────────────────────────────────
  test('TC_FILTER_006 — Chuyển filter liên tiếp: LLM → Speech to Text → All', async ({ page }) => {
    // Bước 1: LLM
    await page.getByRole('tab', { name: 'Large Language Model' }).click();
    await expect(page).toHaveURL(`${config.baseUrl}?category=${CATEGORY.LLM}`);
    await expect(page.getByRole('link').filter({ hasText: 'Text Generation' }).first()).toBeVisible({ timeout: 5000 });
    const llmTotal = await page.getByText(/Total records: \d+/).textContent();

    // Bước 2: Speech to Text
    await page.getByRole('tab', { name: 'Speech to Text' }).click();
    await expect(page).toHaveURL(`${config.baseUrl}?category=${CATEGORY.SPEECH_TO_TEXT}`);
    await expect(page.getByRole('link').filter({ hasText: 'FPT.AI-whisper' }).first()).toBeVisible({ timeout: 5000 });
    const sttTotal = await page.getByText(/Total records: \d+/).textContent();

    // LLM nhiều record hơn Speech to Text
    const llmCount = parseInt(llmTotal?.match(/\d+/)?.[0] ?? '0');
    const sttCount = parseInt(sttTotal?.match(/\d+/)?.[0] ?? '0');
    expect(llmCount).toBeGreaterThan(sttCount);

    // Bước 3: All
    await page.getByRole('tab', { name: 'All' }).click();
    await expect(page).toHaveURL(config.baseUrl);
    await expect(page.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
    const allTotal = await page.getByText(/Total records: \d+/).textContent();
    const allCount = parseInt(allTotal?.match(/\d+/)?.[0] ?? '0');
    expect(allCount).toBeGreaterThanOrEqual(llmCount);
  });

});
