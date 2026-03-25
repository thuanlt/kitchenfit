# Playwright Automation Rules — FPT AI Marketplace

## Locator Priority (thứ tự ưu tiên bắt buộc)
1. `getByRole('button', { name: /text/i })` — stable nhất
2. `getByLabel()` / `getByPlaceholder()`
3. `getByText()` — chỉ dùng cho static text
4. `locator('[data-testid="..."]')` — nếu có
5. `locator('css')` — last resort, KHÔNG dùng class UI framework

**TRÁNH tuyệt đối:**
- XPath tuyệt đối
- Dynamic ID (id thay đổi mỗi lần render)
- Class selector: `.ant-btn`, `.btn-primary`, `.css-xyz`

---

## Wait Strategy
- **KHÔNG** `await page.waitForTimeout(ms)` — chỉ dùng khi chờ animation (< 500ms)
- Luôn dùng:
  ```typescript
  await expect(locator).toBeVisible({ timeout: 10000 });
  await page.waitForURL(/pattern/, { timeout: 10000 });
  await expect(locator).toBeEnabled();
  ```

---

## Page Object Model (POM)
```
pages/
├── MarketplacePage.ts     ← homepage, navigation
├── ApiKeyPage.ts          ← My API Keys
├── PlaygroundPage.ts      ← Playground
└── LoginPage.ts           ← login flow
```

Structure mỗi Page class:
```typescript
export class ApiKeyPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/en/my-account?tab=my-api-key');
  }

  async clickCreateNew() {
    await this.page.getByRole('button', { name: /create new api key/i }).click();
  }
}
```

---

## Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('TC_XXX_NNN — mô tả behavior', async ({ page }) => {
    test.setTimeout(60000);

    // STEP 1: Setup
    // STEP 2: Action
    // STEP 3: Assert
    console.log('✅ Step N PASS: ...');
  });
});
```

---

## Auth & Session
- KHÔNG login lại trong test — dùng `storageState` từ `playwright/.auth/<env>-user.json`
- Auth setup chạy 1 lần qua `fixtures/auth.setup.ts`
- API tests KHÔNG cần auth (dùng `FPT_API_KEY` trực tiếp)

---

## Environment Config
```typescript
import { config } from '../../utils/config';

// Dùng:
config.baseUrl      // https://marketplace.fptcloud.com/en
config.fptApiUrl    // https://mkp-api.fptcloud.com
config.fptApiKey    // Bearer token
config.fptFrom      // from param
```

---

## Proven Locators — FPT Marketplace STG/PROD
```typescript
// Model card
page.getByRole('link').filter({ hasText: MODEL_API_ID }).first()

// Search input
page.locator('input[placeholder*="search" i], input[type="search"]').first()

// Ant Design select
page.locator('.ant-select-selector').first()  // → fill search → click option

// Chat input (Playground)
page.getByPlaceholder(/type a message/i)

// Send button
page.locator('button:has(img[alt="send"]), button[aria-label*="send" i], button:has(.anticon-send)').last()

// AI response area
page.locator('.prose').last()

// View Code modal
page.getByRole('dialog').filter({ hasText: 'View Code' })
```

## React Controlled Input Trick (required for send button to enable)
```typescript
await page.evaluate((text) => {
  const el = document.querySelector('textarea[placeholder*="message" i]') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, message);
```

## Existing Test File Structure (follow this pattern)
```typescript
import { test, expect } from '@playwright/test';
import { config } from '../../utils/config';

const MODEL_NAME   = 'Nemotron';
const MODEL_API_ID = 'Nemotron-3-Super-120B-A12B';

test.use({ storageState: 'playwright/.auth/stg-user.json' });

test.describe('Nemotron — Regression STG', () => {
  test('TC_NEMOTRON_001 — Model card visible', async ({ page }) => { ... });
});
```

---

## Ant Design Components (FPT Marketplace dùng Ant Design)
- **Dialog/Modal:** `page.getByRole('dialog')` hoặc `page.locator('[role="dialog"]')`
- **Button:** `page.getByRole('button', { name: /text/i })`
- **Input:** `page.getByPlaceholder('Your Name')`
- **Checkbox:** `page.getByRole('checkbox')` — Ant Design render `role="checkbox"` không phải `input[type=checkbox]`
- **Table row:** `page.locator('table tbody tr').filter({ hasText: 'keyword' })`
- **Select dropdown:** `page.getByRole('combobox')` → click → `page.getByRole('option', { name: /text/i })`
