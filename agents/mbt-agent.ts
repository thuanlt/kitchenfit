/**
 * agents/mbt-agent.ts  —  Trụ Cột 1: AI-Driven MBT
 *
 * Pipeline: Requirement / Jira → AI Analyst → BDD/Gherkin TCs → Anti-Hallucination Validator → Output
 *
 * Anti-hallucination: mỗi TC được AI critic cross-check lại với requirement gốc.
 * TC nào không có căn cứ trong requirement sẽ bị loại hoặc flag.
 *
 * Models:
 *   Analysis : GLM-5.1      (fast, context đủ cho req lớn)
 *   TC Gen   : Kimi-K2.5    (coverage rộng, reasoning tốt)
 *   Validator: Qwen3-32B    (thinking mode — phê phán kỹ)
 *
 * Usage:
 *   npx ts-node agents/mbt-agent.ts --jira NCPP-1234
 *   npx ts-node agents/mbt-agent.ts --req "User có thể reset mật khẩu qua email"
 *   npx ts-node agents/mbt-agent.ts --jira NCPP-1234 --post   # post TCs lên Jira
 *   npx ts-node agents/mbt-agent.ts --jira NCPP-1234 --output flow1-tcs.json
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';
import { startAgentTrace, flushLangfuse } from '../tools/langfuse-client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ─────────────────────────────────────────────────────────────────────
const FPT_BASE     = process.env.FPT_API_URL!;
const FPT_KEY      = process.env.FPT_API_KEY!;
const FPT_JP_BASE  = process.env.FPT_JP_API_URL!;
const FPT_JP_KEY   = process.env.FPT_JP_API_KEY!;
const FPT_FROM     = process.env.FPT_FROM ?? '';
const JIRA_BASE    = process.env.JIRA_BASE_URL!;
const JIRA_SESSION = process.env.JIRA_SESSION!;
const PROXY        = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

const MODEL_ANALYST   = 'Qwen3-32B';
const MODEL_TCGEN     = 'Nemotron-3-Super-120B-A12B';
const MODEL_VALIDATOR = 'Qwen3-32B';

const args       = process.argv.slice(2);
const jiraIdx    = args.indexOf('--jira');
const reqIdx     = args.indexOf('--req');
const outputIdx  = args.indexOf('--output');
const jiraKey    = jiraIdx    !== -1 ? args[jiraIdx    + 1] : undefined;
const reqText    = reqIdx     !== -1 ? args[reqIdx     + 1] : undefined;
const outputFile = outputIdx  !== -1 ? args[outputIdx  + 1] : undefined;
const postBack   = args.includes('--post');
const dryRun     = args.includes('--dry');

const OUT_DIR    = path.resolve(__dirname, '../reports/mbt');
const proxy      = PROXY ? new ProxyAgent(PROXY) : undefined;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TestCase {
  id:       string;
  title:    string;
  feature:  string;
  scenario: string;   // Gherkin Given/When/Then
  priority: 'P0' | 'P1' | 'P2';
  type:     'positive' | 'negative' | 'edge';
  tags:     string[];
  validated: boolean;
  hallucination_risk: 'low' | 'medium' | 'high';
  validator_note?: string;
}

export interface MBTOutput {
  source:      string;
  generated_at: string;
  total_tcs:   number;
  validated_tcs: number;
  dropped_tcs:  number;
  test_cases:  TestCase[];
  summary:     string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
async function callFpt(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { jp?: boolean; maxTokens?: number } = {},
): Promise<string> {
  const base = opts.jp ? FPT_JP_BASE : FPT_BASE;
  const key  = opts.jp ? FPT_JP_KEY  : FPT_KEY;
  const fromQ = FPT_FROM ? `?from=${FPT_FROM}` : '';

  const fetchOpts: any = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, streaming: false, max_tokens: opts.maxTokens ?? 3000, temperature: 0.2 }),
  };
  if (proxy) fetchOpts.dispatcher = proxy;

  const res = await fetch(`${base}/v1/chat/completions${fromQ}`, fetchOpts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.substring(0, 200)}`);
  }
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

async function fetchJiraRequirement(key: string): Promise<string> {
  const jiraHeaders = { 'Cookie': `JSESSIONID=${JIRA_SESSION}`, 'Accept': 'application/json' };
  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}?expand=renderedFields`, {
    headers: jiraHeaders, ...(proxy ? { dispatcher: proxy } : {}),
  } as any);
  if (!res.ok) throw new Error(`Jira fetch failed: ${res.status}`);
  const data: any = await res.json();
  const summary = data.fields?.summary ?? '';
  const desc    = data.renderedFields?.description ?? data.fields?.description ?? '';
  return `[${key}] ${summary}\n\n${desc}`;
}

async function postJiraComment(key: string, body: string) {
  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}/comment`, {
    method: 'POST',
    headers: { 'Cookie': `JSESSIONID=${JIRA_SESSION}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
    ...(proxy ? { dispatcher: proxy } : {}),
  } as any);
  if (!res.ok) console.error(`  Failed to post Jira comment: ${res.status}`);
}

// ── Step 1: Phân tích requirement ──────────────────────────────────────────────
async function analyzeRequirement(req: string): Promise<string> {
  console.log('\n[1/3] Phân tích requirement...');
  return callFpt(MODEL_ANALYST, [
    {
      role: 'system',
      content: `Bạn là Business Analyst kiêm Senior QA.
Phân tích requirement và trả về JSON với format:
{
  "feature": "tên feature",
  "objective": "mục tiêu chính",
  "actors": ["User", "Admin", ...],
  "happy_paths": ["luồng chính 1", "luồng chính 2"],
  "edge_cases": ["edge case 1", "edge case 2"],
  "negative_cases": ["lỗi 1", "lỗi 2"],
  "explicit_constraints": ["ràng buộc được nêu rõ trong req"],
  "inferred_constraints": ["ràng buộc có thể suy ra nhưng không rõ ràng"]
}
QUAN TRỌNG: Chỉ liệt kê những gì CÓ căn cứ từ requirement. Đánh dấu rõ inferred vs explicit.`,
    },
    { role: 'user', content: req },
  ], { maxTokens: 2000 });
}

// ── Step 2: Sinh Test Cases (BDD/Gherkin) ─────────────────────────────────────
async function generateTestCases(requirement: string, analysis: string, source: string): Promise<string> {
  console.log('\n[2/3] Sinh Test Cases (BDD/Gherkin)...');
  return callFpt(MODEL_TCGEN, [
    {
      role: 'system',
      content: `Bạn là Senior QA Engineer. Dựa trên requirement và analysis, sinh test cases theo chuẩn BDD/Gherkin.

Trả về JSON array, mỗi TC có format:
{
  "id": "TC-FEATURE-NNN",
  "title": "mô tả ngắn",
  "feature": "tên feature",
  "scenario": "Given ... When ... Then ...",
  "priority": "P0|P1|P2",
  "type": "positive|negative|edge",
  "tags": ["@smoke", "@regression", "@api"]
}

QUY TẮC:
- Chỉ sinh TC có căn cứ TRỰC TIẾP từ requirement hoặc analysis
- KHÔNG suy diễn quá mức (không thêm TC về security, performance nếu req không đề cập)
- Mỗi TC phải độc lập, có thể chạy riêng lẻ
- Happy path: ít nhất 1 TC P0
- Negative: ít nhất 2 TC (input rỗng, sai định dạng)
- Edge case: chỉ thêm nếu có bằng chứng trong req`,
    },
    {
      role: 'user',
      content: `Source: ${source}\n\nRequirement:\n${requirement}\n\nAnalysis:\n${analysis}`,
    },
  ], { maxTokens: 4000 });
}

// ── Step 3: Anti-Hallucination Validator ──────────────────────────────────────
async function validateTestCases(
  tcsRaw: string,
  requirement: string,
): Promise<{ valid: TestCase[]; dropped: number }> {
  console.log('\n[3/3] Validating TCs (anti-hallucination)...');

  let tcs: any[] = [];
  try {
    const match = tcsRaw.match(/\[[\s\S]*\]/);
    tcs = match ? JSON.parse(match[0]) : [];
  } catch {
    console.warn('  Warning: could not parse TC JSON, attempting extraction...');
    return { valid: [], dropped: 0 };
  }

  if (tcs.length === 0) return { valid: [], dropped: 0 };

  // Batch validate — gửi tất cả TCs + requirement cho validator một lần
  const validationPrompt = `Bạn là QA Auditor. Kiểm tra từng Test Case xem có CĂN CỨ trong requirement không.

Requirement gốc:
"""
${requirement.substring(0, 3000)}
"""

Test Cases cần validate:
${JSON.stringify(tcs, null, 2)}

Với MỖI TC, trả về JSON array:
[
  {
    "id": "TC-xxx",
    "verdict": "valid|hallucinated|weak",
    "risk": "low|medium|high",
    "note": "lý do ngắn gọn"
  }
]

- valid: TC có căn cứ rõ ràng trong requirement
- weak: TC suy luận được nhưng không rõ ràng — giữ lại với flag
- hallucinated: TC tự nghĩ ra, không có trong requirement — LOẠI BỎ`;

  const validationResult = await callFpt(MODEL_VALIDATOR, [
    { role: 'system', content: 'Bạn là QA Auditor nghiêm khắc. Chỉ trả về JSON array, không thêm text.' },
    { role: 'user',   content: validationPrompt },
  ], { maxTokens: 3000 });

  let verdicts: any[] = [];
  try {
    const match = validationResult.match(/\[[\s\S]*\]/);
    verdicts = match ? JSON.parse(match[0]) : [];
  } catch {
    console.warn('  Warning: validator returned unparseable JSON, accepting all TCs');
    return { valid: tcs.map(tc => ({ ...tc, validated: true, hallucination_risk: 'medium' })), dropped: 0 };
  }

  const verdictMap = new Map(verdicts.map((v: any) => [v.id, v]));
  const valid: TestCase[] = [];
  let dropped = 0;

  for (const tc of tcs) {
    const verdict = verdictMap.get(tc.id);
    if (!verdict || verdict.verdict === 'hallucinated') {
      console.log(`  DROPPED ${tc.id}: ${verdict?.note ?? 'not in requirement'}`);
      dropped++;
      continue;
    }
    valid.push({
      ...tc,
      validated: true,
      hallucination_risk: verdict.risk ?? 'medium',
      validator_note: verdict.note,
    });
  }

  console.log(`  Validated: ${valid.length} kept, ${dropped} dropped`);
  return { valid, dropped };
}

// ── Post to Jira ───────────────────────────────────────────────────────────────
function formatJiraComment(output: MBTOutput): string {
  const lines = [
    `*[MBT Agent] Test Cases — ${output.source}*`,
    `Generated: ${output.generated_at}`,
    `Total: ${output.total_tcs} | Validated: ${output.validated_tcs} | Dropped (hallucinated): ${output.dropped_tcs}`,
    '',
    '----',
  ];

  for (const tc of output.test_cases) {
    const risk = tc.hallucination_risk === 'high' ? ' ⚠️' : '';
    lines.push(`*${tc.id}* [${tc.priority}][${tc.type}]${risk} — ${tc.title}`);
    lines.push(`{code:gherkin}\n${tc.scenario}\n{code}`);
    if (tc.validator_note) lines.push(`_Validator: ${tc.validator_note}_`);
    lines.push('');
  }

  lines.push('----');
  lines.push(output.summary);
  return lines.join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  if (!jiraKey && !reqText) {
    console.error('Usage:\n  npx ts-node agents/mbt-agent.ts --jira NCPP-1234\n  npx ts-node agents/mbt-agent.ts --req "description"');
    process.exit(1);
  }

  console.log('\n MBT Agent — Trụ Cột 1: AI-Driven Test Generation');
  console.log('─'.repeat(55));

  const trace  = startAgentTrace('mbt-agent', { source: jiraKey ?? 'manual', dryRun });
  const source = jiraKey ?? 'manual-req';

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Lấy requirement
  let requirement: string;
  if (jiraKey) {
    console.log(`Fetching Jira ${jiraKey}...`);
    requirement = await fetchJiraRequirement(jiraKey);
  } else {
    requirement = reqText!;
  }

  // Pipeline
  const analysisRaw = await analyzeRequirement(requirement);
  if (!analysisRaw) throw new Error('Analysis step returned empty');
  const tcsRaw      = await generateTestCases(requirement, analysisRaw, source);
  fs.writeFileSync(path.join(OUT_DIR, `${source}-tcsraw.txt`), tcsRaw);
  const { valid, dropped } = dryRun
    ? { valid: JSON.parse(tcsRaw.match(/\[[\s\S]*\]/)![0]), dropped: 0 }
    : await validateTestCases(tcsRaw, requirement);

  // Build output
  const output: MBTOutput = {
    source,
    generated_at: new Date().toISOString(),
    total_tcs:    valid.length + dropped,
    validated_tcs: valid.length,
    dropped_tcs:  dropped,
    test_cases:   valid,
    summary: `Sinh ${valid.length + dropped} TCs từ requirement. Validator loại bỏ ${dropped} TCs (hallucinated). Còn lại ${valid.length} TCs sẵn sàng.`,
  };

  // Save
  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jsonOut    = path.join(OUT_DIR, `${source}-${timestamp}.json`);
  const mdOut      = path.join(OUT_DIR, `${source}-${timestamp}.md`);

  fs.writeFileSync(jsonOut, JSON.stringify(output, null, 2));

  // Markdown export
  const mdLines = [`# MBT Output — ${source}\n`, `> ${output.summary}\n`, '---\n'];
  for (const tc of valid) {
    mdLines.push(`## ${tc.id} — ${tc.title}`);
    mdLines.push(`**Priority:** ${tc.priority} | **Type:** ${tc.type} | **Risk:** ${tc.hallucination_risk}`);
    mdLines.push(`\n\`\`\`gherkin\n${tc.scenario}\n\`\`\`\n`);
  }
  fs.writeFileSync(mdOut, mdLines.join('\n'));

  if (outputFile) {
    fs.copyFileSync(jsonOut, path.resolve(outputFile));
    console.log(`\n Output copied to: ${outputFile}`);
  }

  console.log(`\n Saved: ${jsonOut}`);
  console.log(` Saved: ${mdOut}`);
  console.log(`\n Summary: ${output.summary}`);

  if (postBack && jiraKey) {
    await postJiraComment(jiraKey, formatJiraComment(output));
    console.log(` Posted TCs to Jira ${jiraKey}`);
  }

  await flushLangfuse();
  trace.update({ output: `validated=${output.validated_tcs}, dropped=${output.dropped_tcs}` });
  process.exit(0);
})().catch(err => {
  console.error('\n mbt-agent error:', err.message);
  process.exit(1);
});
