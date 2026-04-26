# Hướng dẫn Thiết lập Lịch trình E2E Test cho FPT CLAW

## 📋 Tổng quan

File `.gitlab-ci.yml` đã được cập nhật để chạy E2E tests cho FPT CLAW trên môi trường STG:
- **Target URL**: https://stg-claw.fptcloud.net/
- **Test Files**:
  - `fptclaw_e2e.spec.ts` - Test E2E chính (8 test cases)
  - `fptclaw_workspace_e2e.spec.ts` - Test workspace E2E (4 test cases)
- **Stage**: `e2e-claw`
- **Job Name**: `fpt-claw-e2e-stg`

---

## 🚀 Cách chạy Test

### 1. Chạy thủ công (Manual Trigger)

#### Cách 1: Từ GitLab UI
1. Vào project trên GitLab
2. Chọn **CI/CD** → **Pipelines**
3. Click **Run pipeline**
4. Chọn branch: `master`
5. Click **Run pipeline**

#### Cách 2: Từ GitLab CLI
```bash
# Trigger pipeline từ command line
curl --request POST \
  --header "PRIVATE-TOKEN: <your-access-token>" \
  --header "Content-Type: application/json" \
  --data '{"ref": "master"}' \
  "https://gitlab.fci.vn/api/v4/projects/<project-id>/pipeline"
```

#### Cách 3: Sử dụng script trigger
```bash
# Sử dụng script có sẵn trong project
cd scripts
node trigger-gitlab-pipeline.js
```

---

## ⏰ Thiết lập Lịch trình Tự động (Schedule)

### Cách 1: Từ GitLab UI (Khuyên dùng)

#### Bước 1: Tạo Schedule
1. Vào project trên GitLab
2. Chọn **CI/CD** → **Schedules**
3. Click **New schedule**
4. Điền thông tin:
   - **Description**: `FPT CLAW E2E Tests - Daily`
   - **Interval pattern**: Chọn tần suất (ví dụ: Daily)
   - **Cron**: `0 2 * * *` (Chạy lúc 2:00 sáng mỗi ngày)
   - **Target branch**: `master`
   - **Variables** (nếu cần):
     ```
     APP_ENV = stg
     FPT_CLAW_URL = https://stg-claw.fptcloud.net
     ```
5. Click **Save schedule**

#### Bước 2: Kích hoạt Schedule
1. Trong danh sách schedules, tìm schedule vừa tạo
2. Click vào toggle để **Activate** schedule
3. Xác nhận kích hoạt

#### Các mẫu Cron phổ biến:
```
# Chạy hàng ngày lúc 2:00 sáng
0 2 * * *

# Chạy hàng ngày lúc 6:00 sáng (Giờ Việt Nam)
0 23 * * *   (UTC timezone)

# Chạy mỗi 6 giờ
0 */6 * * *

# Chạy vào Thứ 2, Thứ 4, Thứ 6 lúc 2:00 sáng
0 2 * * 1,3,5

# Chạy vào ngày 1 và 15 mỗi tháng lúc 2:00 sáng
0 2 1,15 * *
```

### Cách 2: Sử dụng GitLab API

```bash
# Tạo schedule mới
curl --request POST \
  --header "PRIVATE-TOKEN: <your-access-token>" \
  --header "Content-Type: application/json" \
  --data '{
    "description": "FPT CLAW E2E Tests - Daily",
    "cron": "0 2 * * *",
    "cron_timezone": "UTC",
    "ref": "master",
    "active": true
  }' \
  "https://gitlab.fci.vn/api/v4/projects/<project-id>/pipeline_schedules"

# Lấy danh sách schedules
curl --header "PRIVATE-TOKEN: <your-access-token>" \
  "https://gitlab.fci.vn/api/v4/projects/<project-id>/pipeline_schedules"

# Xóa schedule
curl --request DELETE \
  --header "PRIVATE-TOKEN: <your-access-token>" \
  "https://gitlab.fci.vn/api/v4/projects/<project-id>/pipeline_schedules/<schedule-id>"
```

---

## 📊 Xem kết quả Test

### 1. Trong GitLab Pipeline
1. Vào **CI/CD** → **Pipelines**
2. Chọn pipeline đang chạy hoặc đã hoàn thành
3. Click vào job `fpt-claw-e2e-stg`
4. Xem log chi tiết

### 2. Download Artifacts
1. Trong pipeline, click vào job `fpt-claw-e2e-stg`
2. Click vào **Browse** trong phần **Job artifacts**
3. Download:
   - `playwright-report/` - HTML report
   - `test-results.json` - JSON report
   - `test-results/` - Test results chi tiết

### 3. Xem HTML Report
```bash
# Sau khi download artifacts, giải nén và mở report
cd automation-tests/packages/products/fpt-claw/reports
npx playwright show-report playwright-report
```

---

## 🔧 Cấu hình Chi tiết

### Job Configuration
```yaml
fpt-claw-e2e-stg:
  stage: e2e-claw
  needs: []                          # Không phụ thuộc job khác
  tags:
    - playwright                     # Runner với tag playwright
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"  # Chạy theo lịch
    - if: $CI_PIPELINE_SOURCE == "web"       # Chạy thủ công
    - if: $CI_PIPELINE_SOURCE == "trigger"   # Chạy bằng trigger
  timeout: 45 minutes               # Timeout tối đa
  allow_failure: false              # Không cho phép fail
```

### Environment Variables
```bash
APP_ENV=stg                                    # Môi trường STG
FPT_CLAW_URL=https://stg-claw.fptcloud.net/   # URL target
PLAYWRIGHT_BROWSERS_PATH=C:\playwright-browsers # Path browser cache
```

---

## 📈 Monitoring & Alerts

### 1. Slack Notification (Nếu đã cấu hình)
Pipeline sẽ tự động gửi notification về Slack khi:
- Test pass ✅
- Test fail ❌
- Test timeout ⏱️

### 2. Email Notification
Cấu hình trong **Settings** → **CI/CD** → **Pipeline notifications**

### 3. Jira Integration (Nếu đã cấu hình)
Test fail sẽ tự động tạo bug trong Jira qua script `auto-jira-bug.ts`

---

## 🛠️ Troubleshooting

### 1. Pipeline không chạy theo lịch
- Kiểm tra schedule đã được **Active**
- Kiểm tra cron expression có đúng không
- Kiểm tra timezone setting

### 2. Test timeout
- Tăng timeout trong `.gitlab-ci.yml` (hiện tại: 45 phút)
- Kiểm tra network connection đến STG environment
- Kiểm tra AI response time

### 3. Test fail
- Xem log chi tiết trong GitLab job
- Download artifacts và xem HTML report
- Kiểm tra STG environment có ổn định không
- Kiểm tra credentials có còn valid không

### 4. Runner không available
- Kiểm tra runner với tag `playwright` có online không
- Liên hệ DevOps team nếu runner bị down

---

## 📝 Test Coverage

### fptclaw_e2e.spec.ts (8 test cases)
| Test Case | Mô tả | Timeout |
|-----------|-------|---------|
| TC-E2E-001 | Authentication Flow | 15s |
| TC-E2E-002 | Dashboard Navigation | 10s |
| TC-E2E-003 | Chat Functionality | 180s |
| TC-E2E-004 | Recent Tasks | 10s |
| TC-E2E-005 | User Profile | 10s |
| TC-E2E-006 | Workspace Settings | 5s |
| TC-E2E-007 | Integration Page | 10s |
| TC-E2E-008 | Complete User Journey | 300s |

### fptclaw_workspace_e2e.spec.ts (4 test cases)
| Test Case | Mô tả | Timeout |
|-----------|-------|---------|
| TC-WORKSPACE-001 | Agent and Skill Management | 10s |
| TC-WORKSPACE-002 | Agent Teams Management | 10s |
| TC-WORKSPACE-003 | Explorer (Storage) | 10s |
| TC-WORKSPACE-004 | Account Integrations | 10s |

---

## 🎯 Best Practices

1. **Chạy test vào giờ thấp điểm** (ví dụ: 2:00 sáng) để tránh ảnh hưởng performance
2. **Review kết quả hàng ngày** để phát hiện sớm bugs
3. **Cập nhật test cases** khi có thay đổi UI/UX
4. **Giữ credentials updated** trong environment variables
5. **Monitor pipeline duration** để optimize performance

---

## 📞 Support

Nếu gặp vấn đề, liên hệ:
- **DevOps Team**: Hỗ trợ infrastructure và runner
- **QA Team**: Hỗ trợ test cases và troubleshooting
- **Development Team**: Hỗ trợ khi có thay đổi UI/UX

---

*Last updated: 2026-04-25*
*Author: Automation Team*