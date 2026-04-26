# Hướng dẫn Trigger CI/CD Pipeline cho E2E Tests trên GitLab

## Tổng quan

Dự án hiện đã được cấu hình CI/CD pipeline trên GitLab để chạy E2E tests tự động với Playwright. Pipeline bao gồm các stage chính:
- **regression**: Chạy tests regression trên môi trường staging
- **api**: Chạy API tests trên môi trường production (VN + JP)
- **monitoring**: Deploy Checkly checks

---

## Cách trigger Pipeline

### 1. Trigger qua GitLab UI (Manual Trigger)

#### Bước 1: Truy cập Project
1. Mở GitLab project
2. Chọn menu **CI/CD** → **Pipelines**

#### Bước 2: Tạo Pipeline mới
1. Click vào nút **"Run pipeline"** (góc phải)
2. Chọn branch muốn chạy (thường là `master` hoặc branch feature)
3. Nhập variables nếu cần (xem section Variables bên dưới)
4. Click **"Run pipeline"**

#### Bước 3: Theo dõi tiến trình
- Pipeline sẽ hiển thị danh sách jobs theo stage
- Click vào job để xem logs chi tiết
- Artifacts (test reports) sẽ được lưu trong 14 ngày

---

### 2. Trigger qua GitLab API

#### Sử dụng cURL
```bash
# Trigger pipeline trên branch master
curl --request POST \
  --header "PRIVATE-TOKEN: <your-access-token>" \
  --form "ref=master" \
  "https://gitlab.com/api/v4/projects/<project-id>/pipeline"
```

#### Sử dụng Python
```python
import requests

GITLAB_TOKEN = "your-access-token"
PROJECT_ID = "your-project-id"
REF = "master"

url = f"https://gitlab.com/api/v4/projects/{PROJECT_ID}/pipeline"
headers = {"PRIVATE-TOKEN": GITLAB_TOKEN}

response = requests.post(url, headers=headers, data={"ref": REF})
print(f"Pipeline ID: {response.json()['id']}")
```

#### Sử dụng Node.js
```javascript
const axios = require('axios');

const GITLAB_TOKEN = 'your-access-token';
const PROJECT_ID = 'your-project-id';
const REF = 'master';

axios.post(
  `https://gitlab.com/api/v4/projects/${PROJECT_ID}/pipeline`,
  { ref: REF },
  { headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN } }
)
.then(response => console.log('Pipeline ID:', response.data.id))
.catch(error => console.error('Error:', error));
```

---

### 3. Trigger qua Webhook

#### Tạo Webhook URL
```
https://gitlab.com/api/v4/projects/<project-id>/trigger/pipeline
```

#### Sử dụng Trigger Token
1. Vào **Settings** → **CI/CD** → **Pipeline triggers**
2. Tạo trigger token mới
3. Sử dụng token để trigger pipeline

```bash
curl --request POST \
  --form "token=<trigger-token>" \
  --form "ref=master" \
  "https://gitlab.com/api/v4/projects/<project-id>/trigger/pipeline"
```

---

### 4. Trigger tự động khi Push Code

Pipeline sẽ tự động chạy khi:
- Push code lên branch `master` (cho job `checkly-deploy`)
- Push code lên bất kỳ branch nào (nếu cấu hình rules phù hợp)

Để trigger regression tests khi push, thêm rule sau vào job `regression`:
```yaml
regression:
  # ... existing config ...
  rules:
    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "master"
    - if: $CI_PIPELINE_SOURCE == "trigger"
    - if: $CI_PIPELINE_SOURCE == "web"
```

---

## Environment Variables

### Variables mặc định
```yaml
APP_ENV: "stg"                    # Môi trường test (stg/prod/jp)
PLAYWRIGHT_BROWSERS_PATH: "C:\\playwright-browsers"
```

### Custom Variables
Khi trigger pipeline, bạn có thể thêm variables:

| Variable | Giá trị | Mô tả |
|----------|---------|-------|
| `APP_ENV` | `stg`, `prod`, `jp` | Môi trường test |
| `TEST_SUITE` | `smoke`, `regression`, `api` | Suite test muốn chạy |
| `BASE_URL` | URL cụ thể | Override base URL |

**Ví dụ trigger với variables:**
```bash
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  --form "ref=master" \
  --form "variables[APP_ENV]=prod" \
  --form "variables[TEST_SUITE]=regression" \
  "https://gitlab.com/api/v4/projects/<project-id>/pipeline"
```

---

## Các Job có sẵn

### 1. Regression Tests (STG)
```yaml
Job: regression
Stage: regression
Môi trường: staging
Timeout: 30 phút
Trigger: manual, web, trigger
```

**Chạy regression tests:**
```bash
# Trigger regression job
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  --form "ref=master" \
  "https://gitlab.com/api/v4/projects/<project-id>/pipeline"
```

### 2. API Inference Tests (VN + JP)
```yaml
Job: api-inference-vn-jp
Stage: api
Môi trường: production (VN + JP)
Timeout: 30 phút
Trigger: schedule, web, trigger
```

**Chạy API tests:**
```bash
curl --request POST \
  --header "PRIVATE-TOKEN: <token>" \
  --form "ref=master" \
  "https://gitlab.com/api/v4/projects/<project-id>/pipeline"
```

### 3. Checkly Deploy
```yaml
Job: checkly-deploy
Stage: monitoring
Trigger: push to master
```

---

## Schedule Pipeline (Tự động định kỳ)

### Tạo Scheduled Pipeline
1. Vào **CI/CD** → **Schedules**
2. Click **"New schedule"**
3. Cấu hình:
   - **Description**: "Daily API Tests"
   - **Interval pattern**: `0 2 * * *` (chạy lúc 2h sáng hàng ngày)
   - **Target branch**: `master`
   - **Variables**: (nếu cần)
4. Click **"Save schedule"**

### Cron Pattern Examples
```
0 2 * * *      → 2:00 AM hàng ngày
0 */6 * * *    → Mỗi 6 giờ
0 9 * * 1-5    → 9:00 AM từ Thứ 2 đến Thứ 6
0 0 1 * *      → Nửa đêm ngày 1 mỗi tháng
```

---

## Xem kết quả Test

### 1. Trên GitLab UI
- Vào **CI/CD** → **Pipelines**
- Click vào pipeline đã chạy
- Xem logs của từng job
- Download artifacts (test reports)

### 2. Artifacts
Pipeline sẽ lưu lại:
```
automation-tests/packages/products/fpt-marketplace/reports/playwright-report/
automation-tests/packages/products/fpt-marketplace/reports/test-results.json
```

### 3. Test Reports
- **HTML Report**: Download và mở `playwright-report/index.html`
- **JSON Report**: Dùng cho tích hợp với Jira, Slack, etc.

---

## Troubleshooting

### Pipeline không chạy
1. Kiểm tra **CI/CD** → **Settings** → **General pipelines** → **CI/CD configuration file**
2. Đảm bảo file `.gitlab-ci.yml` tồn tại ở root directory
3. Kiểm tra runner availability: **Settings** → **CI/CD** → **Runners**

### Job thất bại
1. Xem logs chi tiết của job
2. Kiểm tra environment variables
3. Đảm bảo dependencies được cài đặt đúng
4. Kiểm tra connectivity đến test environment

### Timeout
- Mặc định: 30 phút
- Tăng timeout trong `.gitlab-ci.yml`:
```yaml
regression:
  timeout: 60 minutes  # Tăng lên 60 phút
```

---

## Best Practices

### 1. Branch Strategy
- `master`: Production code, chạy full tests
- `develop`: Development code, chạy smoke tests
- `feature/*`: Feature branches, chạy related tests

### 2. Parallel Execution
```yaml
regression:
  parallel: 4  # Chạy song song trên 4 workers
  script:
    - pnpm test:regression --workers=4
```

### 3. Retry Failed Jobs
```yaml
regression:
  retry:
    max: 2
    when:
      - script_failure
      - api_failure
```

### 4. Notifications
Cấu hình Slack notifications:
```yaml
after_script:
  - npx ts-node utils/slack-report.ts
```

---

## Tích hợp với Jira

Pipeline tự động tạo bugs trên Jira khi tests fail:
```yaml
after_script:
  - cross-env APP_ENV=stg npx ts-node utils/auto-jira-bug.ts || true
```

---

## Ví dụ Workflow hoàn chỉnh

### Workflow 1: Daily Regression Tests
```yaml
# Schedule: 2:00 AM daily
# Trigger: Scheduled pipeline
# Jobs: regression (STG)
# Notifications: Slack + Jira
```

### Workflow 2: Pre-deployment Tests
```yaml
# Trigger: Manual before deployment
# Jobs: regression (PROD) + API tests
# Approval: Required before merge to master
```

### Workflow 3: Post-deployment Monitoring
```yaml
# Trigger: After deployment
# Jobs: checkly-deploy
# Monitoring: Continuous checks via Checkly
```

---

## Tài liệu tham khảo

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Playwright CI/CD Integration](https://playwright.dev/docs/ci)
- [GitLab Pipeline Triggers](https://docs.gitlab.com/ee/ci/triggers/)

---

## Liên hệ & Support

Nếu gặp vấn đề:
1. Check logs trong GitLab CI/CD
2. Review file `.gitlab-ci.yml`
3. Contact DevOps team hoặc QA team