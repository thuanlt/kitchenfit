/**
 * openclaw-agent.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Pipeline: Jira ticket → OpenClaw AI agent → Test Cases → Playwright Script
 *         → Run Test → Update Jira with results
 *
 * Usage:
 *   npx ts-node utils/openclaw-agent.ts NCPP-XXXX
 *   npx ts-node utils/openclaw-agent.ts NCPP-XXXX --post   # post results to Jira
 *   npx ts-node utils/openclaw-agent.ts NCPP-XXXX --dry    # generate only, do not run
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────
const JIRA_BASE    = process.env.JIRA_BASE_URL!;
const JIRA_SESSION = process.env.JIRA_SESSION!;

// VN site — vision model (gemma multimodal)
const FPT_BASE     = process.env.FPT_API_URL!;
const FPT_KEY      = process.env.FPT_API_KEY!;
const FPT_FROM     = process.env.FPT_FROM!;

// JP PROD site — Nemotron agent (PHẢI dùng PROD key, không dùng STG)
const FPT_JP_BASE  = process.env.FPT_JP_API_URL!;
const FPT_JP_KEY   = process.env.FPT_JP_API_KEY!;

const VISION_MODEL  = 'gemma-3-27b-it';              // VN site: mô tả images/UI
const TC_MODEL      = 'Nemotron-3-Super-120B-A12B';  // JP PROD: sinh test case (coverage rộng hơn)
const CODEGEN_MODEL = 'gpt-oss-120b';                // VN site: gen Playwright script (chính xác hơn)

const ISSUE_KEY  = process.argv[2];
const POST_BACK  = process.argv.includes('--post');
const DRY_RUN    = process.argv.includes('--dry');
const REPORT_DIR = path.resolve(__dirname, '../reports/openclaw');
const GEN_DIR    = path.resolve(__dirname, '../tests/api/generated');

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const proxy = new ProxyAgent(PROXY);

// ─── Jira helpers ─────────────────────────────────────────────────────────────
const jiraHeaders: Record<string, string> = {
  'Cookie': `JSESSIONID=${JIRA_SESSION}`,
  'Accept': 'application/json',
};

async function jiraGet<T>(apiPath: string): Promise<T> {
  const res = await fetch(`${JIRA_BASE}${apiPath}`, {
    headers: jiraHeaders, dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira GET ${apiPath} → HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function jiraComment(key: string, body: string): Promise<void> {
  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}/comment`, {
    method: 'POST',
    headers: { ...jiraHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
    dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira comment → HTTP ${res.status}: ${await res.text()}`);
}

async function downloadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'Cookie': `JSESSIONID=${JIRA_SESSION}` }, dispatcher: proxy,
    } as any);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${ct};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// ─── FPT API helpers ──────────────────────────────────────────────────────────
async function callFPT(model: string, messages: any[], maxTokens = 3000): Promise<string> {
  const res = await fetch(
    `${FPT_BASE}/v1/chat/completions?from=${FPT_FROM}&model=${model}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FPT_KEY}` },
      body: JSON.stringify({ model, messages, streaming: false, temperature: 0.3, max_tokens: maxTokens }),
      dispatcher: proxy,
    } as any
  );
  if (!res.ok) throw new Error(`FPT-VN/${model} → HTTP ${res.status}: ${await res.text()}`);
  const body: any = await res.json();
  const msg = body.choices?.[0]?.message ?? {};
  const raw = msg.content ?? msg.reasoning_content ?? '';
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// JP PROD site — Nemotron-3-Super-120B-A12B dùng để sinh TC (dùng FPT_JP_API_KEY, không dùng STG key)
async function callAgent(messages: any[], maxTokens = 4000): Promise<string> {
  const res = await fetch(
    `${FPT_JP_BASE}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FPT_JP_KEY}` },
      body: JSON.stringify({ model: TC_MODEL, messages, streaming: false, temperature: 0.3, max_tokens: maxTokens }),
      dispatcher: proxy,
    } as any
  );
  if (!res.ok) throw new Error(`FPT-JP/${TC_MODEL} → HTTP ${res.status}: ${await res.text()}`);
  const body: any = await res.json();
  const msg = body.choices?.[0]?.message ?? {};
  const raw = msg.content ?? msg.reasoning_content ?? '';
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// ─── ADF text extractor ───────────────────────────────────────────────────────
function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'mention') return `@${node.attrs?.text ?? ''}`;
  if (node.type === 'inlineCard') return node.attrs?.url ?? '';
  if (node.content) return (node.content as any[]).map(extractText).join(' ');
  return '';
}

// ─── STEP 1: Fetch Jira issue ─────────────────────────────────────────────────
interface JiraIssue {
  key:        string;
  summary:    string;
  issueType:  string;
  description:string;
  acceptance: string;
  attachments:{ filename: string; mimeType: string; content: string }[];
  comments:   string[];
}

async function fetchJiraIssue(key: string): Promise<JiraIssue> {
  console.log(`\n🔍 [1/5] Fetching Jira issue: ${key}`);
  const issue: any = await jiraGet(
    `/rest/api/2/issue/${key}?fields=summary,issuetype,description,attachment,comment,customfield_10006`
  );
  const f   = issue.fields;
  const desc = typeof f.description === 'string' ? f.description : extractText(f.description);
  const acMatch = desc.match(/acceptance criteria[:\s]*([\s\S]*?)(?:\n\n|\n#|$)/i);

  console.log(`   ✅ ${f.summary} [${f.issuetype?.name}]`);
  return {
    key,
    summary:     f.summary ?? '',
    issueType:   f.issuetype?.name ?? 'Task',
    description: desc,
    acceptance:  acMatch?.[1]?.trim() ?? '',
    attachments: (f.attachment ?? []).map((a: any) => ({
      filename: a.filename, mimeType: a.mimeType, content: a.content,
    })),
    comments: ((f.comment?.comments ?? []) as any[])
      .slice(0, 5)
      .map((c: any) => `[${c.author?.displayName}]: ${extractText(c.body)}`),
  };
}

// ─── STEP 2: Generate test cases ─────────────────────────────────────────────
async function generateTestCases(issue: JiraIssue): Promise<string> {
  console.log(`\n📋 [2/5] Generating test cases with ${TC_MODEL}...`);

  // Describe images first
  const imageDescs: string[] = [];
  const images = issue.attachments.filter(a => a.mimeType?.startsWith('image/')).slice(0, 4);
  for (const img of images) {
    console.log(`   🖼️  Describing image: ${img.filename}`);
    const b64 = await downloadImage(img.content);
    if (!b64) continue;
    const desc = await callFPT(VISION_MODEL, [{
      role: 'user',
      content: [
        { type: 'text', text: `QA analyst. Describe UI components, user flows, validations visible for Jira task: "${issue.summary}"` },
        { type: 'image_url', image_url: { url: b64 } },
      ],
    }], 800);
    imageDescs.push(`**${img.filename}:**\n${desc}`);
  }

  const imageSection = imageDescs.length > 0
    ? `\n## UI Analysis (${imageDescs.length} images):\n${imageDescs.join('\n\n')}`
    : '';

  const prompt = `You are a senior QA engineer. Generate comprehensive test cases for this Jira task.

## Task: ${issue.summary}
**Type:** ${issue.issueType}

## Description:
${issue.description || '(no description)'}

## Acceptance Criteria:
${issue.acceptance || '(not specified)'}
${imageSection}
${issue.comments.length > 0 ? `\n## Key Comments:\n${issue.comments.join('\n---\n')}` : ''}

## Output Format (Vietnamese):

### TC-001: [Tên test case]
**Loại:** Positive / Negative / Edge Case
**Điều kiện tiên quyết:** ...
**Các bước:**
1. ...
**Kết quả mong đợi:** ...
**Automation:** [API] | [UI] | [Manual]
**Độ ưu tiên:** High / Medium / Low

---

Requirements:
- Min 5 test cases
- Cover: happy path, negative, boundary, validation
- Mark [API] for REST endpoint tests, [UI] for browser tests`;

  const result = await callAgent([{ role: 'user', content: prompt }], 3000);
  console.log(`   ✅ Generated ${result.split('### TC-').length - 1} test cases`);
  return result;
}

// ─── STEP 3: Generate Playwright script ───────────────────────────────────────
const SPEC_TEMPLATE = `
// Reference pattern for Playwright API tests:
import { test, expect } from '@playwright/test';
const BASE = process.env.FPT_API_URL!;
const KEY  = process.env.FPT_API_KEY!;
const FROM = process.env.FPT_FROM!;
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${KEY}\` };

test.describe('Suite Name', () => {
  test('TC_XXX — Test name', async ({ request }) => {
    const res = await request.post(\`\${BASE}/v1/endpoint?from=\${FROM}\`, {
      headers: HEADERS,
      data: { model: 'model-name', messages: [{ role: 'user', content: 'prompt' }],
              streaming: false, max_tokens: 512 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('choices');
    expect(body.choices[0].message.content.length).toBeGreaterThan(0);
  });
});`;

async function generatePlaywrightScript(issue: JiraIssue, testCases: string): Promise<string> {
  console.log(`\n🤖 [3/5] Generating Playwright script with ${CODEGEN_MODEL}...`);

  const prompt = `You are a TypeScript expert. Generate a complete, runnable Playwright test script.

## Jira Issue: ${issue.key} — ${issue.summary}
**Type:** ${issue.issueType}

## Test Cases to Automate:
${testCases}

## Playwright pattern reference:
\`\`\`typescript${SPEC_TEMPLATE}
\`\`\`

## Requirements:
- Output ONLY valid TypeScript code, no markdown, no explanation
- File starts with: // Generated by OpenClaw Agent — ${issue.key}
- Use \`import { test, expect } from '@playwright/test';\`
- Use \`import dotenv from 'dotenv'; dotenv.config();\` (no path — Playwright runs from project root)
- All config via \`process.env\` (FPT_API_URL, FPT_API_KEY, FPT_FROM)
- Only automate test cases marked [API] — skip [UI] and [Manual]
- Each test case → one \`test()\` block
- Test IDs format: TC_${issue.key.replace('-', '_')}_001, _002, ...
- Use \`test.describe('${issue.key} — ${issue.summary}', () => { ... })\`
- If no [API] test cases exist, generate 1 smoke test for the most relevant FPT API endpoint`;

  const raw = await callFPT(CODEGEN_MODEL, [{ role: 'user', content: prompt }], 4000);

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:typescript|ts)?\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();

  console.log(`   ✅ Generated script (${cleaned.split('\n').length} lines)`);
  return cleaned;
}

// ─── STEP 4: Save & run Playwright test ───────────────────────────────────────
interface TestResult {
  passed:   number;
  failed:   number;
  skipped:  number;
  total:    number;
  duration: number;
  failures: { title: string; error: string }[];
  specFile: string;
  reportFile: string;
}

async function runPlaywrightTest(issueKey: string, script: string): Promise<TestResult> {
  console.log(`\n▶️  [4/5] Running Playwright test...`);

  // Save generated spec
  fs.mkdirSync(GEN_DIR, { recursive: true });
  const specFile = path.join(GEN_DIR, `${issueKey}.spec.ts`);
  fs.writeFileSync(specFile, script, 'utf-8');
  console.log(`   📄 Saved spec: ${specFile}`);

  // Report output
  const reportDir = path.join(REPORT_DIR, issueKey);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, 'results.json');

  // Run playwright — use relative path (forward-slash) so testMatch glob works
  const projectRoot = path.resolve(__dirname, '..');
  const relSpecFile = path.relative(projectRoot, specFile).replace(/\\/g, '/');
  const cmd = 'npx';
  const args = [
    'playwright', 'test', relSpecFile,
    '--project=api',
    '--reporter=json',
  ];

  console.log(`   $ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
    encoding: 'utf-8',
    timeout: 120_000,
    shell: true,   // required on Windows — npx is a .cmd script
    stdio: 'pipe', // capture stdout/stderr
  });

  // --reporter=json writes JSON to stdout (PLAYWRIGHT_JSON_OUTPUT_NAME unreliable on Windows).
  // Stdout has dotenv noise before the JSON; find where JSON object starts (last '\n{').
  if (!fs.existsSync(reportFile)) {
    const stdout = result.stdout ?? '';
    const jsonIdx = stdout.lastIndexOf('\n{');
    if (jsonIdx !== -1) {
      try {
        const jsonStr = stdout.slice(jsonIdx + 1).trim();
        JSON.parse(jsonStr); // validate
        fs.mkdirSync(path.dirname(reportFile), { recursive: true });
        fs.writeFileSync(reportFile, jsonStr, 'utf-8');
      } catch { /* stdout wasn't valid JSON */ }
    }
  }
  if (result.stderr) console.error(result.stderr);

  // Parse JSON report
  let parsed: TestResult = { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0, failures: [], specFile, reportFile };
  if (fs.existsSync(reportFile)) {
    try {
      const report: any = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
      parsed.passed   = report.stats?.expected  ?? 0;
      parsed.failed   = report.stats?.unexpected ?? 0;
      parsed.skipped  = report.stats?.skipped    ?? 0;
      parsed.total    = report.stats?.total      ?? 0;
      parsed.duration = Math.round((report.stats?.duration ?? 0) / 1000);
      // Extract failure details
      for (const suite of (report.suites ?? [])) {
        for (const spec of (suite.specs ?? [])) {
          for (const test of (spec.tests ?? [])) {
            if (test.status !== 'expected') {
              const err = test.results?.[0]?.error?.message ?? 'unknown error';
              parsed.failures.push({ title: spec.title, error: err.substring(0, 300) });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`   ⚠️  Could not parse report JSON: ${e}`);
    }
  } else {
    console.warn(`   ⚠️  Report file not found: ${reportFile}`);
  }

  const icon = parsed.failed === 0 ? '✅' : '❌';
  console.log(`   ${icon} Result: ${parsed.passed} passed / ${parsed.failed} failed / ${parsed.skipped} skipped (${parsed.duration}s)`);
  return parsed;
}

// ─── STEP 5: Post results to Jira ────────────────────────────────────────────
async function postResultsToJira(issue: JiraIssue, result: TestResult, testCases: string): Promise<void> {
  console.log(`\n📤 [5/5] Posting results to ${issue.key}...`);

  const status = result.failed === 0 && result.total > 0 ? '✅ PASSED' : result.total === 0 ? '⚠️ NO TESTS' : '❌ FAILED';
  const failureDetails = result.failures.length > 0
    ? `\nh3. ❌ Failures\n` + result.failures.map(f => `- *${f.title}*: ${f.error}`).join('\n')
    : '';

  const comment = `h3. 🤖 OpenClaw Agent — Test Results
_Automated test run for: ${issue.key} — ${issue.summary}_
_Date: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}_
_Models: ${VISION_MODEL} (vision) + ${TC_MODEL} (test cases) + ${CODEGEN_MODEL} (codegen)_

*Status:* ${status}
| ✅ Passed | ❌ Failed | ⏭️ Skipped | Total | Duration |
| ${result.passed} | ${result.failed} | ${result.skipped} | ${result.total} | ${result.duration}s |
${failureDetails}

h3. 📋 Generated Test Cases
{noformat}
${testCases.substring(0, 10000)}
{noformat}

_Playwright spec saved to: tests/api/generated/${issue.key}.spec.ts_`;

  await jiraComment(issue.key, comment);
  console.log(`   ✅ Comment posted to ${JIRA_BASE}/browse/${issue.key}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!ISSUE_KEY) {
    console.error('❌ Usage: npx ts-node utils/openclaw-agent.ts NCPP-XXXX [--post] [--dry]');
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🦅 OpenClaw Agent — ${ISSUE_KEY}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (generate only)' : 'FULL RUN'}${POST_BACK ? ' + POST to Jira' : ''}`);
  console.log(`${'═'.repeat(60)}`);

  // Step 1: Fetch Jira issue
  const issue = await fetchJiraIssue(ISSUE_KEY);

  // Step 2: Generate test cases
  const testCases = await generateTestCases(issue);

  // Step 3: Generate Playwright script
  const script = await generatePlaywrightScript(issue, testCases);

  // Save test cases doc
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const tcFile = path.join(REPORT_DIR, `${ISSUE_KEY}-testcases.md`);
  fs.writeFileSync(tcFile, `# Test Cases — ${ISSUE_KEY}\n**Generated:** ${new Date().toISOString()}\n\n${testCases}`, 'utf-8');
  console.log(`\n💾 Test cases saved: ${tcFile}`);

  if (DRY_RUN) {
    // Save script but do not run
    fs.mkdirSync(GEN_DIR, { recursive: true });
    const specFile = path.join(GEN_DIR, `${ISSUE_KEY}.spec.ts`);
    fs.writeFileSync(specFile, script, 'utf-8');
    console.log(`💾 Script saved: ${specFile}`);
    console.log('\n✅ Dry run complete. Review generated files before running.');
    return;
  }

  // Step 4: Run test
  const result = await runPlaywrightTest(ISSUE_KEY, script);

  // Step 5: Post to Jira (optional)
  if (POST_BACK) {
    await postResultsToJira(issue, result, testCases);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🎉 OpenClaw Agent complete!`);
  console.log(`  Spec: ${result.specFile}`);
  console.log(`  Report: ${result.reportFile}`);
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ OpenClaw Agent Error:', err.message);
  process.exit(1);
});
