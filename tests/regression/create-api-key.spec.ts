// create-api-key.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TC_APIKEY_001 - Create API Key from Homepage', () => {

  test('User can create an API Key and verify it in the list', async ({ page }) => {
    test.setTimeout(60000);

    // Generate tên API key ngẫu nhiên với timestamp
    const apiKeyName = `qa-auto-key-${Date.now()}`;

    // ─────────────────────────────────────────────────
    // STEP 1: Navigate trực tiếp đến My API Keys
    // ─────────────────────────────────────────────────
    await page.goto('https://marketplace.fptcloud.com/en/my-account?tab=my-api-key');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify màn hình My API Keys mở thành công
    await expect(page).toHaveURL(/my-account.*tab=my-api-key/);
    await expect(page.getByRole('heading', { name: /my api keys/i })).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 1 PASS: Mở màn hình My API Keys thành công');

    // ─────────────────────────────────────────────────
    // STEP 2: Click "Create new API Key"
    // ─────────────────────────────────────────────────
    const createNewBtn = page.getByRole('button', { name: /create new api key/i });
    await expect(createNewBtn).toBeVisible();
    await createNewBtn.click();

    // Verify popup "Create an API Key" mở thành công
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Create an API Key')).toBeVisible();
    console.log('✅ Step 2 PASS: Popup Create an API Key hiển thị thành công');

    // ─────────────────────────────────────────────────
    // STEP 3: Nhập Name ngẫu nhiên
    // ─────────────────────────────────────────────────
    const nameInput = modal.getByPlaceholder(/your name/i);
    await expect(nameInput).toBeVisible();
    await nameInput.click();
    await nameInput.fill(apiKeyName);
    await expect(nameInput).toHaveValue(apiKeyName);
    console.log(`✅ Step 3 PASS: Đã nhập tên ngẫu nhiên: "${apiKeyName}"`);

    // ─────────────────────────────────────────────────
    // STEP 4: Click "Create"
    // ─────────────────────────────────────────────────
    const createBtn = modal.getByRole('button', { name: /^create$/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify popup "Save your API Key" xuất hiện (tạo thành công)
    const saveModal = page.locator('[role="dialog"]:has-text("Save your API Key")');
    await expect(saveModal).toBeVisible({ timeout: 20000 });

    // Verify API key được hiển thị (dạng sk-***)
    // Chờ input trong dialog có value (key load async)
    await page.waitForFunction(
      () => {
        const inputs = document.querySelectorAll('[role="dialog"] input');
        for (const input of inputs) {
          if ((input as HTMLInputElement).value?.startsWith('sk-')) return true;
        }
        // Fallback: check textContent
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.textContent?.includes('sk-') ?? false;
      },
      { timeout: 20000 }
    );
    const apiKeyValue = await saveModal.evaluate(el => {
      const input = el.querySelector('input') as HTMLInputElement | null;
      if (input?.value?.startsWith('sk-')) return input.value;
      const match = (el.textContent ?? '').match(/sk-[A-Za-z0-9_\-+=/.]+/);
      return match?.[0] ?? '';
    });
    expect(apiKeyValue).toMatch(/^sk-/);
    console.log(`✅ Step 4 PASS: Tạo API key thành công. Key: ${apiKeyValue?.substring(0, 10)}...`);

    // ─────────────────────────────────────────────────
    // STEP 5: Click "Done" để đóng popup
    // ─────────────────────────────────────────────────
    const doneBtn = saveModal.getByRole('button', { name: /done/i });
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();

    // Verify popup đã đóng
    await expect(saveModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Step 5 PASS: Đóng popup thành công');

    // ─────────────────────────────────────────────────
    // STEP 6: Verify tên API key xuất hiện trong danh sách
    // ─────────────────────────────────────────────────
    await page.waitForLoadState('load');

    // Tìm tên API key vừa tạo trong bảng danh sách
    const apiKeyRow = page.locator('table tbody tr')
      .filter({ hasText: apiKeyName });

    await expect(apiKeyRow).toBeVisible({ timeout: 10000 });

    // Verify status = Active
    await expect(apiKeyRow.getByText(/active/i)).toBeVisible();

    // Lấy tên trong bảng để verify chính xác
    const nameCell = apiKeyRow.locator('td').nth(1);
    const displayedName = await nameCell.textContent();
    expect(displayedName?.trim()).toBe(apiKeyName);

    console.log(`✅ Step 6 PASS: API key "${displayedName?.trim()}" xuất hiện trong danh sách với status Active`);
  });

});
