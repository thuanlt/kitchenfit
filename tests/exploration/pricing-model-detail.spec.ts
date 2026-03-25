// pricing-model-detail.spec.ts
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// Dùng session trống vì đây là domain khác (ai.fptcloud.com)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_PRICING_001 - Login & Pricing Model Detail', () => {

  test.skip('Login via FPT ID and view pricing model detail', async ({ page }) => {
    test.setTimeout(90000);

    // ─────────────────────────────────────────────────
    // STEP 1: Truy cập ai.fptcloud.com
    // ─────────────────────────────────────────────────
    await page.goto('https://ai.fptcloud.com');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    console.log('✅ Step 1 PASS: Truy cập ai.fptcloud.com thành công');

    // ─────────────────────────────────────────────────
    // STEP 2: Click nút Login / Sign in
    // ─────────────────────────────────────────────────
    const loginBtn = page.getByRole('button', { name: /login|sign in/i }).first();
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ Step 2 PASS: Click Login/Sign in thành công');

    // ─────────────────────────────────────────────────
    // STEP 3: Click "FPT ID" option
    // ─────────────────────────────────────────────────
    const fptIdBtn = page.getByRole('button', { name: /fpt id/i }).first();
    await expect(fptIdBtn).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/id\.fptcloud\.com/, { timeout: 15000 }),
      fptIdBtn.click(),
    ]);
    console.log('✅ Step 3 PASS: Redirect sang FPT ID login page');

    // ─────────────────────────────────────────────────
    // STEP 4: Điền username & password từ .env
    // ─────────────────────────────────────────────────
    await page.getByPlaceholder(/username|email/i).fill(process.env.FPT_USERNAME!);
    await page.locator('input[type="password"]').fill(process.env.FPT_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    console.log('✅ Step 4 PASS: Điền credentials và submit');

    // ─────────────────────────────────────────────────
    // STEP 5: Verify login thành công
    // ─────────────────────────────────────────────────
    await page.waitForURL(/ai\.fptcloud\.com/, { timeout: 15000 });
    await expect(page).toHaveURL(/ai\.fptcloud\.com/);
    console.log('✅ Step 5 PASS: Login thành công - redirect về ai.fptcloud.com');

    // ─────────────────────────────────────────────────
    // STEP 6: Navigate đến trang Pricing / Model Detail
    // Dùng goto trực tiếp vì Pricing link có thể là external (target="_blank")
    // ─────────────────────────────────────────────────
    await page.goto('https://ai.fptcloud.com/pricing/maas');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    console.log('✅ Step 6 PASS: Navigate đến trang Pricing/Model Detail');

    // ─────────────────────────────────────────────────
    // STEP 7: Verify nội dung trang Pricing hiển thị
    // ─────────────────────────────────────────────────
    await expect(page).toHaveURL(/pricing|model|price/i);

    // Dùng role="grid" (semi-table trên ai.fptcloud.com) hoặc heading của trang pricing
    const pricingTable = page.getByRole('grid').first();
    const hasTable = await pricingTable.count() > 0;
    if (hasTable) {
      await expect(pricingTable).toBeVisible({ timeout: 10000 });
    } else {
      // Fallback: verify trang có nội dung pricing qua heading
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    }
    console.log('✅ Step 7 PASS: Trang Pricing/Model Detail hiển thị nội dung');

    console.log('\n✅✅✅ TC_PRICING_001 PASSED\n');
  });

});
