/**
 * jira-reporter.ts
 * Reads Playwright test results → Qwen3-32B formats comment → posts to Jira Server.
 * Auto-detects active sprint and updates matching issues.
 *
 * Usage:
 *   npx ts-node utils/jira-reporter.ts
 *   npx ts-node utils/jira-reporter.ts --dry-run   # preview comment only, no post
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────
const JIRA_BASE   = process.env.JIRA_BASE_URL!;
const JIRA_USER   = process.env.JIRA_USERNAME!;
const JIRA_TOKEN  = process.env.JIRA_API_TOKEN!;
const JIRA_SESSION = process.env.JIRA_SESSION;   // cookie fallback for SSO instances
const JIRA_PROJ   = process.env.JIRA_PROJECT_KEY!;
const BOARD_ID    = process.env.JIRA_BOARD_ID!;

const FPT_BASE    = process.env.FPT_API_URL!;
const FPT_KEY     = process.env.FPT_API_KEY!;
const FPT_FROM    = process.env.FPT_FROM!;
const LLM_MODEL   = 'Qwen3-32B';

const DRY_RUN     = process.argv.includes('--dry-run');
const RESULTS_FILE = path.resolve(__dirname, '../reports/test-results.json');

const PROXY = process.env.https_proxy || process.env.HTTPS_PROXY
           || process.env.http_proxy  || process.env.HTTP_PROXY
           || 'http://10.36.252.45:8080';
const proxyDispatcher = new ProxyAgent(PROXY);
const fptDispatcher   = proxyDispatcher;

// Jira Server with SSO: use session cookie. Fallback to Basic Auth.
const jiraHeaders: Record<string, string> = JIRA_SESSION
  ? { 'Cookie': `JSESSIONID=${JIRA_SESSION}`, 'Accept': 'application/json' }
  : { 'Authorization': 'Basic ' + Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64'), 'Accept': 'application/json' };

// ─── Types ────────────────────────────────────────────────────────────────────
interface TestResult {
  title:    string;
  status:   'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors?:  string[];
}

interface Sprint {
  id:    number;
  name:  string;
  state: string;
}

interface JiraIssue {
  key:    string;
  fields: { summary: string; issuetype: { name: string } };
}

// ─── Jira API helpers ────────────────────────────────────────────────────────
async function jiraGet<T>(path: string): Promise<T> {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    headers: jiraHeaders, dispatcher: proxyDispatcher,
  } as any);
  if (!res.ok) throw new Error(`Jira GET ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function jiraPost(path: string, body: object): Promise<any> {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    method:  'POST',
    headers: { ...jiraHeaders, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    dispatcher: proxyDispatcher,
  } as any);
  if (!res.ok) throw new Error(`Jira POST ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Get active sprint ────────────────────────────────────────────────────────
async function getActiveSprint(): Promise<Sprint> {
  const data = await jiraGet<{ values: Sprint[] }>(
    `/rest/agile/1.0/board/${BOARD_ID}/sprint?state=active`
  );
  if (!data.values.length) throw new Error('No active sprint found for board ' + BOARD_ID);
  return data.values[0];
}

// ─── Get issues in sprint that match test/automation ─────────────────────────
async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
  const jql = encodeURIComponent(
    `project = ${JIRA_PROJ} AND sprint = ${sprintId} AND (labels = "automation" OR labels = "test-report" OR summary ~ "automation" OR summary ~ "test") ORDER BY updated DESC`
  );
  const data = await jiraGet<{ issues: JiraIssue[] }>(
    `/rest/api/2/search?jql=${jql}&maxResults=10&fields=summary,issuetype`
  );
  return data.issues;
}

// ─── Parse JSON report ────────────────────────────────────────────────────────
function parseResults(filePath: string): TestResult[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const results: TestResult[] = [];

  function walk(suite: any) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const r = test.results?.[0];
        results.push({
          title:    spec.title,
          status:   r?.status ?? 'skipped',
          duration: r?.duration ?? 0,
          errors:   r?.errors?.map((e: any) => e.message?.replace(/\u001b\[[0-9;]*m/g, '').substring(0, 150)),
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  }
  for (const suite of raw.suites ?? []) walk(suite);
  return results;
}

function buildSummary(results: TestResult[]) {
  const passed  = results.filter(r => r.status === 'passed');
  const failed  = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');
  const avgMs   = passed.length ? Math.round(passed.reduce((s, r) => s + r.duration, 0) / passed.length) : 0;
  const slowest = [...passed].sort((a, b) => b.duration - a.duration).slice(0, 3);
  return { passed, failed, skipped, avgMs, slowest, total: results.length };
}

// ─── Call Qwen3-32B to format Jira comment ───────────────────────────────────
async function formatWithLLM(summary: ReturnType<typeof buildSummary>, sprint: Sprint): Promise<string> {
  const failedList  = summary.failed.map(r => `- [FAIL] ${r.title}: ${r.errors?.[0] ?? 'unknown error'}`).join('\n') || 'None';
  const slowestList = summary.slowest.map(r => `- ${r.title}: ${r.duration}ms`).join('\n') || 'None';

  const prompt = `You are a QA engineer writing a Jira comment for test results on sprint "${sprint.name}".

## Test Results Data:
- Total: ${summary.total} | Passed: ${summary.passed.length} | Failed: ${summary.failed.length} | Skipped: ${summary.skipped.length}
- Pass rate: ${((summary.passed.length / summary.total) * 100).toFixed(1)}%
- Avg response time: ${summary.avgMs}ms

Failed tests:
${failedList}

Slowest passed tests:
${slowestList}

## Task:
Write a professional Jira comment in Vietnamese using Jira wiki markup syntax (not Markdown).
Use these Jira wiki elements: *bold*, {color:red}red text{color}, {color:green}green{color}, ||table headers||, |table cells|, {panel:title=...}...{panel}

Structure:
1. Header panel with sprint name and overall status (PASS/FAIL)
2. Summary table: Total / Passed / Failed / Skipped / Pass rate
3. Failed tests list (if any) with red color
4. Performance notes (slowest models)
5. Short recommendation (1-2 lines)

Output ONLY the Jira wiki markup comment, nothing else.`;

  console.log(`\n🤖 ${LLM_MODEL} đang format Jira comment...\n`);
  const res = await fetch(
    `${FPT_BASE}/v1/chat/completions?from=${FPT_FROM}&model=${LLM_MODEL}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FPT_KEY}` },
      body:    JSON.stringify({
        model:       LLM_MODEL,
        messages:    [{ role: 'user', content: prompt }],
        streaming:   false,
        temperature: 0.1,
        max_tokens:  2048,
      }),
      dispatcher: fptDispatcher,
    } as any
  );
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text()}`);
  const body: any = await res.json();
  const usage = body.usage;
  console.log(`📊 ${LLM_MODEL} tokens — prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}`);
  const raw = body.choices[0].message.content ?? body.choices[0].message.reasoning_content ?? '';
  // Strip <think>...</think> reasoning block from models like Qwen3
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Validate config
  if (!JIRA_BASE || !JIRA_PROJ || !BOARD_ID || (!JIRA_SESSION && !JIRA_TOKEN)) {
    console.error('❌ Missing Jira config in .env (JIRA_BASE_URL, JIRA_PROJECT_KEY, JIRA_BOARD_ID, and JIRA_SESSION or JIRA_API_TOKEN)');
    process.exit(1);
  }
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error(`❌ Test results not found: ${RESULTS_FILE}`);
    console.error('   Run: npm run test:api first');
    process.exit(1);
  }

  console.log('📂 Reading test results...');
  const results = parseResults(RESULTS_FILE);
  const summary = buildSummary(results);
  console.log(`   Total: ${summary.total} | ✅ ${summary.passed.length} | ❌ ${summary.failed.length} | ⏭ ${summary.skipped.length}`);

  console.log('\n🔍 Getting active sprint...');
  const sprint = await getActiveSprint();
  console.log(`   Sprint: [${sprint.id}] ${sprint.name}`);

  console.log('\n🔍 Finding issues in sprint...');
  const issues = await getSprintIssues(sprint.id);

  if (issues.length === 0) {
    console.warn(`\n⚠️  No matching issues found in sprint ${sprint.name}`);
    console.warn('   Make sure issues have label "automation" or "test-report", or summary contains "automation"/"test"');
    console.warn('   You can also set JIRA_ISSUE_KEY=XXX-123 in .env to target a specific issue');
  } else {
    console.log(`   Found ${issues.length} issue(s):`);
    issues.forEach(i => console.log(`   - ${i.key}: ${i.fields.summary}`));
  }

  const comment = await formatWithLLM(summary, sprint);

  console.log('\n' + '─'.repeat(60));
  console.log('📝 Jira Comment Preview:');
  console.log('─'.repeat(60));
  console.log(comment);
  console.log('─'.repeat(60));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — comment not posted. Remove --dry-run to post.');
    return;
  }

  // Determine target issues
  const envIssueKey = process.env.JIRA_ISSUE_KEY;
  const targetKeys: string[] = envIssueKey
    ? [envIssueKey]
    : issues.map(i => i.key);

  if (targetKeys.length === 0) {
    console.error('\n❌ No target issues to comment on. Set JIRA_ISSUE_KEY in .env or add label "automation"/"test-report" to sprint issues.');
    process.exit(1);
  }

  console.log(`\n📤 Posting comment to ${targetKeys.length} issue(s)...`);
  for (const key of targetKeys) {
    await jiraPost(`/rest/api/2/issue/${key}/comment`, { body: comment });
    console.log(`   ✅ Posted to ${key} — ${JIRA_BASE}/browse/${key}`);
  }

  console.log('\n🎉 Done!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
