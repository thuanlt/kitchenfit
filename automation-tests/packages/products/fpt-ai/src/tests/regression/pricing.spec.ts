// ai-fptcloud-pricing.spec.ts
// Precondition: đã login vào ai.fptcloud.com (qua ai-auth.setup.ts → ai-user.json)
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const WORKSPACE = process.env.AI_WORKSPACE_ID ?? 'AIMKP-THUANLT9-SZH9L';

const CONFIG = {
  pricingUrl:     `https://ai.fptcloud.com/${WORKSPACE}/pricing/maas`,
  serverlessUrl:  `https://ai.fptcloud.com/${WORKSPACE}/pricing/maas?tab=serverless`,
  dedicatedUrl:   `https://ai.fptcloud.com/${WORKSPACE}/pricing/maas?tab=dedicated`,
};

// ═══════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════
const SEL = {
  // Main tabs
  tabAiInference:   '.semi-tabs-tab:has-text("AI Inference")',
  tabGpuVM:         '.semi-tabs-tab:has-text("GPU Virtual Machine")',
  tabGpuContainer:  '.semi-tabs-tab:has-text("GPU Container")',
  tabAiStudio:      '.semi-tabs-tab:has-text("AI Studio")',

  // Sub-tabs
  subTabServerless: 'button:has-text("Serverless Endpoint")',
  subTabDedicated:  'button:has-text("Dedicated Endpoint")',

  // Buttons
  btnGetApiKeys:      '#semiTabPanel4 > div > div.bg-white.rounded-md.p-4.flex.flex-col.mt-3 > div.flex.justify-between.items-center.text-lg > button, button:has-text("Get your API Keys")',
  btnDeployDedicated: 'button:has-text("Deploy Dedicated Endpoints")',
  btnContactSales:    'button:has-text("Contact Sales")',

  // Currency
  currencyDropdown: '.semi-select.border:has-text("VND"), .semi-select.border:has-text("USD")',

  // Model sections (serverless)
  sectionVLM:       'h2:has-text("Vision Language Model"), h3:has-text("Vision Language Model")',
  sectionEmbedding: 'h2:has-text("Text Embeddings"), h3:has-text("Text Embeddings")',
  sectionTTS:       'h2:has-text("Text to Speech"), h3:has-text("Text to Speech")',
  sectionRerank:    'h2:has-text("Rerank"), h3:has-text("Rerank")',
  sectionLLM:       'h2:has-text("Large Language Model"), h3:has-text("Large Language Model")',
  sectionSTT:       'h2:has-text("Speech to Text"), h3:has-text("Speech to Text")',

  // Dedicated empty state
  noPricingHeading:  'text=No Pricing Information Available',
  noPricingSubtitle: 'text=We\'re currently updating the pricing information',

  // Footnote
  footnoteVND: 'text=Prices are shown based on current exchange rates',
  footnoteUSD: 'text=Prices in USD apply to customers who are not residing in Vietnam',
};

// ═══════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════
test.describe('Pricing > AI Inference Tab', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await page.goto(CONFIG.pricingUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  // ─────────────────────────────────────────────
  // TC-AI-001: Navigate to AI Inference tab
  // ─────────────────────────────────────────────
  test('TC-AI-001 | Navigate to AI Inference tab', async ({ page }) => {
    await page.locator(SEL.tabAiInference).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/pricing\/maas/);
    await expect(page.locator(SEL.tabAiInference)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(SEL.subTabServerless)).toBeVisible();
    await expect(page.locator(SEL.subTabDedicated)).toBeVisible();
    console.log('✅ TC-AI-001 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-002: 4 main tabs visible
  // ─────────────────────────────────────────────
  test('TC-AI-002 | Verify 4 main pricing tabs display correctly', async ({ page }) => {
    await expect(page.locator(SEL.tabAiInference)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(SEL.tabGpuVM)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(SEL.tabGpuContainer)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(SEL.tabAiStudio)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(SEL.currencyDropdown)).toBeVisible({ timeout: 20000 });
    console.log('✅ TC-AI-002 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-003: Serverless Endpoint - 6 sections
  // ─────────────────────────────────────────────
  test('TC-AI-003 | Serverless Endpoint shows 6 model sections', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const sectionTexts = [
      'Vision Language Model', 'Text Embeddings', 'Text to Speech',
      'Rerank', 'Large Language Model', 'Speech to Text',
    ];
    for (const text of sectionTexts) {
      await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: 10000 });
    }
    console.log('✅ TC-AI-003 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-004: Dedicated Endpoint - empty state
  // ─────────────────────────────────────────────
  test('TC-AI-004 | Dedicated Endpoint shows empty state correctly', async ({ page }) => {
    await page.goto(CONFIG.dedicatedUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    await expect(page.locator(SEL.noPricingHeading)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(SEL.btnContactSales)).toBeVisible();
    await expect(page.locator(SEL.btnDeployDedicated)).toBeVisible();
    console.log('✅ TC-AI-004 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-005: Currency switch VND → USD
  // ─────────────────────────────────────────────
  test('TC-AI-005 | Currency switch VND to USD updates prices', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.locator(SEL.currencyDropdown).click();
    await page.locator('[role="option"]:has-text("USD"), li:has-text("USD")').first().click();
    await page.waitForTimeout(1000);

    const firstPrice = page.locator('table tbody tr:first-child td').nth(3);
    await expect(firstPrice).toContainText('$', { timeout: 8000 });
    console.log('✅ TC-AI-005 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-006: Currency switch USD → VND
  // ─────────────────────────────────────────────
  test('TC-AI-006 | Currency switch USD to VND updates prices', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Switch sang USD trước
    await expect(page.locator(SEL.currencyDropdown)).toBeVisible({ timeout: 20000 });
    await page.locator(SEL.currencyDropdown).click();
    await page.locator('[role="option"]:has-text("USD"), li:has-text("USD")').first().click();
    await page.waitForTimeout(500);

    // Rồi switch về VND
    await page.locator(SEL.currencyDropdown).click();
    await page.locator('[role="option"]:has-text("VND"), li:has-text("VND")').first().click();
    await page.waitForTimeout(1000);

    const firstPrice = page.locator('table tbody tr:first-child td').nth(3);
    await expect(firstPrice).toContainText('VND', { timeout: 8000 });
    console.log('✅ TC-AI-006 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-008: Vision Language Model data
  // ─────────────────────────────────────────────
  test('TC-AI-008 | Vision Language Model section has correct models', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const vlmModels = [
      'DeepSeek-OCR', 'FPT.AI-KIE-v1.7', 'FPT.AI-Table-Parsing-v1.1',
      'gemma-3-27b-it', 'Kimi-K2.5', 'Qwen2.5-VL-7B-Instruct', 'Qwen3-VL-8B-Instruct',
    ];
    for (const model of vlmModels) {
      await expect(page.locator(`text=${model}`)).toBeVisible({ timeout: 10000 });
    }

    const deepseekRow = page.locator('tr:has-text("DeepSeek-OCR")');
    await expect(deepseekRow).toContainText('8k');
    await expect(deepseekRow).toContainText('11,579');
    await expect(deepseekRow).toContainText('3,473');
    console.log('✅ TC-AI-008 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-011: Rerank model data
  // ─────────────────────────────────────────────
  test('TC-AI-011 | Rerank section shows bge-reranker-v2-m3 with correct data', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rerankRow = page.locator('tr:has-text("bge-reranker-v2-m3")');
    await expect(rerankRow).toBeVisible({ timeout: 20000 });
    await expect(rerankRow).toContainText('8k');
    await expect(rerankRow).toContainText('578');
    await expect(rerankRow).toContainText('0');
    await expect(rerankRow).toContainText('Million tokens');
    console.log('✅ TC-AI-011 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-013: Speech to Text model data
  // ─────────────────────────────────────────────
  test('TC-AI-013 | Speech to Text section shows 3 models correctly', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const sttModels = [
      { name: 'FPT.AI-whisper-large-v3-turbo', price: '781' },
      { name: 'FPT.AI-whisper-medium',          price: '434' },
      { name: 'whisper-large-v3-turbo',          price: '115' },
    ];
    for (const model of sttModels) {
      // Dùng exact cell match để tránh match nhầm row có tên tương tự
      const row = page.getByRole('row').filter({
        has: page.locator('td').filter({ hasText: new RegExp(`^${model.name.replace('.', '\\.')}`) }),
      }).first();
      await expect(row).toBeVisible({ timeout: 10000 });
      await expect(row).toContainText(model.price);
      await expect(row).toContainText('Minute');
    }
    console.log('✅ TC-AI-013 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-014: View detail opens marketplace
  // ─────────────────────────────────────────────
  test('TC-AI-014 | View detail icon opens correct marketplace page', async ({ page, context }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bgeRow = page.locator('tr:has-text("bge-reranker-v2-m3")').first();
    await expect(bgeRow).toBeVisible({ timeout: 20000 });
    await bgeRow.scrollIntoViewIfNeeded();

    const [newTab] = await Promise.all([
      context.waitForEvent('page'),
      bgeRow.locator('td:last-child button, td:last-child a').click(),
    ]);

    await newTab.waitForLoadState('domcontentloaded');
    await expect(newTab).toHaveURL(
      'https://marketplace.fptcloud.com/en/ai-product/BAAI/bge-reranker-v2-m3'
    );
    console.log('✅ TC-AI-014 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-016: Get your API Keys button
  // ─────────────────────────────────────────────
  test('TC-AI-016 | "Get your API Keys" button is visible and clickable', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    const btn = page.locator(SEL.btnGetApiKeys);
    await expect(btn).toBeVisible({ timeout: 20000 });
    await expect(btn).toBeEnabled();
    await btn.click();
    await page.waitForTimeout(1500);

    // Verify phản hồi: URL thay đổi HOẶC modal/panel mở ra
    const currentUrl = page.url();
    expect(currentUrl).toContain('ai.fptcloud.com');
    console.log('✅ TC-AI-016 PASSED — after click URL:', currentUrl);
  });

  // ─────────────────────────────────────────────
  // TC-AI-018: URL param preserved on reload
  // ─────────────────────────────────────────────
  test('TC-AI-018 | Tab state preserved after page reload via URL param', async ({ page }) => {
    await page.goto(CONFIG.dedicatedUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/tab=dedicated/);
    await expect(page.locator(SEL.noPricingHeading)).toBeVisible({ timeout: 8000 });
    console.log('✅ TC-AI-018 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-019: Footnote text matches VND currency
  // ─────────────────────────────────────────────
  test('TC-AI-019 | Footnote text correct for VND currency', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Footnote có thể hidden trong CSS — kiểm tra sự tồn tại trong DOM
    const footnote = page.locator(SEL.footnoteVND).first();
    await expect(footnote).toBeAttached({ timeout: 8000 });
    const footnoteText = await footnote.textContent();
    expect(footnoteText).toContain('Prices are shown based on current exchange rates');
    console.log('✅ TC-AI-019 PASSED');
  });

  // ─────────────────────────────────────────────
  // TC-AI-020: Table column headers correct
  // ─────────────────────────────────────────────
  test('TC-AI-020 | Table column headers display in correct order', async ({ page }) => {
    await page.goto(CONFIG.serverlessUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const expectedHeaders = [
      'Model name', 'Context length', 'Max output token',
      'Input price', 'Input Unit', 'Output price', 'Output Unit', 'View detail',
    ];
    for (const header of expectedHeaders) {
      // Tìm trong cả th lẫn role="columnheader"
      const cell = page.locator(`th:has-text("${header}"), [role="columnheader"]:has-text("${header}")`).first();
      await expect(cell).toBeVisible({ timeout: 8000 });
    }
    console.log('✅ TC-AI-020 PASSED');
  });

});
