# CLAUDE.md — FPT Marketplace AI-Powered E2E Testing

> Claude đọc file này ở đầu mỗi session. Đây là nguồn sự thật duy nhất cho toàn bộ project.

---

## 1. Project Overview

**Tên project:** `mcp` (FPT Marketplace Automation)
**Mục tiêu:** Tự động hoá E2E testing + AI agent pipeline cho FPT AI Marketplace
**Owner:** thuanlt11@fpt.com
**Môi trường mạng:** Corporate proxy `10.36.252.45:8080` — cần set khi cài npm hoặc kết nối external API

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Test framework | Playwright v1.58+ (TypeScript), pnpm workspaces |
| AI Orchestrator | Anthropic SDK (`claude-sonnet-4-6`) — fallback tự động sang FPT models khi hết credit |
| FPT AI Client | OpenAI-compatible SDK → `https://mkp-api.fptcloud.com` (VN) / `https://mkp-api.fptcloud.jp` (JP) |
| Tracing | Langfuse |
| CI/CD | GitLab CI (`.gitlab-ci.yml`) |
| Reporting | Playwright HTML + AI failure summary + Slack webhook |
| Monitoring | Checkly API health checks |
| Bug tracking | Jira (`jira.fci.vn`) — Basic Auth REST API |

---

## 3. Project Structure

```
MCP/
├── CLAUDE.md                        ← file này
├── .env                             ← secrets (không commit)
├── .env.example                     ← template
├── .env.prod / .env.stg / .env.test ← env-specific overrides
├── .gitlab-ci.yml                   ← CI/CD pipeline
├── .mcp.json                        ← Playwright MCP server config
├── package.json                     ← root scripts (delegation + tooling)
├── tsconfig.json
├── checkly.config.js
│
├── agents/                          ← AI Agent layer
│   ├── orchestrator.ts              ← top-level router (--agent test|codegen|jira|report)
│   ├── test-agent.ts                ← E2E browser testing via Claude + Playwright MCP
│   ├── codegen-agent.ts             ← Claude/Qwen3 → FPT code gen pipeline
│   └── jira-agent.ts                ← Jira ticket → TC → Playwright script → run → post
│
├── tools/                           ← Shared capabilities (dùng trong agents + utils)
│   ├── fpt-client.ts                ← FPT Cloud API client (low-level + OpenAI SDK)
│   ├── playwright-ai.ts             ← VLM-powered browser control (thay @zerostep)
│   └── langfuse-client.ts           ← Langfuse singleton + trace helpers
│
├── automation-tests/                ← Test execution layer (pnpm monorepo)
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   └── packages/
│       ├── core/                    ← Shared: BaseApiClient, LoginPage, auth.helper, types
│       ├── shared-data/             ← environments/prod.env.ts
│       └── products/
│           ├── fpt-marketplace/     ← MAIN PRODUCT
│           │   ├── playwright.config.ts
│           │   └── src/
│           │       ├── fixtures/auth.setup.ts
│           │       └── tests/
│           │           ├── api/
│           │           │   ├── api-inference.spec.ts      ← VN site API tests
│           │           │   └── api-inference-jp.spec.ts   ← JP site API tests
│           │           ├── regression/                    ← a11y, filter-model, ...
│           │           └── smoke/login.spec.ts
│           ├── fpt-ai/              ← ai.fptcloud.com tests
│           ├── billing/
│           └── portal-v2/
│
├── checkly/                         ← 24/7 monitoring
│   ├── api/fpt-api-health.check.js  ← auto-generated, 24 models
│   └── browser/
│
├── utils/                           ← Pure utilities (reporters, servers, generators)
│   ├── fpt-reporter.ts              ← AI failure analyser (Playwright reporter plugin)
│   ├── slack-report.ts              ← Run suites + post results to Slack
│   ├── jira-reporter.ts             ← Jira bug auto-creation
│   ├── post-regression-result.ts    ← CI post-step
│   ├── post-api-inference-result.ts ← CI post-step
│   ├── generate-checkly-checks.js   ← regenerate checkly/api/fpt-api-health.check.js
│   ├── glm-analyze-results.ts       ← phân tích test results với FPT model
│   ├── glm-direct.ts                ← generate test code trực tiếp (no Claude)
│   ├── translate.ts                 ← dịch nội dung
│   ├── usage-dashboard.ts           ← dashboard API usage
│   ├── webhook-server.ts            ← nhận webhook từ CI
│   └── report-server.ts             ← serve HTML reports
│
└── test-data/
    └── audio/                       ← audio files cho STT tests
```

---

## 4. Naming Conventions

### Test IDs
```
TC-{FEATURE}-{NNN}
TC-AUTH-001     ← login happy path
TC-AUTH-002     ← login wrong password
TC-SEARCH-001   ← search by keyword
TC-CHECKOUT-001 ← add to cart
TC_API_001      ← API inference (dùng underscore cho API tests)
TC_JP_001       ← JP site API tests
```

### File naming
- Spec files: `{feature}.spec.ts`
- Page objects: `{Feature}Page.ts` (PascalCase)
- Agents: `{role}-agent.ts` (kebab-case)
- Tools: `{name}-client.ts` / `{name}-ai.ts`
- Utilities: `camelCase.ts`

### Test structure
```typescript
test.describe('TC-AUTH — Đăng nhập', () => {
  test('TC-AUTH-001: Đăng nhập thành công với tài khoản hợp lệ', async ({ loginPage }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 5. Page Object Model Rules

Selectors **luôn** nằm trong Page Object tại `automation-tests/packages/core/src/helpers/` hoặc product-level pages. **Không** viết selector trực tiếp trong spec file.

```typescript
// automation-tests/packages/core/src/helpers/LoginPage.ts
export class LoginPage extends BasePage {
  emailInput()    { return this.page.getByRole('textbox', { name: /email/i }); }
  passwordInput() { return this.page.getByLabel(/mật khẩu|password/i); }
  submitButton()  { return this.page.getByRole('button', { name: /đăng nhập|login/i }); }
  errorMessage()  { return this.page.getByRole('alert'); }
  userAvatar()    { return this.page.getByTestId('user-avatar'); }

  async login(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }
}
```

**Locator priority:** `getByRole` > `getByLabel` > `getByTestId` > `getByText` > CSS selector

---

## 6. Agent Model

### Layers
```
agents/           ← điều phối logic, multi-turn loop
tools/            ← shared capabilities (stateless)
utils/            ← pure scripts, reporters
```

### Chạy agents
```bash
# Qua orchestrator (recommended)
npx ts-node agents/orchestrator.ts --agent test --flow login
npx ts-node agents/orchestrator.ts --agent codegen "task description"
npx ts-node agents/orchestrator.ts --agent jira NCPP-XXXX --post

# Direct
npx ts-node agents/test-agent.ts --flow checkout
npx ts-node agents/codegen-agent.ts --qwen "task"   # dùng Qwen3, không cần Anthropic
npx ts-node agents/jira-agent.ts NCPP-6392 --dry
```

### Fallback khi Anthropic hết credit / 529
Tất cả agents đều tự động fallback:
- **Credit hết / 402** → switch sang `Kimi-K2.5` → `Nemotron-3-Super-120B-A12B` → `GLM-4.7`
- **529 Overloaded** → exponential backoff tối đa 5 lần:

```typescript
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const is529 = err?.status === 529 || err?.message?.includes('overloaded');
      if (is529 && i < maxRetries - 1) {
        const wait = Math.pow(2, i) * 1000;
        console.warn(`⚠️  529 Overloaded — retry ${i + 1}/${maxRetries} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}
```

### Agent output format
```json
{
  "flow": "login",
  "status": "PASS|FAIL",
  "steps_executed": 7,
  "duration_ms": 4200,
  "failure_reason": null,
  "screenshot_path": "screenshots/login-result.png",
  "ai_analysis": "..."
}
```

### Playwright MCP
Playwright MCP server phải chạy riêng để `test-agent.ts` dùng browser:
```bash
npx @playwright/mcp@latest --port 3001
```
Nếu không chạy, agent tự fallback sang analysis-only mode.

---

## 7. Chạy Tests

### Từ root (delegation sang automation-tests)
```bash
npm run test:marketplace              # tất cả fpt-marketplace tests
npm run test:marketplace:api          # chỉ API tests
npm run test:marketplace:api:vn       # VN site API
npm run test:marketplace:api:jp       # JP site API
npm run test:marketplace:api:vn:prod  # VN site prod
npm run test:marketplace:regression   # regression suite
npm run test:marketplace:smoke        # smoke suite
npm run test:all                      # tất cả products
```

### Từ trong automation-tests (pnpm)
```bash
cd automation-tests
pnpm test:marketplace
pnpm --filter fpt-marketplace test:api:vn
cross-env APP_ENV=prod pnpm --filter fpt-marketplace test:api
```

### Report
```bash
npm run test:report
```

---

## 8. Khi sinh code test mới

**Luôn** tạo file trong `automation-tests/packages/products/{product}/src/tests/{type}/`.

```typescript
// automation-tests/packages/products/fpt-marketplace/src/tests/regression/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '@fpt-automation/core';  // từ core package

test.describe('TC-FEATURE — Tên feature', () => {
  test('TC-FEATURE-001: Happy path', async ({ page }) => {
    const loginPage = new LoginPage(page);
    // ...
  });
});
```

**Import path rules:**
- Shared helpers: `@fpt-automation/core`
- Auth fixtures: `../../fixtures/auth.setup`
- Không import trực tiếp từ `tools/` hay `agents/` trong test files

---

## 9. API Tests

VN site: `process.env.FPT_API_URL` (`https://mkp-api.fptcloud.com`)
JP site: `process.env.FPT_JP_API_URL` (`https://mkp-api.fptcloud.jp`)

Test files ở: `automation-tests/packages/products/fpt-marketplace/src/tests/api/`

Audio test data: `test-data/audio/` (root level, path = `../../../../../../../test-data/audio` từ spec file)

---

## 10. Environment Variables

```bash
# Anthropic (optional — có fallback sang FPT khi hết credit)
ANTHROPIC_API_KEY=sk-ant-...

# FPT API — VN site
FPT_API_URL=https://mkp-api.fptcloud.com
FPT_API_KEY=sk-...
FPT_FROM=thuanlt9

# FPT API — JP site
FPT_JP_API_URL=https://mkp-api.fptcloud.jp
FPT_JP_API_KEY=sk-...

# FPT Gen (code generation, optional — fallback về FPT_API_KEY)
FPT_GEN_API_URL=https://mkp-api.fptcloud.com
FPT_GEN_API_KEY=sk-...

# Marketplace URLs
BASE_URL=https://marketplace.fptcloud.com/en
FPT_MARKETPLACE_URL=https://marketplace.fpt.ai
AI_BASE_URL=https://ai.fptcloud.com
TEST_USER_EMAIL=test@fpt.com
TEST_USER_PASSWORD=...

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Jira (jira.fci.vn — Basic Auth, không dùng Atlassian Cloud/MCP)
JIRA_BASE_URL=https://jira.fci.vn
JIRA_SESSION=...
JIRA_PROJECT_KEY=NCPP

# Langfuse (optional — tracing)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_HTTP_PROXY=

# Proxy (FPT corporate network)
HTTP_PROXY=http://10.36.252.45:8080
HTTPS_PROXY=http://10.36.252.45:8080

# Checkly
ALERT_EMAIL=thuanlt11@fpt.com
```

---

## 11. CI/CD — GitLab CI

Pipeline file: `.gitlab-ci.yml`

| Stage | Trigger | Mô tả |
|---|---|---|
| `regression` | `trigger` / `web` | Chạy regression STG |
| `api-inference-vn-jp` | `schedule` / `web` / `trigger` | Chạy API tests VN + JP prod |

Artifacts: `automation-tests/packages/products/fpt-marketplace/reports/`

---

## 12. Monitoring — Checkly

Config: `checkly.config.js`
Checks: `checkly/api/fpt-api-health.check.js` (24 models, mỗi 6h)

Regenerate checks:
```bash
node utils/generate-checkly-checks.js
npx checkly deploy --force
```

---

## 13. AI Failure Reporting

`utils/fpt-reporter.ts` là Playwright reporter plugin:
1. Lấy screenshot + error từ Playwright
2. Gọi Claude API phân tích root cause
3. Gửi Slack message:

```
❌ [FAIL] TC-AUTH-001 — Đăng nhập thành công
🔗 URL: https://marketplace.fptcloud.com/login
💥 Lỗi: Element không tìm thấy — user-avatar
🤖 AI Analysis: Có thể selector đã thay đổi sau deploy...
📸 Screenshot: [link]
```

Kích hoạt trong playwright.config.ts:
```typescript
reporter: [['./utils/fpt-reporter.ts']]
```

---

## 14. Known Issues & Constraints

| Issue | Workaround |
|---|---|
| FPT proxy chặn `api.anthropic.com` | Set `HTTPS_PROXY` hoặc dùng mạng ngoài |
| Anthropic 402 Credit hết | Agents tự fallback sang FPT models (Kimi-K2.5 → GLM-4.7) |
| Anthropic 529 Overloaded | Exponential backoff 5 lần (xem section 6) |
| Jira `jira.fci.vn` không có Atlassian Cloud | Dùng REST API Basic Auth, không dùng MCP Atlassian |
| Audio STT tests cần file local | Đặt file vào `test-data/audio/` |
| pnpm required cho automation-tests | `npm install -g pnpm` nếu chưa có |

---

## 15. Checklist Khi Sinh Code Mới

- [ ] Test file đặt đúng trong `automation-tests/packages/products/{product}/src/tests/`
- [ ] Test ID đúng format `TC-{FEATURE}-{NNN}`
- [ ] Selector dùng `getByRole` / `getByLabel` / `getByTestId`
- [ ] Logic nằm trong Page Object, không trong spec
- [ ] Có cả positive và negative test case
- [ ] `await` đầy đủ
- [ ] Env vars qua `process.env.*`, không hardcode
- [ ] Import helpers từ `@fpt-automation/core`
- [ ] Agent calls có retry logic cho 529

---

*Last updated: 2026-04-08 | thuanlt11@fpt.com*
