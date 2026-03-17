// playground-chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TC_PLAYGROUND_001 - Playground Chat with Kimi-K2.5', () => {

  test('User can chat with Kimi-K2.5 and view code in Playground', async ({ page }) => {
    test.setTimeout(90000);

    // ─────────────────────────────────────────────────
    // STEP 1: Mở Playground từ header
    // ─────────────────────────────────────────────────
    await page.goto('https://marketplace.fptcloud.com/en/playground');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify URL và trang Playground load thành công
    await expect(page).toHaveURL(/\/en\/playground/);
    await expect(page.getByText('Playground')).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 1 PASS: Mở page Playground thành công');

    // ─────────────────────────────────────────────────
    // STEP 2: Chọn model Kimi-K2.5
    // ─────────────────────────────────────────────────
    // Ant Design Select — click vào .ant-select-selector để mở dropdown
    const modelSelector = page.locator('.ant-select-selector').first();

    const isAlreadySelected = await page.locator('.ant-select-selection-item[title*="Kimi"]').isVisible().catch(() => false);

    if (!isAlreadySelected) {
      await modelSelector.click();
      await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)', { timeout: 5000 });
      // Gõ vào search input để filter
      await page.locator('.ant-select-dropdown input[type="search"], .ant-select-selection-search-input').last().fill('Kimi');
      await page.waitForTimeout(500);
      // Click option đầu tiên khớp
      await page.locator('.ant-select-item-option').filter({ hasText: /kimi/i }).first().click();
    }

    await expect(page.locator('.ant-select-selection-item').filter({ hasText: /kimi-k2\.5/i })).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2a PASS: Model Kimi-K2.5 đã được chọn');

    // ─────────────────────────────────────────────────
    // STEP 2b: Gửi message "Hello Kimi-K2.5"
    // ─────────────────────────────────────────────────
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Hello Kimi-K2.5');

    // Click Send button (anticon-send)
    const sendButton = page.locator('button:has(.anticon-send)');
    await expect(sendButton).toBeVisible({ timeout: 5000 });
    await sendButton.click();

    await expect(page.getByText('Hello Kimi-K2.5')).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2b PASS: Request chat gửi thành công');

    // ─────────────────────────────────────────────────
    // STEP 3: Kiểm tra response từ hệ thống
    // ─────────────────────────────────────────────────
    // AI response nằm trong element class "prose" (bg-gray-50)
    const responseArea = page.locator('.prose').last();

    await expect(responseArea).not.toBeEmpty({ timeout: 30000 });

    const responseText = await responseArea.textContent();
    expect(responseText).not.toBeNull();
    expect(responseText!.length).toBeGreaterThan(10);

    console.log(`✅ Step 3 PASS: Hệ thống phản hồi thành công - "${responseText?.substring(0, 80)}..."`);

    // ─────────────────────────────────────────────────
    // STEP 4: Click View Code
    // ─────────────────────────────────────────────────
    const viewCodeBtn = page.getByRole('button', { name: /view code/i });
    await expect(viewCodeBtn).toBeVisible();
    await viewCodeBtn.click();

    const viewCodeModal = page.getByRole('dialog').filter({ hasText: 'View Code' });
    await expect(viewCodeModal).toBeVisible({ timeout: 5000 });

    await expect(viewCodeModal.getByText('Chat Completions')).toBeVisible();
    await expect(viewCodeModal.getByText('Responses')).toBeVisible();
    await expect(viewCodeModal.getByText(/kimi-k2\.5/i)).toBeVisible();
    await expect(viewCodeModal.getByText(/curl/i).first()).toBeVisible();

    console.log('✅ Step 4 PASS: View Code thành công');

    await viewCodeModal.getByRole('button', { name: 'Done' }).click();
  });

});
