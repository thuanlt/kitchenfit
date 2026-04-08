/**
 * agents/jira-agent.ts
 * Pipeline: Jira ticket → Vision analysis → Test Cases → Playwright script → Run → Update Jira
 *
 * Models:
 *   Vision:   gemma-3-27b-it          (VN site — mô tả UI/images từ Jira)
 *   TC Gen:   Nemotron-3-Super-120B   (JP PROD — sinh test case, coverage rộng)
 *   Codegen:  gpt-oss-120b            (VN site — gen Playwright script)
 *
 * Usage:
 *   npx ts-node agents/jira-agent.ts NCPP-XXXX
 *   npx ts-node agents/jira-agent.ts NCPP-XXXX --post     # post results to Jira
 *   npx ts-node agents/jira-agent.ts NCPP-XXXX --dry      # generate only, don't run
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fetch, ProxyAgent } from 'undici';
import { callFptModel, callFptWithFallback } from '../tools/fpt-client';
import { startAgentTrace, flushLangfuse } from '../tools/langfuse-client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ────────────────────────────────────────────────────────────────────
const JIRA_BASE    = process.env.JIRA_BASE_URL!;
const JIRA_SESSION = process.env.JIRA_SESSION!;

const FPT_BASE    = process.env.FPT_API_URL!;
const FPT_KEY     = process.env.FPT_API_KEY!;
const FPT_FROM    = process.env.FPT_FROM!;
const FPT_JP_BASE = process.env.FPT_JP_API_URL!;
const FPT_JP_KEY  = process.env.FPT_JP_API_KEY!;

const VISION_MODEL  = 'gemma-3-27b-it';
const TC_MODEL      = 'Nemotron-3-Super-120B-A12B';
const CODEGEN_MODEL = 'gpt-oss-120b';

const ISSUE_KEY  = process.argv[2];
const POST_BACK  = process.argv.includes('--post');
const DRY_RUN    = process.argv.includes('--dry');
const REPORT_DIR = path.resolve(__dirname, '../reports/openclaw');
const GEN_DIR    = path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace/src/tests/api/generated');

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
const proxy = PROXY ? new ProxyAgent(PROXY) : undefined;

// ── Jira helpers ──────────────────────────────────────────────────────────────
const jiraHeaders: Record<string, string> = {
  'Cookie': `JSESSIONID=${JIRA_SESSION}`,
  'Accept': 'application/json',
};

async function fetchJiraIssue(key: string) {
  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}?expand=renderedFields`, {
    headers: jiraHeaders,
    ...(proxy ? { dispatcher: proxy } : {}),
  } as any);
  if (!res.ok) throw new Error(`Jira fetch failed: ${res.status}`);
  return res.json() as Promise<any>;
}

async function postJiraComment(key: string, body: string) {
  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}/comment`, {
    method:  'POST',
    headers: { ...jiraHeaders, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ body }),
    ...(proxy ? { dispatcher: proxy } : {}),
  } as any);
  if (!res.ok) console.error(`Failed to post comment: ${res.status}`);
}

// ── FPT call (direct, with override base/key) ─────────────────────────────────
async function callModel(
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  opts: { base?: string; key?: string; maxTokens?: number } = {},
): Promise<string> {
  const base = opts.base ?? FPT_BASE;
  const key  = opts.key  ?? FPT_KEY;
  const fromQ = FPT_FROM ? `?from=${FPT_FROM}` : '';

  const fetchOpts: any = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, streaming: false, max_tokens: opts.maxTokens ?? 2048, temperature: 0.3 }),
  };
  if (proxy) fetchOpts.dispatcher = proxy;

  const res = await fetch(`${base}/v1/chat/completions${fromQ}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

// ── Pipeline steps ────────────────────────────────────────────────────────────

async function analyzeIssue(issue: any): Promise<string> {
  console.log('\n[1/4] 🔍 Vision: analyzing Jira issue...');
  const description = issue.renderedFields?.description ?? issue.fields?.description ?? '';
  const summary     = issue.fields?.summary ?? '';

  return callModel(VISION_MODEL, [
    { role: 'system', content: 'Bạn là QA analyst. Phân tích Jira ticket và tóm tắt: mục tiêu, luồng chính, edge cases cần test.' },
    { role: 'user',   content: `Summary: ${summary}\n\nDescription:\n${description}` },
  ]);
}

async function generateTestCases(analysis: string, issueKey: string): Promise<string> {
  console.log('\n[2/4] 📋 TC Generator: creating test cases...');
  return callModel(TC_MODEL, [
    {
      role: 'system',
      content: 'Bạn là Senior QA Engineer. Sinh test cases đầy đủ theo format: TC_ID | Title | Steps | Expected Result | Priority',
    },
    {
      role: 'user',
      content: `Jira: ${issueKey}\n\nAnalysis:\n${analysis}\n\nGenerate comprehensive test cases.`,
    },
  ], { base: FPT_JP_BASE, key: FPT_JP_KEY, maxTokens: 3000 });
}

async function generatePlaywrightScript(testCases: string, issueKey: string): Promise<string> {
  console.log('\n[3/4] ⚙️  Codegen: generating Playwright script...');
  const { content } = await callFptWithFallback([
    {
      role: 'system',
      content: `You are an expert Playwright TypeScript engineer.
Generate a complete, runnable test file for the given test cases.
Use @playwright/test, include proper assertions, selectors, and error handling.
Return ONLY the TypeScript code.`,
    },
    {
      role: 'user',
      content: `Jira: ${issueKey}\n\nTest Cases:\n${testCases}\n\nURL: ${process.env.BASE_URL ?? 'https://marketplace.fptcloud.com'}`,
    },
  ], { maxTokens: 4096, models: [CODEGEN_MODEL, ...['Kimi-K2.5', 'GLM-4.7', 'Qwen2.5-Coder-32B-Instruct']] });
  return content;
}

function runPlaywrightTest(scriptPath: string): { passed: number; failed: number; output: string } {
  console.log('\n[4/4] 🚀 Running Playwright test...');
  const result = spawnSync(
    'npx', ['playwright', 'test', scriptPath, '--reporter=list'],
    { cwd: path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace'), encoding: 'utf-8', shell: true },
  );
  const output  = (result.stdout ?? '') + (result.stderr ?? '');
  const passed  = (output.match(/✓/g) ?? []).length;
  const failed  = (output.match(/✗|×/g) ?? []).length;
  return { passed, failed, output };
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (!ISSUE_KEY) {
  console.error('Usage: npx ts-node agents/jira-agent.ts NCPP-XXXX [--post] [--dry]');
  process.exit(1);
}

(async () => {
  if (!JIRA_BASE || !JIRA_SESSION) {
    console.error('❌ Missing JIRA_BASE_URL or JIRA_SESSION in .env');
    process.exit(1);
  }

  console.log(`\n🤖 Jira Agent — ${ISSUE_KEY}`);
  console.log('─'.repeat(50));

  const trace = startAgentTrace('jira-agent', { issueKey: ISSUE_KEY, dryRun: DRY_RUN });

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(GEN_DIR,    { recursive: true });

  const issue     = await fetchJiraIssue(ISSUE_KEY);
  const analysis  = await analyzeIssue(issue);
  const testCases = await generateTestCases(analysis, ISSUE_KEY);
  const script    = await generatePlaywrightScript(testCases, ISSUE_KEY);

  // Save outputs
  const tcFile     = path.join(REPORT_DIR, `${ISSUE_KEY}-testcases.md`);
  const scriptFile = path.join(GEN_DIR, `${ISSUE_KEY}.spec.ts`);
  fs.writeFileSync(tcFile,     `# ${ISSUE_KEY} — Test Cases\n\n${testCases}`);
  fs.writeFileSync(scriptFile, script);
  console.log(`\n✅ Test cases: ${tcFile}`);
  console.log(`✅ Script:     ${scriptFile}`);

  if (!DRY_RUN) {
    const { passed, failed, output } = runPlaywrightTest(scriptFile);
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    if (POST_BACK) {
      const comment = `*Jira Agent Test Results — ${ISSUE_KEY}*\n\n✅ Passed: ${passed} | ❌ Failed: ${failed}\n\nScript: \`${scriptFile}\`\n\n{code}\n${output.substring(0, 500)}\n{code}`;
      await postJiraComment(ISSUE_KEY, comment);
      console.log('\n📤 Posted results to Jira');
    }
  }

  await flushLangfuse();
  trace.update({ output: `passed: ${DRY_RUN ? 'dry-run' : 'ran'}` });
  process.exit(0);
})().catch(err => { console.error('❌ jira-agent error:', err.message); process.exit(1); });
