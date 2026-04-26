# 🎯 FPT CLAW E2E Tests - GitLab CI Setup Complete

## ✅ Đã hoàn thành cấu hình

### 1. Cập nhật `.gitlab-ci.yml`
- ✅ Thêm stage `e2e-claw`
- ✅ Thêm job `fpt-claw-e2e-stg`
- ✅ Cấu hình chạy 2 file test:
  - `fptclaw_e2e.spec.ts` (8 test cases)
  - `fptclaw_workspace_e2e.spec.ts` (4 test cases)
- ✅ Target URL: `https://stg-claw.fptcloud.net/`
- ✅ Timeout: 45 phút
- ✅ Support: schedule, web, trigger

### 2. Tạo Scripts Trigger
- ✅ `scripts/trigger-fpt-claw-e2e.js` (Node.js)
- ✅ `scripts/trigger-fpt-claw-e2e.ps1` (PowerShell)
- ✅ `scripts/README_FPT_CLAW_TRIGGER.md` (Hướng dẫn sử dụng)

### 3. Tạo Documentation
- ✅ `FPT_CLAW_E2E_SCHEDULE_GUIDE.md` (Hướng dẫn chi tiết)
- ✅ `FPT_CLAW_E2E_SETUP_SUMMARY.md` (File này)

---

## 🚀 Cách sử dụng nhanh

### Cách 1: Chạy thủ công ngay bây giờ

#### Linux/Mac:
```bash
cd scripts
export GITLAB_PRIVATE_TOKEN="your-token"
node trigger-fpt-claw-e2e.js
```

#### Windows PowerShell:
```powershell
cd scripts
$env:GITLAB_PRIVATE_TOKEN="your-token"
.\trigger-fpt-claw-e2e.ps1
```

### Cách 2: Thiết lập lịch trình tự động

1. Vào GitLab project
2. Chọn **CI/CD** → **Schedules**
3. Click **New schedule**
4. Điền thông tin:
   - **Description**: `FPT CLAW E2E Tests - Daily`
   - **Cron**: `0 2 * * *` (2:00 sáng mỗi ngày)
   - **Target branch**: `master`
5. Click **Save schedule**
6. **Activate** schedule

---

## 📊 Chi tiết Test Suite

### fptclaw_e2e.spec.ts (8 test cases)
| TC | Tên | Mô tả |
|----|-----|-------|
| TC-E2E-001 | Authentication Flow | Đăng nhập với valid/invalid credentials |
| TC-E2E-002 | Dashboard Navigation | Điều hướng đến chat, agent, agent teams |
| TC-E2E-003 | Chat Functionality | Gửi tin nhắn, chọn agent, quick actions |
| TC-E2E-004 | Recent Tasks | Xem tác vụ gần đây |
| TC-E2E-005 | User Profile | Xem thông tin profile |
| TC-E2E-006 | Workspace Settings | Điều hướng đến cài đặt workspace |
| TC-E2E-007 | Integration Page | Điều hướng đến trang tích hợp |
| TC-E2E-008 | Complete User Journey | Luồng người dùng hoàn chỉnh |

### fptclaw_workspace_e2e.spec.ts (4 test cases)
| TC | Tên | Mô tả |
|----|-----|-------|
| TC-WORKSPACE-001 | Agent and Skill Management | Điều hướng đến Agent & Skill page |
| TC-WORKSPACE-002 | Agent Teams Management | Điều hướng đến Agent Teams page |
| TC-WORKSPACE-003 | Explorer (Storage) | Điều hướng đến Explorer/Storage page |
| TC-WORKSPACE-004 | Account Integrations | Điều hướng đến Integrations page |

---

## 📁 Cấu trúc Files

```
.
├── .gitlab-ci.yml                              # ✅ Đã cập nhật
├── FPT_CLAW_E2E_SCHEDULE_GUIDE.md             # ✅ Đã tạo
├── FPT_CLAW_E2E_SETUP_SUMMARY.md              # ✅ File này
├── automation-tests/
│   └── packages/products/fpt-claw/
│       ├── src/tests/e2e/
│       │   ├── fptclaw_e2e.spec.ts           # ✅ Test E2E chính
│       │   ├── fptclaw_workspace_e2e.spec.ts # ✅ Test workspace E2E
│       │   └── README_E2E.md                 # ✅ Tài liệu test
│       ├── playwright.config.ts               # ✅ Cấu hình Playwright
│       └── package.json                       # ✅ Scripts test
└── scripts/
    ├── trigger-fpt-claw-e2e.js               # ✅ Node.js trigger script
    ├── trigger-fpt-claw-e2e.ps1              # ✅ PowerShell trigger script
    └── README_FPT_CLAW_TRIGGER.md            # ✅ Hướng dẫn trigger
```

---

## 🔧 Cấu hình GitLab CI

### Job: fpt-claw-e2e-stg
```yaml
fpt-claw-e2e-stg:
  stage: e2e-claw
  needs: []
  tags:
    - playwright
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"  # ✅ Chạy theo lịch
    - if: $CI_PIPELINE_SOURCE == "web"       # ✅ Chạy thủ công
    - if: $CI_PIPELINE_SOURCE == "trigger"   # ✅ Chạy bằng trigger
  timeout: 45 minutes
  allow_failure: false
```

### Environment Variables
```bash
APP_ENV=stg                                    # Môi trường STG
FPT_CLAW_URL=https://stg-claw.fptcloud.net/   # URL target
PLAYWRIGHT_BROWSERS_PATH=C:\playwright-browsers # Path browser cache
```

---

## 📈 Xem kết quả Test

### 1. Trong GitLab Pipeline
1. Vào **CI/CD** → **Pipelines**
2. Chọn pipeline đang chạy
3. Click vào job `fpt-claw-e2e-stg`
4. Xem log chi tiết

### 2. Download Artifacts
- `playwright-report/` - HTML report
- `test-results.json` - JSON report
- `test-results/` - Test results chi tiết

### 3. Xem HTML Report
```bash
cd automation-tests/packages/products/fpt-claw/reports
npx playwright show-report playwright-report
```

---

## 🎯 Các bước tiếp theo

### 1. Lấy GitLab Personal Access Token
1. Đăng nhập GitLab: https://gitlab.fci.vn
2. Settings → Access Tokens
3. Create new token với scopes: `api`, `read_api`
4. Copy token

### 2. Test trigger pipeline
```bash
# Linux/Mac
cd scripts
export GITLAB_PRIVATE_TOKEN="your-token"
node trigger-fpt-claw-e2e.js
```

### 3. Thiết lập lịch trình tự động
1. Vào GitLab → CI/CD → Schedules
2. Create new schedule
3. Cron: `0 2 * * *` (2:00 sáng mỗi ngày)
4. Activate schedule

### 4. Monitor và review
1. Check pipeline results hàng ngày
2. Review test failures
3. Fix bugs và update test cases

---

## 📚 Tài liệu tham khảo

| File | Mô tả |
|------|-------|
| `FPT_CLAW_E2E_SCHEDULE_GUIDE.md` | Hướng dẫn chi tiết về schedule và monitoring |
| `scripts/README_FPT_CLAW_TRIGGER.md` | Hướng dẫn sử dụng trigger scripts |
| `automation-tests/packages/products/fpt-claw/src/tests/e2e/README_E2E.md` | Tài liệu chi tiết về test cases |

---

## 🛠️ Troubleshooting

### Pipeline không chạy
- ✅ Kiểm tra schedule đã active chưa
- ✅ Kiểm tra cron expression
- ✅ Kiểm tra runner có online không

### Test timeout
- ✅ Tăng timeout trong `.gitlab-ci.yml`
- ✅ Kiểm tra network connection
- ✅ Kiểm tra AI response time

### Test fail
- ✅ Xem log chi tiết trong GitLab
- ✅ Download artifacts và xem HTML report
- ✅ Kiểm tra STG environment
- ✅ Kiểm tra credentials

---

## 📞 Support

- **DevOps Team**: Infrastructure và runner support
- **QA Team**: Test cases và troubleshooting
- **Automation Team**: Script issues và configuration

---

## ✨ Features

✅ **Automated Testing**: Chạy E2E tests tự động theo lịch
✅ **Manual Trigger**: Chạy test bất cứ lúc nào
✅ **Detailed Reports**: HTML và JSON reports
✅ **Artifact Storage**: Lưu trữ kết quả test 14 ngày
✅ **Slack Integration**: Notification khi test complete
✅ **Jira Integration**: Auto-create bugs khi test fail
✅ **Multi-environment**: Support STG, PROD environments
✅ **Flexible Scheduling**: Custom cron schedules

---

*Setup completed: 2026-04-25*
*Author: Automation Team*

🎉 **FPT CLAW E2E Tests đã sẵn sàng để chạy!**