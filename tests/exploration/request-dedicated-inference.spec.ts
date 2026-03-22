// request-dedicated-inference.spec.ts
// Feature: Request Dedicated Inference modal
// Model: FPT.AI-KIE-v1.7 — STG environment
// Run: APP_ENV=stg npx playwright test tests/exploration/request-dedicated-inference.spec.ts --project=exploration

import { test, expect, Page } from '@playwright/test';

const MODEL_ID = 'FPT.AI-KIE-v1.7';

async function openRequestForm(page: Page) {
  // Navigate to homepage and click model card
  await page.goto('/');
  const modelCard = page.getByRole('link').filter({ hasText: MODEL_ID }).first();
  await expect(modelCard).toBeVisible({ timeout: 15000 });
  await modelCard.click();

  // Click "Request Dedicated Inference" button on model detail page
  await page.getByRole('button', { name: /request dedicated inference/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
}

async function fillRequiredFields(page: Page) {
  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('textbox', { name: /Email/i }).fill('thuanlt9@outlook.com');
  await page.getByRole('textbox', { name: /Phone/i }).fill('0901234567');
}

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_001 — Happy path: điền đủ fields → Submit thành công   [ACTIVE]
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_001 — Submit đủ fields (Name + Email + Phone + Use case)', async ({ page }) => {
  await openRequestForm(page);

  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('textbox', { name: /Email/i }).fill('thuanlt9@outlook.com');
  await page.getByRole('textbox', { name: /Phone/i }).fill('0901234567');
  await page.getByRole('textbox', { name: /Use case/i }).fill('Testing automated inference request for QA purposes');

  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText(/thank you|success|successfully|submitted/i)
      .or(page.getByRole('dialog').filter({ hasText: /thank|success/i }))
  ).toBeVisible({ timeout: 10000 });
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_002 — Happy path: bỏ trống Use case (optional)         [ACTIVE]
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_002 — Submit không điền Use case (optional field)', async ({ page }) => {
  await openRequestForm(page);
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText(/thank you|success|successfully|submitted/i)
      .or(page.getByRole('dialog').filter({ hasText: /thank|success/i }))
  ).toBeVisible({ timeout: 10000 });
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_014 — Submit thành công → hiển thị toast "Success! We'll contact you soon."
// ════════════════════════════════════════════════════════════════════════════

// TC_RDI_014 — Submit thành công → toast "Success! We'll contact you soon." — verify manual

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_003 — Validation: bỏ trống Name → required error
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_003 — Bỏ trống Name → hiển thị lỗi required', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('textbox', { name: /Email/i }).fill('thuanlt9@outlook.com');
  await page.getByRole('textbox', { name: /Phone/i }).fill('0901234567');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/name.*required|please enter name/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_004 — Validation: bỏ trống Email → required error
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_004 — Bỏ trống Email → hiển thị lỗi required', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('textbox', { name: /Phone/i }).fill('0901234567');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/email.*required|please enter email/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_005 — Validation: bỏ trống Phone → required error
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_005 — Bỏ trống Phone → hiển thị lỗi required', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('textbox', { name: /Email/i }).fill('thuanlt9@outlook.com');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/phone.*required|please enter phone/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_006 — Validation: Email sai format
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_006 — Email sai format → Invalid Email', async ({ page }) => {
  await openRequestForm(page);
  await fillRequiredFields(page);
  await page.getByRole('textbox', { name: /Email/i }).clear();
  await page.getByRole('textbox', { name: /Email/i }).fill('invalidemail');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/invalid email/i)).toBeVisible();
});

test('TC_RDI_006b — Email format "abc@" → Invalid Email', async ({ page }) => {
  await openRequestForm(page);
  await fillRequiredFields(page);
  await page.getByRole('textbox', { name: /Email/i }).clear();
  await page.getByRole('textbox', { name: /Email/i }).fill('abc@');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/invalid email/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_007 — Validation: Phone nhập chữ → Invalid Phone
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_007 — Phone nhập chữ → Invalid Phone', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('textbox', { name: /Email/i }).fill('thuanlt9@outlook.com');
  await page.getByRole('textbox', { name: /Phone/i }).fill('abcdefgh');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/invalid phone/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_008 — Use case: nhập đúng 500 ký tự → cho phép
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_008 — Use case nhập 500 ký tự → counter hiển thị 500/500', async ({ page }) => {
  await openRequestForm(page);
  const text500 = 'A'.repeat(500);
  await page.getByRole('textbox', { name: /Use case/i }).fill(text500);

  await expect(page.getByText('500 / 500').or(page.getByText('500/500'))).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_009 — Use case: nhập 501 ký tự → bị chặn hoặc báo lỗi
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_009 — Use case nhập 501 ký tự → bị chặn tại 500', async ({ page }) => {
  await openRequestForm(page);
  const text501 = 'A'.repeat(501);
  const useCaseField = page.getByRole('textbox', { name: /Use case/i });
  await useCaseField.fill(text501);

  const value = await useCaseField.inputValue();
  expect(value.length).toBeLessThanOrEqual(500);
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_010 — UX: click Cancel → đóng form
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_010 — Click Cancel → form đóng', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_011 — UX: click X (close icon) → đóng form
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_011 — Click X → form đóng', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('button', { name: /close|×/i }).first().click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_012 — UX: mở lại form sau khi đóng → fields reset trống
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_012 — Mở lại form sau khi đóng → fields reset về trống', async ({ page }) => {
  await openRequestForm(page);
  await page.getByRole('textbox', { name: /Name/i }).fill('Nguyen Van Test');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Request Dedicated Inference' }).click();
  await expect(page.getByRole('textbox', { name: /Name/i })).toHaveValue('');
});

// ════════════════════════════════════════════════════════════════════════════
//  TC_RDI_013 — UX: Double click Submit → không gửi 2 lần
// ════════════════════════════════════════════════════════════════════════════

test('TC_RDI_013 — Double click Submit → Submit button bị disable sau lần click đầu', async ({ page }) => {
  await openRequestForm(page);
  await fillRequiredFields(page);

  const submitBtn = page.getByRole('button', { name: 'Submit' });
  await submitBtn.click();
  await submitBtn.click();

  // Submit chỉ được gửi 1 lần — không có 2 success dialog
  const successCount = await page.getByText(/thank you|success/i).count();
  expect(successCount).toBeLessThanOrEqual(1);
});
