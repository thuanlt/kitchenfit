# QA Automation Checklist — Senior QA Standard
# Áp dụng cho mọi lần viết / gen Playwright test script

Khi gen hoặc viết Playwright test script, PHẢI tự review theo checklist này trước khi output code.
Nếu vi phạm điều nào, phải fix trước hoặc ghi chú lý do bỏ qua.

---

## 1. Test phù hợp automation
- Chạy nhiều lần được (regression / smoke)
- Business critical
- Flow ổn định (UI ít thay đổi)
- Không cần manual judgement
- Có thể verify bằng assertion

## 2. Test independent
- Chạy độc lập (không phụ thuộc test khác)
- Tự setup data — không dựa vào kết quả test trước
- Tự cleanup data sau khi chạy

## 3. Locator ổn định
Thứ tự ưu tiên:
1. `getByRole()` — stable nhất
2. `getByLabel()` / `getByPlaceholder()`
3. `getByText()` — chỉ dùng cho static text
4. `locator('css')` — last resort

**TRÁNH:** absolute XPath, dynamic id, class selector của UI framework (`.ant-btn`, `.btn-primary`)
**Lưu ý FPT Marketplace:** App KHÔNG có `data-testid` → bắt buộc dùng role/label/text/placeholder

## 4. Không hard wait
- **KHÔNG** dùng `waitForTimeout()` trừ animation/render ngắn (< 500ms)
- Dùng explicit wait: `toBeVisible()`, `toBeEnabled()`, `waitForURL()`, `waitForSelector()`
- Wait condition phải rõ ràng, có timeout hợp lý

## 5. Reusable code
- Login flow dùng `storageState` từ `auth.setup.ts` — KHÔNG login lại trong mỗi test
- Helper functions / Page Object dùng chung
- DRY — không copy-paste logic

## 6. Test data tách riêng
- Không hardcode data vào test logic
- Dùng `config.baseUrl`, `config.fptApiUrl`, `config.fptApiKey` từ `utils/config.ts`
- Timestamp-based naming: `qa-auto-key-${Date.now()}`
- Có negative test case: empty field, invalid input, boundary value

## 7. Assertion rõ ràng
- Verify UI result: `toBeVisible()`, `toHaveText()`, `toHaveURL()`
- Verify API response: status code + response body fields
- Log từng bước quan trọng: `console.log('✅ Step N PASS: ...')`

## 8. Naming convention
- **File:** `feature-action.spec.ts` — ví dụ: `create-api-key-full.spec.ts`
- **Test ID:** `TC_FEATURE_NNN` — ví dụ: `TC_APIKEY_004`
- **Test name:** mô tả behavior — ví dụ: `TC_APIKEY_004 - Tất cả Permission checkboxes được chọn mặc định`

## 9. Logging & report
- Playwright config đã có: screenshot, video, trace khi fail
- Thêm `console.log('✅ Step N PASS: ...')` cho mỗi bước quan trọng
- Error message trong assertion phải đủ context để debug

## 10. Maintainable
- Comment logic phức tạp (đặc biệt workaround React controlled input, Ant Design components)
- Không để dead code
- Nhóm related tests trong `test.describe()`

---

## Bonus — Production project
- Retry flaky test: cấu hình `retries` trong `playwright.config.ts`
- Parallel execution: `workers` trong config
- CI/CD integration: `.gitlab-ci.yml`
- Environment config: `.env` + `.env.<APP_ENV>`
