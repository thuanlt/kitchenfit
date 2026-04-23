# BÁO CÁO TEST — FPT AI V2 STAGING

**Ngày**: 2026-04-17 | **Tester**: thuanlt11@fpt.com  
**URL**: https://ai-v2-stg.fptcloud.net  
**Tài khoản**: thuanlt11@fpt.com · xujaturoucrau-8027@yopmail.com

---

## Kết quả tổng quan

| | PASS | FAIL | MINOR | Chưa xác định |
|--|:--:|:--:|:--:|:--:|
| Số lượng | 25 | 3 | 2 | 4 |
| Tỷ lệ | 83% | 10% | 7% | — |

---

## ✅ PASS (25/30)

Đăng nhập/đăng xuất · Org Dashboard · Org Settings (Organizations, Invitations, Policies, Users) · Tạo Workspace · Billing (Overview, Pay now, Credit history, Vouchers, Billing settings, Low balance alert) · Audit Logs · Workspace Dashboard · AI Notebook Service (hiển thị) · Language/Org Selector · Breadcrumb · Pagination · Search/Filter · Billing currency VND

---

## ❌ FAIL (3/30)

| # | Bug | Mức độ |
|---|-----|--------|
| 1 | **AI Notebook Create — CORS Error**: API `instance.create` bị chặn bởi CORS, không tạo được Notebook | 🔴 CRITICAL |
| 2 | **Your Profile — 404**: `/profile` trả về Page Not Found | 🟠 HIGH |
| 3 | **Terms & Policies — 404**: `/terms` trả về Page Not Found | 🟠 HIGH |

---

## ⚠️ MINOR (2)

| # | Issue | Mức độ |
|---|-------|--------|
| 1 | Nhập voucher không hợp lệ → không có thông báo lỗi trên UI | 🟡 LOW |
| 2 | Field Address nhận HTML tags — cần sanitize để tránh XSS | 🟡 LOW |

---

## ❓ Chưa xác định (4)

Pricing · Support · Docs · Feedback — click không có phản hồi rõ ràng, cần xác nhận behavior với PO.

---

## Ưu tiên khắc phục

1. 🔴 Fix CORS cho AI Notebook Create
2. 🟠 Implement trang `/profile` và `/terms`
3. 🟡 Thêm error message cho Voucher + validate/sanitize input Address

---

*2026-04-17 | thuanlt11@fpt.com*
