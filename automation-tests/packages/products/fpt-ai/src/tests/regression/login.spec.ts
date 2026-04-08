// ai-fptcloud-login.spec.ts
import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// CONFIG — credentials từ .env
// ============================================================
const CONFIG = {
  baseUrl: 'https://ai.fptcloud.com',
  validEmail: process.env.FPT_USERNAME!,
  validPassword: process.env.FPT_PASSWORD!,
  wrongPassword: 'WrongPassword!999',
  wrongEmail: 'notexist_user@fake-domain.xyz',
  timeout: 15000,
};

// ============================================================
// SELECTORS
// ============================================================
const SEL = {
  // ai.fptcloud.com
  signInSignUpBtn: 'button:has-text("Sign in/Sign up")',

  // Modal "Sign in to AI Factory"
  modal: '.semi-modal.semi-modal-centered',
  modalTitle: '.semi-modal h2',
  continueWithFptId: 'button.semi-button-outline:has-text("Continue with FPT ID")',
  continueWithGoogle: 'button:has-text("Continue with Google")',
  continueWithMicrosoft: 'button:has-text("Continue with Microsoft")',

  // id.fptcloud.com (FPT ID login page)
  usernameInput: '#username',
  passwordInput: '#password',
  signInBtn: '#kc-signup-button',
  eyeToggleBtn: '#eye-pass',

  // Error message on FPT ID page
  errorMessage: 'div.alert-section.error-type',

  // ai.fptcloud.com — post-login
  signInBtnGone: 'button:has-text("Sign in/Sign up")',
};

// ============================================================
// Dùng session trống — ai.fptcloud.com là domain khác
// ============================================================
test.use({ storageState: { cookies: [], origins: [] } });

// ============================================================
// HELPERS
// ============================================================
async function goToFptIdLoginPage(page: Page): Promise<void> {
  await page.goto(CONFIG.baseUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  await page.locator(SEL.signInSignUpBtn).click();
  await expect(page.locator(SEL.modal)).toBeVisible({ timeout: 5000 });
  await page.locator(SEL.continueWithFptId).click();
  await page.waitForURL(/id\.fptcloud\.com/, { timeout: CONFIG.timeout });
  await page.waitForLoadState('domcontentloaded');
}

async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.locator(SEL.usernameInput).fill(email);
  await page.locator(SEL.passwordInput).fill(password);
}

async function clickSignIn(page: Page): Promise<void> {
  await page.locator(SEL.signInBtn).click();
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('FPT AI Factory — Sign In via FPT ID', () => {

  // ----------------------------------------------------------
  // TC-SI-001 ✅ HAPPY PATH: Sign in thành công
  // ----------------------------------------------------------
  test('TC-SI-001 | Sign in thành công với credentials hợp lệ', async ({ page }) => {
    test.setTimeout(60000);

    // STEP 1: Truy cập homepage, click Sign in/Sign up
    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await expect(page.locator(SEL.signInSignUpBtn)).toBeVisible({ timeout: 10000 });
    await page.locator(SEL.signInSignUpBtn).click();

    // Verify modal hiển thị đúng
    await expect(page.locator(SEL.modal)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.modalTitle)).toHaveText('Sign in to AI Factory');

    // STEP 2: Click "Continue with FPT ID"
    await expect(page.locator(SEL.continueWithFptId)).toBeVisible();
    await page.locator(SEL.continueWithFptId).click();

    // Verify redirect sang FPT ID
    await page.waitForURL(/id\.fptcloud\.com/, { timeout: CONFIG.timeout });
    await expect(page.locator('h1, h2').filter({ hasText: /sign in/i })).toBeVisible();

    // STEP 3-4: Nhập credentials
    await page.locator(SEL.usernameInput).fill(CONFIG.validEmail);
    await page.locator(SEL.passwordInput).fill(CONFIG.validPassword);

    // STEP 5: Click Sign in
    await clickSignIn(page);

    // ✅ EXPECTED: Redirect về ai.fptcloud.com
    await page.waitForURL(/ai\.fptcloud\.com/, { timeout: CONFIG.timeout });
    await expect(page).toHaveURL(/ai\.fptcloud\.com/);

    // ✅ EXPECTED: Nút "Sign in/Sign up" biến mất
    await expect(page.locator(SEL.signInBtnGone)).not.toBeVisible({ timeout: 5000 });

    console.log('✅ TC-SI-001 PASSED — Sign in thành công, URL:', page.url());
  });

  // ----------------------------------------------------------
  // TC-SI-002 ❌ NEGATIVE: Sign in thất bại — SAI PASSWORD
  // ----------------------------------------------------------
  test('TC-SI-002 | Sign in thất bại khi nhập sai Password', async ({ page }) => {
    test.setTimeout(60000);

    // STEP 1: Truy cập, click Sign in/Sign up
    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.locator(SEL.signInSignUpBtn).click();
    await expect(page.locator(SEL.modal)).toBeVisible({ timeout: 5000 });

    // STEP 2: Click "Continue with FPT ID"
    await page.locator(SEL.continueWithFptId).click();
    await page.waitForURL(/id\.fptcloud\.com/, { timeout: CONFIG.timeout });
    await page.waitForLoadState('domcontentloaded');

    // STEP 3: Nhập email đúng
    await page.locator(SEL.usernameInput).fill(CONFIG.validEmail);

    // STEP 4: Nhập password SAI
    await page.locator(SEL.passwordInput).fill(CONFIG.wrongPassword);

    // STEP 5: Click Sign in
    await clickSignIn(page);
    await page.waitForLoadState('domcontentloaded');

    // ✅ EXPECTED 1: Vẫn ở trang FPT ID
    await expect(page).toHaveURL(/id\.fptcloud\.com/);
    await expect(page).not.toHaveURL(/ai\.fptcloud\.com/);

    // ✅ EXPECTED 2: Hiển thị thông báo lỗi
    const errorMsg = page.locator(SEL.errorMessage);
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText('Invalid username or password');

    // ✅ EXPECTED 3: Form vẫn hiển thị
    await expect(page.locator(SEL.usernameInput)).toBeVisible();
    await expect(page.locator(SEL.passwordInput)).toBeVisible();
    await expect(page.locator(SEL.signInBtn)).toBeVisible();

    // ✅ EXPECTED 4: Email được giữ lại
    await expect(page.locator(SEL.usernameInput)).toHaveValue(CONFIG.validEmail);

    console.log('✅ TC-SI-002 PASSED — Sign in thất bại, lỗi hiển thị đúng');
  });

  // ----------------------------------------------------------
  // TC-SI-003 ❌ NEGATIVE: Sign in thất bại — SAI EMAIL
  // ----------------------------------------------------------
  test('TC-SI-003 | Sign in thất bại khi nhập Email không tồn tại', async ({ page }) => {
    test.setTimeout(60000);

    await goToFptIdLoginPage(page);
    await fillLoginForm(page, CONFIG.wrongEmail, CONFIG.validPassword);
    await clickSignIn(page);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/id\.fptcloud\.com/);
    await expect(page.locator(SEL.errorMessage)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.errorMessage)).toContainText('Invalid username or password');

    console.log('✅ TC-SI-003 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-004 ❌ NEGATIVE: Sign in thất bại — BỎ TRỐNG USERNAME
  // ----------------------------------------------------------
  test('TC-SI-004 | Sign in thất bại khi bỏ trống Username/Email', async ({ page }) => {
    test.setTimeout(60000);

    await goToFptIdLoginPage(page);
    await page.locator(SEL.passwordInput).fill(CONFIG.validPassword);
    await clickSignIn(page);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/id\.fptcloud\.com/);
    await expect(page).not.toHaveURL(/ai\.fptcloud\.com/);

    console.log('✅ TC-SI-004 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-005 ❌ NEGATIVE: Sign in thất bại — BỎ TRỐNG PASSWORD
  // ----------------------------------------------------------
  test('TC-SI-005 | Sign in thất bại khi bỏ trống Password', async ({ page }) => {
    test.setTimeout(60000);

    await goToFptIdLoginPage(page);
    await page.locator(SEL.usernameInput).fill(CONFIG.validEmail);
    await clickSignIn(page);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/id\.fptcloud\.com/);
    await expect(page).not.toHaveURL(/ai\.fptcloud\.com/);

    console.log('✅ TC-SI-005 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-006: Forgot Password điều hướng đúng
  // ----------------------------------------------------------
  test('TC-SI-006 | Click "Forgot password" điều hướng đúng trang reset', async ({ page }) => {
    test.setTimeout(60000);

    await goToFptIdLoginPage(page);
    const forgotLink = page.locator('a:has-text("Forgot password")');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    await page.waitForURL(/login-actions/, { timeout: CONFIG.timeout });
    await expect(page).toHaveURL(/id\.fptcloud\.com/);

    console.log('✅ TC-SI-006 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-007: Modal hiển thị đúng 3 options
  // ----------------------------------------------------------
  test('TC-SI-007 | Modal "Sign in to AI Factory" hiển thị đủ 3 tùy chọn đăng nhập', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.locator(SEL.signInSignUpBtn).click();

    await expect(page.locator(SEL.modal)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SEL.modalTitle)).toHaveText('Sign in to AI Factory');

    await expect(page.locator(SEL.continueWithFptId)).toBeVisible();
    await expect(page.locator(SEL.continueWithGoogle)).toBeVisible();
    await expect(page.locator(SEL.continueWithMicrosoft)).toBeVisible();

    console.log('✅ TC-SI-007 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-008: Redirect URL đúng sang FPT ID với OAuth params
  // ----------------------------------------------------------
  test('TC-SI-008 | Redirect đúng sang FPT ID với đủ OAuth params', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.locator(SEL.signInSignUpBtn).click();
    await expect(page.locator(SEL.modal)).toBeVisible({ timeout: 5000 });
    await page.locator(SEL.continueWithFptId).click();

    await page.waitForURL(/id\.fptcloud\.com/, { timeout: CONFIG.timeout });
    const url = page.url();

    expect(url).toContain('id.fptcloud.com');
    expect(url).toContain('openid-connect/auth');
    expect(url).toContain('client_id=ai-studio');
    expect(url).toContain('redirect_uri');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=openid');

    await expect(page.locator(SEL.usernameInput)).toBeVisible();
    await expect(page.locator(SEL.passwordInput)).toBeVisible();
    await expect(page.locator(SEL.signInBtn)).toBeVisible();
    await expect(page.locator('a:has-text("Sign up")')).toBeVisible();
    await expect(page.locator('a:has-text("Forgot password")')).toBeVisible();

    console.log('✅ TC-SI-008 PASSED — FPT ID URL:', url.substring(0, 80));
  });

  // ----------------------------------------------------------
  // TC-SI-009: Show/Hide Password toggle
  // ----------------------------------------------------------
  test('TC-SI-009 | Show/Hide password toggle hoạt động đúng', async ({ page }) => {
    test.setTimeout(30000);

    await goToFptIdLoginPage(page);

    const passwordInput = page.locator(SEL.passwordInput);
    const eyeToggle = page.locator(SEL.eyeToggleBtn);

    await passwordInput.fill('TestPassword123!');

    // Mặc định: password ẩn
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click eye icon → hiện password
    await eyeToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click lại → ẩn password
    await eyeToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    console.log('✅ TC-SI-009 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SU-001: Navigate tới trang Sign up
  // ----------------------------------------------------------
  test('TC-SU-001 | Link "Sign up" điều hướng tới trang đăng ký', async ({ page }) => {
    test.setTimeout(30000);

    await goToFptIdLoginPage(page);

    const signUpLink = page.locator('a:has-text("Sign up")');
    await expect(signUpLink).toBeVisible();

    await signUpLink.click();
    await page.waitForURL(/login-actions.*registration|registr/, { timeout: CONFIG.timeout });
    await expect(page).toHaveURL(/id\.fptcloud\.com/);

    console.log('✅ TC-SU-001 PASSED');
  });

  // ----------------------------------------------------------
  // TC-SI-010: Session persistence sau khi reload
  // ----------------------------------------------------------
  test('TC-SI-010 | Session được duy trì sau khi reload trang', async ({ page }) => {
    test.setTimeout(60000);

    await goToFptIdLoginPage(page);
    await fillLoginForm(page, CONFIG.validEmail, CONFIG.validPassword);
    await clickSignIn(page);

    // Chờ callback hoàn tất và session cookie được set
    await page.waitForURL(/ai\.fptcloud\.com/, { timeout: CONFIG.timeout });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Reload trang
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Vẫn đăng nhập — không bị redirect về login
    await expect(page).toHaveURL(/ai\.fptcloud\.com/);
    await expect(page.locator(SEL.signInBtnGone)).not.toBeVisible({ timeout: 10000 });

    console.log('✅ TC-SI-010 PASSED');
  });

});
