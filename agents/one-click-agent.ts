/**
 * agents/one-click-agent.ts  —  Trụ Cột 2: One-Click Automation
 *
 * Pipeline: TCs (JSON/text) → Phân tích → Tạo Script → Chạy → Self-Healing → Báo cáo đa kênh
 *
 * 4 bước:
 *   1. Phân tích: đọc TCs, plan execution, xác định selectors cần thiết
 *   2. Tạo Script: gen Playwright spec file từ TCs
 *   3. Chạy Test: execute, capture results + screenshots
 *   4. Báo cáo: Slack + Jira comment + console
 *
 * Self-healing loop (tối đa MAX_HEAL_ROUNDS):
 *   Nếu test fail → AI phân tích error + screenshot → patch script → retry
 *
 * Usage:
 *   npx ts-node agents/one-click-agent.ts --tcs reports/mbt/NCPP-1234.json
 *   npx ts-node agents/one-click-agent.ts --tcs reports/mbt/NCPP-1234.json --url https://stg.marketplace.fpt.ai
 *   npx ts-node agents/one-click-agent.ts --tcs reports/mbt/NCPP-1234.json --no-heal --no-slack
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fetch, ProxyAgent } from 'undici';
import https from 'https';
import http from 'http';
import { callFptModel, callFptWithFallback } from '../tools/fpt-client';
import { startAgentTrace, flushLangfuse } from '../tools/langfuse-client';
import type { MBTOutput, TestCase } from './mbt-agent';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE_URL      = process.env.BASE_URL ?? 'https://marketplace.fptcloud.com/en';
const TEST_EMAIL    = process.env.TEST_USER_EMAIL ?? '';
const TEST_PASS     = process.env.TEST_USER_PASSWORD ?? '';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL ?? '';
const JIRA_BASE     = process.env.JIRA_BASE_URL ?? '';
const JIRA_SESSION  = process.env.JIRA_SESSION ?? '';
const FPT_FROM      = process.env.FPT_FROM ?? '';
const PROXY         = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
const MAX_HEAL_ROUNDS = 2;

const MODEL_CODEGEN = 'Kimi-K2.5';
const MODEL_HEAL    = 'GLM-5.1';
const MODEL_REPORT  = 'Qwen3-32B';

const args      = process.argv.slice(2);
const tcsFile   = args[args.indexOf('--tcs') + 1] as string | undefined;
const urlArg    = args[args.indexOf('--url') + 1] as string | undefined ?? BASE_URL;
const noHeal    = args.includes('--no-heal');
const noSlack   = args.includes('--no-slack');
const noJira    = args.includes('--no-jira');

const WORKSPACE  = path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace');
const GEN_DIR    = path.join(WORKSPACE, 'src/tests/e2e/generated');
const REPORT_DIR = path.join(WORKSPACE, 'reports/playwright');
const OUT_DIR    = path.resolve(__dirname, '../reports/one-click');

const proxy = PROXY ? new ProxyAgent(PROXY) : undefined;

// ── Types ─────────────────────────────────────────────────────────────────────
interface RunResult {
  total:    number;
  passed:   number;
  failed:   number;
  skipped:  number;
  duration: number;
  failures: Array<{ tcId: string; error: string; screenshotPath?: string }>;
  reportPath?: string;
}

interface OneClickOutput {
  source:        string;
  run_at:        string;
  url:           string;
  script_path:   string;
  heal_rounds:   number;
  result:        RunResult;
  ai_summary:    string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
async function callFpt(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { maxTokens?: number } = {},
): Promise<string> {
  const base  = process.env.FPT_API_URL!;
  const key   = process.env.FPT_API_KEY!;
  const fromQ = FPT_FROM ? `?from=${FPT_FROM}` : '';

  const fetchOpts: any = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, streaming: false, max_tokens: opts.maxTokens ?? 4096, temperature: 0.15 }),
  };
  if (proxy) fetchOpts.dispatcher = proxy;

  const res = await fetch(`${base}/v1/chat/completions${fromQ}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function loadTestCases(file: string): { tcs: TestCase[]; source: string } {
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    const mbt: MBTOutput = JSON.parse(raw);
    return { tcs: mbt.test_cases, source: mbt.source };
  } catch {
    // fallback: nếu là plain text, parse thủ công
    return { tcs: [], source: path.basename(file, '.json') };
  }
}

// ── Step 1: Phân tích TCs ──────────────────────────────────────────────────────
async function analyzeTCs(tcs: TestCase[], url: string): Promise<string> {
  console.log('\n[1/4] Phân tích test cases và planning...');
  return callFpt(MODEL_CODEGEN, [
    {
      role: 'system',
      content: `Bạn là Playwright automation architect. Phân tích TCs và lập kế hoạch:
1. Nhóm TCs theo flow/feature
2. Xác định selectors phổ biến cần dùng (aria-label, role, testid)
3. Xác định shared fixtures cần thiết (login, setup)
4. Thứ tự execution tối ưu (smoke trước, regression sau)

Trả về JSON:
{
  "execution_order": ["TC-ID-001", "TC-ID-002"],
  "shared_fixtures": ["login", "navigate_to_feature"],
  "suggested_selectors": { "login_button": "getByRole('button', {name: /login/i})", ... },
  "groups": { "smoke": ["TC-ID-001"], "regression": ["TC-ID-002", "TC-ID-003"] }
}`,
    },
    {
      role: 'user',
      content: `URL: ${url}\n\nTest Cases:\n${JSON.stringify(tcs.map(tc => ({ id: tc.id, title: tc.title, scenario: tc.scenario, type: tc.type })), null, 2)}`,
    },
  ], { maxTokens: 2000 });
}

// ── Step 2: Tạo Script ─────────────────────────────────────────────────────────
async function generateScript(tcs: TestCase[], plan: string, url: string, source: string): Promise<string> {
  console.log('\n[2/4] Tạo Playwright script...');
  const { content } = await callFptWithFallback([
    {
      role: 'system',
      content: `Bạn là Playwright TypeScript expert.
Tạo một file spec hoàn chỉnh, chạy được ngay.

Quy tắc:
- Import: import { test, expect } from '@playwright/test'
- Dùng getByRole > getByLabel > getByTestId > getByText (ưu tiên theo thứ tự)
- KHÔNG hardcode selector CSS nếu có thể dùng ARIA
- Mỗi test case = 1 test() block với ID trong tên
- Có beforeEach nếu cần login
- Dùng await page.waitForLoadState('networkidle') sau navigation
- Timeout test: 30000ms
- Có expect assertions cụ thể (không chỉ toBeVisible)
- Trả về ONLY TypeScript code, không markdown wrapper`,
    },
    {
      role: 'user',
      content: `Source: ${source}
URL: ${url}
Email: ${TEST_EMAIL}
Password: ${TEST_PASS}

Execution Plan:
${plan}

Test Cases (BDD):
${JSON.stringify(tcs, null, 2)}`,
    },
  ], { maxTokens: 6000, models: [MODEL_CODEGEN, 'GLM-5.1', 'Qwen2.5-Coder-32B-Instruct'] });
  return content;
}

// ── Step 3: Chạy Test ─────────────────────────────────────────────────────────
function runTests(scriptPath: string): RunResult {
  console.log('\n[3/4] Chạy tests...');
  const start = Date.now();

  const result = spawnSync(
    'npx', ['playwright', 'test', scriptPath,
      '--reporter=json',
      `--output=${path.join(REPORT_DIR, 'screenshots')}`,
    ],
    {
      cwd: WORKSPACE,
      encoding: 'utf-8',
      shell: true,
      timeout: 300_000,
      env: { ...process.env, CI: '1' },
    },
  );

  const duration = Date.now() - start;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';

  // Parse JSON reporter output
  let passed = 0, failed = 0, skipped = 0;
  const failures: RunResult['failures'] = [];
  let reportPath: string | undefined;

  try {
    const jsonMatch = stdout.match(/\{[\s\S]*"stats"[\s\S]*\}/);
    if (jsonMatch) {
      const report = JSON.parse(jsonMatch[0]);
      passed  = report.stats?.expected  ?? 0;
      failed  = report.stats?.unexpected ?? 0;
      skipped = report.stats?.skipped    ?? 0;

      // Extract failure details
      const extractFailures = (suites: any[]) => {
        for (const s of suites ?? []) {
          for (const spec of s.specs ?? []) {
            for (const t of spec.tests ?? []) {
              if (t.status !== 'expected') {
                const err = t.results?.[0]?.error?.message ?? 'Unknown error';
                const screenshot = t.results?.[0]?.attachments?.find((a: any) => a.name === 'screenshot')?.path;
                failures.push({ tcId: spec.title.match(/TC-\w+-\d+/)?.[0] ?? spec.title, error: err.substring(0, 300), screenshotPath: screenshot });
              }
            }
          }
          extractFailures(s.suites);
        }
      };
      extractFailures(report.suites ?? []);

      // Save report
      reportPath = path.join(REPORT_DIR, `run-${Date.now()}.json`);
      fs.mkdirSync(REPORT_DIR, { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    }
  } catch {
    // Fallback: parse từ text output
    passed  = (stdout.match(/\d+ passed/)?.[0]?.match(/\d+/)?.[0] ?? '0') as unknown as number;
    failed  = (stdout.match(/\d+ failed/)?.[0]?.match(/\d+/)?.[0] ?? '0') as unknown as number;
    skipped = (stdout.match(/\d+ skipped/)?.[0]?.match(/\d+/)?.[0] ?? '0') as unknown as number;
  }

  const total = passed + failed + skipped;
  console.log(`  Results: ${passed} passed | ${failed} failed | ${skipped} skipped | ${(duration/1000).toFixed(1)}s`);
  return { total, passed, failed, skipped, duration, failures, reportPath };
}

// ── Self-Healing Loop ─────────────────────────────────────────────────────────
async function selfHeal(
  scriptPath: string,
  failures: RunResult['failures'],
  round: number,
): Promise<boolean> {
  if (failures.length === 0 || round > MAX_HEAL_ROUNDS) return false;

  console.log(`\n  Self-Healing round ${round}/${MAX_HEAL_ROUNDS}...`);

  const currentScript = fs.readFileSync(scriptPath, 'utf-8');
  const failureContext = failures.map(f =>
    `TC: ${f.tcId}\nError: ${f.error}${f.screenshotPath ? `\nScreenshot: ${f.screenshotPath}` : ''}`,
  ).join('\n\n');

  const patched = await callFpt(MODEL_HEAL, [
    {
      role: 'system',
      content: `Bạn là Playwright debugger. Phân tích lỗi test và patch script.

Nguyên nhân lỗi thường gặp:
1. Selector đã thay đổi → dùng selector linh hoạt hơn (regex, role)
2. Timeout → tăng timeout hoặc thêm waitFor
3. Element chưa load → thêm waitForLoadState hoặc waitForSelector
4. Navigation redirect → cập nhật URL
5. Auth expired → thêm re-login

Trả về TOÀN BỘ script đã được sửa (không chỉ diff). ONLY TypeScript code.`,
    },
    {
      role: 'user',
      content: `Failures:\n${failureContext}\n\nCurrent script:\n${currentScript}`,
    },
  ], { maxTokens: 6000 });

  if (patched && patched.length > 100) {
    // Backup original
    fs.copyFileSync(scriptPath, `${scriptPath}.bak${round}`);
    // Extract code block nếu có markdown wrapper
    const codeMatch = patched.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    fs.writeFileSync(scriptPath, codeMatch ? codeMatch[1] : patched);
    console.log(`  Script patched, retrying...`);
    return true;
  }
  return false;
}

// ── Step 4: Báo cáo đa kênh ───────────────────────────────────────────────────
async function generateAISummary(output: OneClickOutput): Promise<string> {
  return callFpt(MODEL_REPORT, [
    {
      role: 'system',
      content: 'Bạn là QA Lead. Viết tóm tắt kết quả test ngắn gọn (3-5 câu), nêu rõ vấn đề nếu có failures.',
    },
    {
      role: 'user',
      content: JSON.stringify({ result: output.result, url: output.url, heal_rounds: output.heal_rounds }),
    },
  ], { maxTokens: 500 });
}

async function postSlack(output: OneClickOutput) {
  if (!SLACK_WEBHOOK) return;

  const passed  = output.result.passed;
  const failed  = output.result.failed;
  const total   = output.result.total;
  const rate    = total > 0 ? Math.round(passed / total * 100) : 0;
  const icon    = failed === 0 ? '' : failed > total / 2 ? '' : '⚠️';

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `${icon} One-Click Test — ${output.source}` } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Passed:* ${passed}/${total} (${rate}%)` },
        { type: 'mrkdwn', text: `*Failed:* ${failed}` },
        { type: 'mrkdwn', text: `*URL:* ${output.url}` },
        { type: 'mrkdwn', text: `*Duration:* ${(output.result.duration / 1000).toFixed(1)}s` },
        { type: 'mrkdwn', text: `*Self-heal rounds:* ${output.heal_rounds}` },
        { type: 'mrkdwn', text: `*Run at:* ${output.run_at}` },
      ],
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*AI Summary:*\n${output.ai_summary}` } },
  ];

  if (output.result.failures.length > 0) {
    const failList = output.result.failures.slice(0, 5)
      .map(f => `• *${f.tcId}*: ${f.error.substring(0, 120)}`)
      .join('\n');
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Failures:*\n${failList}` } });
  }

  const body = JSON.stringify({ blocks });
  const url  = new URL(SLACK_WEBHOOK);
  const options = {
    hostname: url.hostname,
    path:     url.pathname + url.search,
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  };

  await new Promise<void>((resolve) => {
    const req = (PROXY ? http : https).request(options, (res) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', (e) => { console.warn(`  Slack error: ${e.message}`); resolve(); });
    req.write(body);
    req.end();
  });
  console.log('  Posted to Slack');
}

async function postJiraComment(source: string, output: OneClickOutput) {
  if (!JIRA_BASE || !JIRA_SESSION) return;
  const jiraKey = source.match(/[A-Z]+-\d+/)?.[0];
  if (!jiraKey) return;

  const passed = output.result.passed;
  const failed = output.result.failed;
  const icon   = failed === 0 ? '(/)' : '(x)';

  const lines = [
    `*[One-Click Agent] Test Results — ${jiraKey}* ${icon}`,
    `Run at: ${output.run_at} | URL: ${output.url}`,
    `*Passed:* ${passed} | *Failed:* ${failed} | *Heal rounds:* ${output.heal_rounds}`,
    '',
    output.ai_summary,
  ];

  if (output.result.failures.length > 0) {
    lines.push('', '*Failures:*');
    for (const f of output.result.failures.slice(0, 5)) {
      lines.push(`* ${f.tcId}: ${f.error.substring(0, 200)}`);
    }
  }

  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${jiraKey}/comment`, {
    method: 'POST',
    headers: { 'Cookie': `JSESSIONID=${JIRA_SESSION}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: lines.join('\n') }),
    ...(proxy ? { dispatcher: proxy } : {}),
  } as any);

  if (!res.ok) console.warn(`  Jira comment failed: ${res.status}`);
  else console.log(`  Posted to Jira ${jiraKey}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  if (!tcsFile) {
    console.error('Usage: npx ts-node agents/one-click-agent.ts --tcs reports/mbt/NCPP-1234.json [--url https://...] [--no-heal] [--no-slack]');
    process.exit(1);
  }

  console.log('\n One-Click Automation — Trụ Cột 2');
  console.log('─'.repeat(50));

  const trace = startAgentTrace('one-click-agent', { tcsFile, url: urlArg });
  const { tcs, source } = loadTestCases(path.resolve(tcsFile));

  if (tcs.length === 0) {
    console.error('No test cases found in file');
    process.exit(1);
  }
  console.log(`Loaded ${tcs.length} TCs from ${source}`);

  fs.mkdirSync(GEN_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Step 1: Phân tích
  const planRaw = await analyzeTCs(tcs, urlArg);

  // Step 2: Tạo script
  const script      = await generateScript(tcs, planRaw, urlArg, source);
  const codeMatch   = script.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
  const cleanScript = codeMatch ? codeMatch[1] : script;
  const scriptName  = `${source.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}.spec.ts`;
  const scriptPath  = path.join(GEN_DIR, scriptName);
  fs.writeFileSync(scriptPath, cleanScript);
  console.log(`\n Script: ${scriptPath}`);

  // Step 3: Chạy + self-healing loop
  let runResult  = runTests(scriptPath);
  let healRounds = 0;

  if (!noHeal) {
    while (runResult.failed > 0 && healRounds < MAX_HEAL_ROUNDS) {
      const healed = await selfHeal(scriptPath, runResult.failures, healRounds + 1);
      if (!healed) break;
      healRounds++;
      runResult = runTests(scriptPath);
    }
  }

  // AI summary
  const output: OneClickOutput = {
    source,
    run_at:      new Date().toISOString(),
    url:         urlArg,
    script_path: scriptPath,
    heal_rounds: healRounds,
    result:      runResult,
    ai_summary:  '',
  };
  output.ai_summary = await generateAISummary(output);

  // Step 4: Báo cáo
  console.log('\n[4/4] Báo cáo đa kênh...');
  const outFile = path.join(OUT_DIR, `${source}-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(` Report: ${outFile}`);

  if (!noSlack) await postSlack(output);
  if (!noJira)  await postJiraComment(source, output);

  // Console summary
  const rate = output.result.total > 0 ? Math.round(output.result.passed / output.result.total * 100) : 0;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(` ${output.result.passed}/${output.result.total} passed (${rate}%) — ${(output.result.duration/1000).toFixed(1)}s`);
  console.log(` Self-heal: ${healRounds} round(s)`);
  console.log(`\n AI: ${output.ai_summary}`);

  await flushLangfuse();
  trace.update({ output: `passed=${output.result.passed}, failed=${output.result.failed}` });
  process.exit(output.result.failed > 0 ? 1 : 0);
})().catch(err => {
  console.error('\n one-click-agent error:', err.message);
  process.exit(1);
});
