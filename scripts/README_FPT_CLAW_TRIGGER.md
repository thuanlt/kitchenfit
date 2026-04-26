# FPT CLAW E2E Trigger Scripts

## 📋 Tổng quan

Các script này giúp bạn trigger pipeline E2E test cho FPT CLAW một cách nhanh chóng.

## 🚀 Cách sử dụng

### Phương pháp 1: Sử dụng Node.js Script (Khuyên dùng cho Linux/Mac)

```bash
# Set environment variable
export GITLAB_PRIVATE_TOKEN="your-gitlab-personal-access-token"

# Run script
node trigger-fpt-claw-e2e.js
```

### Phương pháp 2: Sử dụng PowerShell Script (Khuyên dùng cho Windows)

```powershell
# Set environment variable
$env:GITLAB_PRIVATE_TOKEN="your-gitlab-personal-access-token"

# Run script
.\trigger-fpt-claw-e2e.ps1
```

### Phương pháp 3: One-liner (Linux/Mac)

```bash
GITLAB_PRIVATE_TOKEN="your-token" node trigger-fpt-claw-e2e.js
```

### Phương pháp 4: One-liner (Windows PowerShell)

```powershell
$env:GITLAB_PRIVATE_TOKEN="your-token"; .\trigger-fpt-claw-e2e.ps1
```

---

## 🔑 Lấy GitLab Personal Access Token

1. Đăng nhập vào GitLab: https://gitlab.fci.vn
2. Chọn **Settings** → **Access Tokens**
3. Click **Add new token**
4. Điền thông tin:
   - **Token name**: `FPT CLAW E2E Trigger`
   - **Expiration date**: Chọn ngày hết hạn
   - **Scopes**: Chọn:
     - ✅ `api`
     - ✅ `read_api`
     - ✅ `read_repository`
     - ✅ `write_repository`
5. Click **Create personal access token**
6. **Copy token ngay** (chỉ hiển thị 1 lần!)

---

## ⚙️ Cấu hình Tùy chọn

### Environment Variables

| Variable | Mặc định | Mô tả |
|----------|---------|-------|
| `GITLAB_PRIVATE_TOKEN` | Required | Personal access token của GitLab |
| `GITLAB_URL` | `gitlab.fci.vn` | GitLab server URL |
| `GITLAB_PROJECT_ID` | `ncp-product/.../modas` | Project ID trên GitLab |
| `GITLAB_REF` | `master` | Branch để chạy pipeline |

### Ví dụ với custom configuration

```bash
# Linux/Mac
export GITLAB_PRIVATE_TOKEN="your-token"
export GITLAB_URL="gitlab.fci.vn"
export GITLAB_REF="develop"
node trigger-fpt-claw-e2e.js
```

```powershell
# Windows PowerShell
$env:GITLAB_PRIVATE_TOKEN="your-token"
$env:GITLAB_URL="gitlab.fci.vn"
$env:GITLAB_REF="develop"
.\trigger-fpt-claw-e2e.ps1
```

---

## 📊 Output Example

```
🚀 Triggering FPT CLAW E2E Test Pipeline...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 GitLab URL: gitlab.fci.vn
📦 Project ID: ncp-product/automation-testing/ncp_cloud/ai-factory/modas
🌿 Branch: master
🌐 Target URL: https://stg-claw.fptcloud.net
🔧 Environment: stg
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pipeline triggered successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔢 Pipeline ID: 270644
🔗 Pipeline URL: https://gitlab.fci.vn/.../pipelines/270644
📊 Status: created
👤 Created by: thuanlt11
🕐 Created at: 2026-04-25T10:30:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: Use the URL above to track pipeline progress

📋 Next steps:
   1. Open the pipeline URL to track progress
   2. Check the fpt-claw-e2e-stg job for test execution
   3. Download artifacts to view test reports
   4. Review test results and fix any failures

⏱️  Estimated duration: ~30-45 minutes
📧 You will receive notifications when the pipeline completes
```

---

## 🔍 Theo dõi Pipeline

Sau khi trigger, bạn có thể:

1. **Mở URL pipeline** (script sẽ tự động mở trên Windows)
2. **Xem job `fpt-claw-e2e-stg`** để xem chi tiết test execution
3. **Download artifacts** để xem test reports
4. **Xem HTML report** bằng cách:
   ```bash
   npx playwright show-report reports/playwright-report
   ```

---

## 🛠️ Troubleshooting

### Error: GITLAB_PRIVATE_TOKEN environment variable is required

**Giải pháp:**
```bash
# Linux/Mac
export GITLAB_PRIVATE_TOKEN="your-token"

# Windows PowerShell
$env:GITLAB_PRIVATE_TOKEN="your-token"
```

### Error: HTTP 401 Unauthorized

**Nguyên nhân:** Token không hợp lệ hoặc đã hết hạn

**Giải pháp:**
1. Kiểm tra token có đúng không
2. Kiểm tra token có còn hiệu lực không
3. Tạo token mới nếu cần

### Error: HTTP 404 Not Found

**Nguyên nhân:** Project ID không đúng hoặc không có quyền truy cập

**Giải pháp:**
1. Kiểm tra Project ID có đúng không
2. Kiểm tra user có quyền truy cập project không
3. Kiểm tra token có scope `api` không

### Error: Pipeline không chạy

**Nguyên nhân:**
- Branch không tồn tại
- File `.gitlab-ci.yml` có lỗi
- Runner không available

**Giải pháp:**
1. Kiểm tra branch có tồn tại không
2. Kiểm tra syntax của `.gitlab-ci.yml`
3. Liên hệ DevOps team để kiểm tra runner

---

## 📝 Tips & Best Practices

1. **Lưu token an toàn:**
   - Không commit token vào git
   - Sử dụng environment variables
   - Sử dụng `.env` file (nhưng thêm vào `.gitignore`)

2. **Set token permanent (Linux/Mac):**
   ```bash
   # Thêm vào ~/.bashrc hoặc ~/.zshrc
   echo 'export GITLAB_PRIVATE_TOKEN="your-token"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Set token permanent (Windows PowerShell):**
   ```powershell
   # Thêm vào $PROFILE
   [System.Environment]::SetEnvironmentVariable('GITLAB_PRIVATE_TOKEN', 'your-token', 'User')
   ```

4. **Tạo alias (Linux/Mac):**
   ```bash
   # Thêm vào ~/.bashrc hoặc ~/.zshrc
   alias trigger-claw='cd scripts && node trigger-fpt-claw-e2e.js'
   ```

5. **Tạo function (PowerShell):**
   ```powershell
   # Thêm vào $PROFILE
   function trigger-claw {
       cd scripts
       .\trigger-fpt-claw-e2e.ps1
   }
   ```

---

## 📞 Support

Nếu gặp vấn đề, liên hệ:
- **DevOps Team**: Hỗ trợ GitLab configuration
- **QA Team**: Hỗ trợ test execution
- **Automation Team**: Hỗ trợ script issues

---

*Last updated: 2026-04-25*
*Author: Automation Team*