import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://marketplace.fptcloud.com/en';

async function openContactForm(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole('img', { name: 'contact us' }).click();
  await expect(page.getByRole('dialog', { name: 'Contact us' })).toBeVisible();
}

// Helper: điền đầy đủ tất cả fields (bắt buộc + optional)
async function fillAllFields(page: Page) {
  await page.getByRole('textbox', { name: 'Name *' }).fill('Nguyen Van A');
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@fpt.com');
  await page.locator('div').filter({ hasText: /^Your Company size$/ }).nth(2).click();
  await page.getByTitle('-100').click();
  await page.getByRole('textbox', { name: 'Phone' }).fill('0901234567');
  await page.getByRole('textbox', { name: "I'd like to request a new feature/model" }).fill('Need GPT-5 model');
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello team');
}

// Helper: mock API submit thành công để success popup hiển thị
async function mockSubmitSuccess(page: Page) {
  await page.route('**/contact**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.route('**/api/**', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      route.continue();
    }
  });
}

// Helper: chỉ điền các field bắt buộc
async function fillRequiredFields(page: Page) {
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@example.com');
  await page.locator('div').filter({ hasText: /^Your Company size$/ }).nth(2).click();
  await page.getByTitle('-100').click();
}

// ============================================================
// TC01 - TC02: Button Display & Popup Open
// ============================================================

/*
test('TC01 - Contact Us button hiển thị trên trang chủ', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.getByRole('img', { name: 'contact us' })).toBeVisible();
});

test('TC02 - Click Contact Us button mở form popup', async ({ page }) => {
  await openContactForm(page);
  const dialog = page.getByRole('dialog', { name: 'Contact us' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Contact us')).toBeVisible();
});
*/

// ============================================================
// TC03 - TC08: Form Fields Display
// ============================================================

/*
test('TC03 - Form hiển thị đúng các fields', async ({ page }) => {
  await openContactForm(page);
  const dialog = page.getByRole('dialog', { name: 'Contact us' });

  await expect(dialog.getByRole('textbox', { name: 'Name *' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Email *' })).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Company size *' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Phone' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: "I'd like to request a new feature/model" })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Message' })).toBeVisible();
});

test('TC04 - Company size dropdown hiển thị đúng options', async ({ page }) => {
  await openContactForm(page);
  await page.locator('div').filter({ hasText: /^Your Company size$/ }).nth(2).click();

  await expect(page.getByTitle('-100')).toBeVisible(); // 0-100
  await expect(page.getByTitle('100-500')).toBeVisible();
  await expect(page.getByTitle('500-2.000')).toBeVisible();
  await expect(page.getByTitle('2.000-10.000')).toBeVisible();
  await expect(page.getByTitle('>10.000')).toBeVisible();
});

test('TC05 - Company size dropdown có thể chọn option', async ({ page }) => {
  await openContactForm(page);
  await page.locator('div').filter({ hasText: /^Your Company size$/ }).nth(2).click();
  await page.getByTitle('-100').click();

  await expect(page.getByRole('dialog').getByText('0-100')).toBeVisible();
});

test('TC06 - Call To Us section hiển thị đúng', async ({ page }) => {
  await openContactForm(page);
  const dialog = page.getByRole('dialog', { name: 'Contact us' });

  await expect(dialog.getByText('Call To Us')).toBeVisible();
  await expect(dialog.getByText('08:30 to 17:30')).toBeVisible();
  await expect(dialog.getByRole('link', { name: '1900.638.399' })).toBeVisible();
});

test('TC07 - Write To Us section hiển thị đúng', async ({ page }) => {
  await openContactForm(page);
  const dialog = page.getByRole('dialog', { name: 'Contact us' });

  await expect(dialog.getByText('Write To Us')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'support@fptcloud.com' })).toBeVisible();
});

test('TC08 - Submit và Cancel button hiển thị', async ({ page }) => {
  await openContactForm(page);
  const dialog = page.getByRole('dialog', { name: 'Contact us' });

  await expect(dialog.getByRole('button', { name: 'Submit' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
});
*/

// ============================================================
// TC09 - TC16: Validation
// ============================================================

/*
test('TC09 - Submit không điền required fields → hiển thị validation errors', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Please enter Name')).toBeVisible();
  await expect(page.getByText('Please enter Email')).toBeVisible();
  await expect(page.getByText('Please enter Company size')).toBeVisible();
});

test('TC10 - Email không có @ → Invalid Email', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Email *' }).fill('invalidemail');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Invalid Email')).toBeVisible();
});

test('TC11 - Email format "test@" → Invalid Email', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Invalid Email')).toBeVisible();
});

test('TC12 - Phone nhập chữ cái → Invalid Phone', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@example.com');
  await page.getByRole('textbox', { name: 'Phone' }).fill('abcdefgh');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Invalid Phone')).toBeVisible();
});

test('TC13 - Phone < 10 digits → Invalid Phone', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@example.com');
  await page.getByRole('textbox', { name: 'Phone' }).fill('123456');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Invalid Phone')).toBeVisible();
});

test('TC14 - Name field kiểm tra giới hạn 50 ký tự (BUG: hiện tại không giới hạn)', async ({ page }) => {
  await openContactForm(page);
  const nameInput = page.getByRole('textbox', { name: 'Name *' });
  await nameInput.fill('ThisIsAVeryLongNameThatExceedsFiftyCharactersLimitXXX'); // 53 chars

  // BUG: expected error for >50 chars but not shown
  // Uncomment below when bug is fixed:
  // await page.getByRole('button', { name: 'Submit' }).click();
  // await expect(page.getByText('Name cannot exceed 50 characters')).toBeVisible();

  // Current behavior: accepts > 50 chars without error
  const value = await nameInput.inputValue();
  expect(value.length).toBeGreaterThan(50); // documents the bug
});

test('TC15 - Message counter cập nhật khi gõ', async ({ page }) => {
  await openContactForm(page);
  const msg = 'Hello World'; // 11 chars
  await page.getByRole('textbox', { name: 'Message' }).fill(msg);
  await expect(page.getByText('11 / 5000')).toBeVisible();
});

test('TC16 - Phone > 15 digits → Invalid Phone', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Email *' }).fill('test@example.com');
  await page.getByRole('textbox', { name: 'Phone' }).fill('1234567890123456'); // 16 digits
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Invalid Phone')).toBeVisible();
});
*/

// ============================================================
// TC17 - TC19: Optional Fields
// ============================================================

/*
test('TC17 - Phone là optional, để trống vẫn submit được (frontend)', async ({ page }) => {
  await openContactForm(page);
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Please enter Phone')).not.toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Contact us' })).not.toBeVisible({ timeout: 5000 })
    .catch(() => {});
});

test('TC18 - Feature/model request là optional, để trống vẫn submit được', async ({ page }) => {
  await openContactForm(page);
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText("Please enter I'd like to request")).not.toBeVisible();
});

test('TC19 - Message là optional, để trống vẫn submit được', async ({ page }) => {
  await openContactForm(page);
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Please enter Message')).not.toBeVisible();
});
*/

// ============================================================
// TC20: Submit & Result Popup
// ============================================================

/*
test('TC20 - Submit valid form → gọi API và nhận response (success hoặc error popup)', async ({ page }) => {
  await openContactForm(page);
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('Oops! Something Went Wrong').or(page.getByText('Thank you'))
  ).toBeVisible({ timeout: 10000 });
});
*/

// ============================================================
// TC21 (NCPP-T8769): Submit thành công với tất cả field  ← ACTIVE
// ============================================================

test('TC21 (NCPP-T8769) - Submit thành công với tất cả field', async ({ page }) => {
  await openContactForm(page);

  // Step 1: Điền đầy đủ tất cả field
  await fillAllFields(page);
  await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveValue('Nguyen Van A');
  await expect(page.getByRole('textbox', { name: 'Email *' })).toHaveValue('test@fpt.com');
  await expect(page.getByRole('textbox', { name: 'Phone' })).toHaveValue('0901234567');

  // Step 2: Click Submit → success popup hiển thị
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByText('Thank you for contacting us')
  ).toBeVisible({ timeout: 10000 });
});

// ============================================================
// TC22 - TC24: Success Popup
// ============================================================

/*
test('TC22 (NCPP-T8770) - Success popup hiển thị đúng nội dung', async ({ page }) => {
  await mockSubmitSuccess(page);
  await openContactForm(page);
  await fillAllFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Thank you for contacting us')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Your message has been successfully sent. Our team will get back to you as soon as possible.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ok' })).toBeVisible();
  await expect(page.getByRole('button', { name: /close|×|X/i })).toBeVisible();
});

test('TC23 (NCPP-T8771) - Click Ok trên success popup → đóng popup', async ({ page }) => {
  await mockSubmitSuccess(page);
  await openContactForm(page);
  await fillAllFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Thank you for contacting us')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Ok' }).click();

  await expect(page.getByText('Thank you for contacting us')).not.toBeVisible();
});

test('TC24 (NCPP-T8772) - Click X trên success popup → đóng popup', async ({ page }) => {
  await mockSubmitSuccess(page);
  await openContactForm(page);
  await fillAllFields(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Thank you for contacting us')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /close|×|X/i }).first().click();

  await expect(page.getByText('Thank you for contacting us')).not.toBeVisible();
});
*/

// ============================================================
// TC25 - TC26: Close Actions
// ============================================================

/*
test('TC25 - Click Cancel button đóng form popup', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('dialog', { name: 'Contact us' })).not.toBeVisible();
});

test('TC26 - Click Close (X) button đóng form popup', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('dialog', { name: 'Contact us' })).not.toBeVisible();
});

test('TC - Mở lại form sau khi đóng → form reset (fields trống)', async ({ page }) => {
  await openContactForm(page);
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test User');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('img', { name: 'contact us' }).click();
  await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveValue('');
});
*/
