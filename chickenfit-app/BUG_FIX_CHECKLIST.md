# 📋 Bug Fix Checklist

> **Mục đích:** Checklist này dùng để đảm bảo chất lượng khi fix bug, tránh degradation và tìm các bug tương tự trong codebase.

---

## 🔧 Checklist 1: Sửa Bug Không Gây Degradation

### 1️⃣ Before Fix (Trước khi sửa)

- [ ] **Reproduce Bug** - Tái hiện lại bug ít nhất 2 lần
- [ ] **Document Bug** - Ghi lại:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Screenshots/videos
- [ ] **Identify Root Cause** - Tìm nguyên nhân gốc rễ (không chỉ fix symptoms)
- [ ] **Check Dependencies** - Xem code này có bị phụ thuộc bởi chỗ nào khác không
- [ ] **Backup Current State** - Commit hoặc stash code hiện tại

---

### 2️⃣ During Fix (Trong khi sửa)

- [ ] **Minimal Change** - Chỉ sửa code cần thiết, tránh refactor quá rộng
- [ ] **Preserve Existing Behavior** - Đảm bảo các tính năng khác không bị ảnh hưởng
- [ ] **Update Tests** - Cập nhật unit tests nếu cần
- [ ] **Add New Tests** - Thêm tests cho bug vừa fix
- [ ] **Code Review Self** - Review code của chính mình trước khi push

---

### 3️⃣ After Fix (Sau khi sửa)

- [ ] **Verify Fix** - Kiểm tra bug đã được sửa chưa
- [ ] **Regression Testing** - Test lại các tính năng liên quan:
  - [ ] Tính năng trực tiếp liên quan
  - [ ] Tính năng phụ thuộc
  - [ ] User flows liên quan
- [ ] **Edge Cases** - Test các trường hợp đặc biệt:
  - [ ] Empty/null values
  - [ ] Boundary values
  - [ ] Network errors
  - [ ] Concurrent actions
- [ ] **Cross-browser/Device** - Test trên:
  - [ ] Chrome, Safari, Firefox
  - [ ] Mobile (iOS, Android)
  - [ ] Desktop
- [ ] **Performance Check** - Đảm bảo không làm chậm app
- [ ] **Console Logs** - Kiểm tra không có error/warning mới

---

### 4️⃣ Deployment (Triển khai)

- [ ] **Staging Test** - Test trên staging environment trước
- [ ] **Rollback Plan** - Chuẩn bị plan rollback nếu có vấn đề
- [ ] **Monitor Post-deploy** - Theo dõi logs và errors sau khi deploy
- [ ] **User Feedback** - Thu thập feedback từ users

---

## 🔍 Checklist 2: Check Bug Similar Chung

### 1️⃣ Pattern Recognition (Nhận diện pattern)

- [ ] **Search Similar Code Patterns** - Tìm code có pattern tương tự:
  ```bash
  # Ví dụ: tìm tất cả các chỗ sử dụng setStoreProfile trực tiếp
  grep -r "setStoreProfile" --include="*.tsx" --include="*.ts"
  ```
- [ ] **Identify Anti-patterns** - Tìm các anti-patterns phổ biến:
  - [ ] Direct state mutation
  - [ ] Missing error handling
  - [ ] Race conditions
  - [ ] Memory leaks
  - [ ] Uncontrolled re-renders

---

### 2️⃣ Codebase-wide Search (Tìm kiếm toàn bộ codebase)

#### A. State Management Issues
- [ ] **Direct Store Updates** - Tìm các chỗ update store trực tiếp:
  ```bash
  grep -r "setStoreProfile" app/
  grep -r "setPlan" app/
  grep -r "setProgress" app/
  ```
- [ ] **Missing Draft Pattern** - Tìm các form không dùng draft pattern:
  ```bash
  grep -r "useState" app/ | grep -v "draft"
  ```

#### B. Form/Input Issues
- [ ] **Uncontrolled Inputs** - Tìm input không có value binding đúng
- [ ] **Missing Validation** - Tìm form thiếu validation
- [ ] **Auto-save Issues** - Tìm các chỗ auto-save không đúng

#### C. API/Data Issues
- [ ] **Missing Error Handling** - Tìm fetch/axios không có try-catch:
  ```bash
  grep -r "fetch(" app/ | grep -v "try" | grep -v "catch"
  ```
- [ ] **Race Conditions** - Tìm các async operations không có debouncing/throttling
- [ ] **Stale Data** - Tìm các chỗ không invalidate cache sau update

#### D. UI/UX Issues
- [ ] **Missing Loading States** - Tìm async actions không có loading indicator
- [ ] **Missing Error Messages** - Tìm error handling không hiển thị message cho user
- [ ] **Accessibility Issues** - Tìm:
  - [ ] Missing alt text
  - [ ] Missing aria-labels
  - [ ] Keyboard navigation issues

---

### 3️⃣ Automated Checks (Kiểm tra tự động)

#### A. ESLint & TypeScript
- [ ] **Run ESLint**:
  ```bash
  npm run lint
  ```
- [ ] **Run TypeScript Check**:
  ```bash
  npx tsc --noEmit
  ```

#### B. Testing
- [ ] **Run All Tests**:
  ```bash
  npm test
  ```
- [ ] **Run Tests with Coverage**:
  ```bash
  npm run test:coverage
  ```
- [ ] **Check Test Coverage** - Đảm bảo coverage > 80%

#### C. Build Checks
- [ ] **Production Build**:
  ```bash
  npm run build
  ```
- [ ] **Check Build Warnings** - Không có warnings nghiêm trọng

---

### 4️⃣ Manual Testing Matrix (Ma trận test thủ công)

| Feature | Happy Path | Edge Cases | Error Cases | Integration |
|---------|-----------|-----------|-------------|-------------|
| Profile Update | ✅ | ✅ | ✅ | ✅ |
| Recipe List | ✅ | ✅ | ✅ | ✅ |
| Meal Plan | ✅ | ✅ | ✅ | ✅ |
| Progress Log | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |

---

### 5️⃣ Common Bug Categories (Các loại bug phổ biến)

#### A. State Management
- [ ] **Direct Store Mutation** - Update store mà không qua draft
- [ ] **Stale State** - Dùng state cũ trong closures
- [ ] **Race Conditions** - Multiple updates conflict
- [ ] **Memory Leaks** - Không cleanup effects/subscriptions

#### B. Forms & Inputs
- [ ] **Auto-save Too Early** - Lưu khi user chưa xong nhập
- [ ] **Missing Cancel** - Không có nút hủy
- [ ] **Validation Issues** - Validate sai thời điểm
- [ ] **Reset Issues** - Reset form không đúng cách

#### C. API & Data
- [ ] **Optimistic Updates** - Update UI trước khi API success
- [ ] **Error Handling** - Không handle errors
- [ ] **Loading States** - Không show loading
- [ ] **Retry Logic** - Không retry khi failed

#### D. UI/UX
- [ ] **Responsive Issues** - Không responsive
- [ ] **Accessibility** - Không accessible
- [ ] **Performance** - Render quá nhiều lần
- [ ] **Scroll Issues** - Scroll không smooth

---

## 🎯 Template Bug Report

### Bug Information

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-XXX |
| **Title** | [Tiêu đề bug] |
| **Severity** | Critical / High / Medium / Low |
| **Priority** | P1 / P2 / P3 / P4 |
| **Status** | Open / In Progress / Fixed / Verified |
| **Assignee** | [Tên người phụ trách] |
| **Reporter** | [Tên người báo] |
| **Created Date** | YYYY-MM-DD |

### Description

**What is the bug?**
[Mô tả chi tiết bug]

**Steps to Reproduce**
1. [Bước 1]
2. [Bước 2]
3. [Bước 3]

**Expected Behavior**
[Kỳ vọng]

**Actual Behavior**
[Thực tế]

**Screenshots/Videos**
[Link hoặc embed]

### Environment

| Field | Value |
|-------|-------|
| **Platform** | Web / iOS / Android |
| **Browser** | Chrome / Safari / Firefox |
| **OS Version** | [Phiên bản] |
| **App Version** | [Phiên bản] |

### Root Cause Analysis

**Root Cause:**
[Nguyên nhân gốc rễ]

**Affected Files:**
- [ ] `file1.tsx`
- [ ] `file2.tsx`
- [ ] `file3.tsx`

### Fix Information

**Fix Description:**
[Mô tả cách fix]

**Files Changed:**
- [ ] `file1.tsx` - [Mô tả thay đổi]
- [ ] `file2.tsx` - [Mô tả thay đổi]

**Testing Done:**
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] Manual testing completed
- [ ] Regression testing completed

### Related Bugs

- [ ] BUG-XXX - [Bug liên quan]
- [ ] BUG-XXX - [Bug liên quan]

---

## 📝 Bug Log (Lịch sử Bug)

| Date | Bug ID | Title | Severity | Status | Notes |
|------|--------|-------|----------|--------|-------|
| 2026-04-28 | BUG-001 | Tên lưu ngay khi gõ trong profile | Medium | Open | Cần fix draft pattern |
| | | | | | |

---

## 🔗 Quick Links

- [Deployment Guide](./DEPLOYMENT.md)
- [Tasks Completed](./P2_TASKS_COMPLETED.md)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated:** 2026-04-28  
**Version:** 1.0.0