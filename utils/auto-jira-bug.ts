/**
 * auto-jira-bug.ts
 * Đọc Playwright test-results.json → tạo Jira Bug cho mỗi test FAIL.
 * Dedup bằng cách check label "auto-bug" + summary trùng trong sprint hiện tại.
 *
 * Usage (CI after_script):
 *   APP_ENV=prod  npx ts-node utils/auto-jira-bug.ts
 *   APP_ENV=jp    npx ts-node utils/auto-jira-bug.ts
 *   APP_ENV=stg   npx ts-node utils/auto-jira-bug.ts
 *   --dry-run     preview only, không tạo ticket
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ────────────────────────────────────────────────────────────────────
const APP_ENV      = process.env.APP_ENV ?? 'prod';
const JIRA_BASE    = process.env.JIRA_BASE_URL!;
const JIRA_SESSION = process.env.JIRA_SESSION!;
const JIRA_PROJ    = process.env.JIRA_PROJECT_KEY ?? 'NCPP';
const DRY_RUN      = process.argv.includes('--dry-run');

// Report path — automation-tests writes here, CI copies to reports/
const REPORT_PATHS = [
  path.resolve(__dirname, `../automation-tests/packages/products/fpt-marketplace/reports/test-results.json`),
  path.resolve(__dirname, `../reports/${APP_ENV}/test-results.json`),
  path.resolve(__dirname, `../reports/test-results.json`),
];

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const proxy = new ProxyAgent(PROXY);

const ENV_LABEL = APP_ENV === 'prod' ? 'VN' : APP_ENV === 'jp' ? 'JP' : APP_ENV.toUpperCase();
const ENDPOINT  = `mkp-api.fptcloud${APP_ENV === 'prod' ? '.com' : APP_ENV === 'jp' ? '.jp' : '.stg'}`;

// ── Jira helpers ──────────────────────────────────────────────────────────────
const jiraHeaders: Record<string, string> = {
  Cookie:  `JSESSIONID=${JIRA_SESSION}`,
  Accept:  'application/json',
};

async function jiraGet<T>(apiPath: string): Promise<T> {
  const res = await fetch(`${JIRA_BASE}${apiPath}`, {
    headers: jiraHeaders,
    dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira GET ${apiPath} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function jiraPost(apiPath: string, body: object): Promise<any> {
  const res = await fetch(`${JIRA_BASE}${apiPath}`, {
    method:  'POST',
    headers: { ...jiraHeaders, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira POST ${apiPath} → ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Check duplicate: summary giống nhau trong vòng 7 ngày ────────────────────
async function isDuplicate(summary: string): Promise<boolean> {
  const jql = encodeURIComponent(
    `project = ${JIRA_PROJ} AND labels = "auto-bug" AND summary ~ "${summary.replace(/"/g, '\\"')}" AND created >= -7d ORDER BY created DESC`
  );
  const data = await jiraGet<{ total: number }>(
    `/rest/api/2/search?jql=${jql}&maxResults=1&fields=summary`
  );
  return data.total > 0;
}

// ── Create Jira Bug ───────────────────────────────────────────────────────────
async function createBug(failedTest: {
  title: string;
  error: string;
  suite: string;
  duration: number;
}): Promise<string> {
  const summary = `[AUTO-BUG][${ENV_LABEL}] ${failedTest.title}`;

  const description = `h3. Chi tiết lỗi tự động từ CI

*Môi trường:* ${ENV_LABEL} — ${ENDPOINT}
*Suite:* ${failedTest.suite}
*Test:* ${failedTest.title}
*Duration:* ${failedTest.duration}ms
*Phát hiện:* ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}

h3. Error Message
{code}
${failedTest.error.substring(0, 1000)}
{code}

h3. Hướng xử lý
1. Kiểm tra endpoint: https://${ENDPOINT}/v1/...
2. Xác nhận API key còn hiệu lực
3. Chạy lại manual để confirm: \`cross-env APP_ENV=${APP_ENV} pnpm --filter fpt-marketplace test:api\`

_Ticket này được tạo tự động bởi CI pipeline. Label: auto-bug_`;

  const payload = {
    fields: {
      project:     { key: JIRA_PROJ },
      issuetype:   { name: 'Bug' },
      summary,
      description,
      priority:    { name: failedTest.suite.includes('Chat') || failedTest.suite.includes('Vision') ? 'High' : 'Medium' },
      labels:      ['auto-bug', ENV_LABEL.toLowerCase(), 'api-monitoring'],
    },
  };

  const result = await jiraPost('/rest/api/2/issue', payload);
  return result.key as string;
}

// ── Parse report ──────────────────────────────────────────────────────────────
interface FailedTest {
  title:    string;
  suite:    string;
  error:    string;
  duration: number;
}

function parseFailedTests(filePath: string): FailedTest[] {
  const raw     = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const failed: FailedTest[] = [];

  function walk(suite: any, suiteName: string) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.[0];
        if (result?.status === 'failed' || result?.status === 'timedOut') {
          const errorMsg = result.errors
            ?.map((e: any) => e.message ?? e.value ?? '')
            .join('\n')
            .replace(/\u001b\[[0-9;]*m/g, '')  // strip ANSI
            || 'Unknown error';
          failed.push({
            title:    spec.title,
            suite:    suiteName,
            error:    errorMsg,
            duration: result.duration ?? 0,
          });
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, child.title || suiteName);
  }

  for (const suite of raw.suites ?? []) walk(suite, suite.title || 'Unknown Suite');
  return failed;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!JIRA_BASE || !JIRA_SESSION) {
    console.error('❌ Missing JIRA_BASE_URL or JIRA_SESSION in .env');
    process.exit(1);
  }

  // Find report file
  const reportFile = REPORT_PATHS.find(p => fs.existsSync(p));
  if (!reportFile) {
    console.error('❌ test-results.json not found. Searched:');
    REPORT_PATHS.forEach(p => console.error('   ', p));
    process.exit(1);
  }
  console.log(`\n📂 Report: ${reportFile}`);

  const failedTests = parseFailedTests(reportFile);
  if (failedTests.length === 0) {
    console.log('✅ No failed tests — skipping Jira bug creation.');
    return;
  }

  console.log(`\n🐛 Found ${failedTests.length} failed test(s) [${ENV_LABEL}]:`);
  failedTests.forEach(t => console.log(`   ❌ ${t.title}`));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — tickets not created. Remove --dry-run to create.');
    return;
  }

  console.log('\n📤 Creating Jira Bugs...');
  let created = 0;
  let skipped = 0;

  for (const test of failedTests) {
    try {
      const dup = await isDuplicate(test.title);
      if (dup) {
        console.log(`   ⏭️  Skip (dup): ${test.title}`);
        skipped++;
        continue;
      }
      const key = await createBug(test);
      console.log(`   ✅ Created: ${key} — ${test.title}`);
      console.log(`      ${JIRA_BASE}/browse/${key}`);
      created++;
    } catch (err: any) {
      console.error(`   ❌ Failed to create bug for "${test.title}": ${err.message}`);
    }
  }

  console.log(`\n🎉 Done — ${created} bug(s) created, ${skipped} skipped (duplicate).`);
}

main().catch(err => {
  console.error('❌ auto-jira-bug error:', err.message);
  process.exit(1);
});
