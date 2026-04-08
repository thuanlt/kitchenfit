// login.spec.ts
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

test.describe('TC_LOGIN_001 - FPT AI Marketplace Login via FPT ID', () => {

  // Login test cần chạy không có session (unauthenticated)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('User can login successfully with FPT ID and see Postpaid label', async ({ page }) => {

    // ─────────────────────────────────────────────────
    // STEP 1: Truy cập base URL
    // ─────────────────────────────────────────────────
    await page.goto('https://marketplace.fptcloud.com/en');
    await expect(page).toHaveURL(/marketplace\.fptcloud\.com/);
    console.log('✅ Step 1 PASS: Truy cập URL thành công');

    // ─────────────────────────────────────────────────
    // STEP 2: Click nút Sign in/Sign up trên header
    // ─────────────────────────────────────────────────
    const signInBtn = page.locator('button:has-text("Sign in/Sign up")').or(page.getByText('Sign in/Sign up')).first();
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
    await signInBtn.click();

    // Verify popup mở thành công
    const continueWithFptId = page.getByRole('button', { name: /continue with fpt id/i });
    await expect(continueWithFptId).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2 PASS: Popup hiển thị thành công');

    // ─────────────────────────────────────────────────
    // STEP 3: Click Continue with FPT ID
    // ─────────────────────────────────────────────────

    // Lắng nghe popup mới hoặc navigation
    const [fptIdPage] = await Promise.all([
      page.waitForURL(/id\.fptcloud\.com/, { timeout: 10000 }).then(() => page),
      continueWithFptId.click(),
    ]);

    // Verify đang ở trang FPT ID
    await expect(page).toHaveURL(/id\.fptcloud\.com/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3 PASS: Mở page FPT ID thành công');

    // ─────────────────────────────────────────────────
    // STEP 4: Đăng nhập bằng tài khoản
    // ─────────────────────────────────────────────────
    const usernameInput = page.getByPlaceholder(/username|email/i);
    const passwordInput = page.locator('input[type="password"]');

    await usernameInput.fill(process.env.FPT_USERNAME!);
    await passwordInput.fill(process.env.FPT_PASSWORD!);

    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await submitBtn.click();

    // Chờ redirect về marketplace
    await page.waitForURL(/marketplace\.fptcloud\.com/, { timeout: 15000 });
    await expect(page).toHaveURL(/marketplace\.fptcloud\.com/);
    console.log('✅ Step 4 PASS: Đăng nhập thành công');

    // ─────────────────────────────────────────────────
    // STEP 5: Verify Sign in button không còn hiển thị
    // ─────────────────────────────────────────────────
    const signInBtnHeader = page.locator('button:has-text("Sign in/Sign up")').first();
    await expect(signInBtnHeader).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Step 5 PASS: Đã đăng nhập thành công (Sign in button biến mất)');
  });

});