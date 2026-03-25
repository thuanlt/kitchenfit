// baseline-speculative-decoding.spec.ts
// ─────────────────────────────────────────────────────────────────────────────
// MỤC ĐÍCH : Đo baseline TRƯỚC khi bật tính năng Speculative Decoding
//            Chạy lại file này SAU khi bật để so sánh throughput tăng 20-30%
//
// METRICS   : tokens/sec (throughput), latency P50/P90/P95/P99, pass rate
// ENV       : STG  — mkp-api-stg.fptcloud.net
// MODEL     : Qwen3-32B
//
// RUN       : $env:APP_ENV="stg"; npx playwright test tests/api/baseline-speculative-decoding.spec.ts --project=api --reporter=list
// REPORT    : Kết quả lưu tại reports/baseline/qwen3-32b-<timestamp>.json
// ─────────────────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs   from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.stg'), override: true });

const BASE  = process.env.FPT_API_URL!;   // https://mkp-api-stg.fptcloud.net
const KEY   = process.env.FPT_API_KEY!;
const FROM  = process.env.FPT_FROM ?? 'baseline';
const MODEL = 'Qwen3-32B';

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${KEY}`,
};

const CHAT_URL = `${BASE}/v1/chat/completions?from=${FROM}&model=${MODEL}`;

// ─── Prompts dài → sinh nhiều token → throughput measurement có ý nghĩa ─────
// Mỗi prompt thiết kế để model trả về ~150-250 tokens
const PROMPTS = [
  'Explain how a neural network learns, step by step, including forward pass, loss calculation, and backpropagation. Keep it under 200 words.',
  'Describe the water cycle: evaporation, condensation, precipitation, and collection. Explain each stage in detail, under 200 words.',
  'Compare SQL and NoSQL databases: data model, scalability, consistency, and use cases. Under 200 words.',
  'Explain the difference between TCP and UDP protocols, when to use each, with examples. Under 200 words.',
  'Describe how HTTPS works: TLS handshake, certificate verification, symmetric encryption. Under 200 words.',
  'What is the CAP theorem? Explain consistency, availability, and partition tolerance with examples. Under 200 words.',
  'Explain the concept of recursion in programming with a real-world analogy and a code example. Under 200 words.',
  'Describe microservices architecture: benefits, drawbacks, and when to use it vs monolith. Under 200 words.',
  'How does garbage collection work in modern programming languages? Compare reference counting and mark-and-sweep. Under 200 words.',
  'Explain REST API design principles: statelessness, resources, HTTP methods, status codes. Under 200 words.',
  'Describe the MapReduce programming model with a word-count example. Under 200 words.',
  'How does a load balancer work? Explain round-robin, least connections, and IP hash algorithms. Under 200 words.',
  'Explain database indexing: B-tree vs hash index, when to use each, trade-offs. Under 200 words.',
  'What is event-driven architecture? Describe event producers, brokers, and consumers. Under 200 words.',
  'Explain the SOLID principles in software design with a brief example for each. Under 200 words.',
  'How does container orchestration (Kubernetes) work? Describe pods, services, and deployments. Under 200 words.',
  'Explain the difference between authentication and authorization. Give examples of OAuth2 and RBAC. Under 200 words.',
  'Describe how a CDN (Content Delivery Network) works and its benefits for latency and availability. Under 200 words.',
  'What is a distributed cache? Compare Redis and Memcached for use cases and data structures. Under 200 words.',
  'Explain eventual consistency vs strong consistency in distributed systems with examples. Under 200 words.',
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface RequestResult {
  index:           number;
  promptIndex:     number;
  status:          number;
  latencyMs:       number;
  promptTokens:    number;
  completionTokens:number;
  totalTokens:     number;
  tokensPerSec:    number;
  success:         boolean;
  error?:          string;
}

interface ScenarioReport {
  scenario:          string;
  concurrency:       number;
  totalRequests:     number;
  passedRequests:    number;
  passRate:          number;
  totalTokens:       number;
  totalCompTokens:   number;
  wallTimeMs:        number;
  throughputReqSec:  number;
  throughputTokSec:  number;
  latency:           { min: number; avg: number; p50: number; p90: number; p95: number; p99: number; max: number };
  tokensPerReq:      { avg: number; min: number; max: number };
}

// ─── Helper: fire 1 request ───────────────────────────────────────────────────
async function fireRequest(request: any, index: number, promptIndex: number): Promise<RequestResult> {
  const prompt = PROMPTS[promptIndex % PROMPTS.length];
  const t0 = Date.now();

  try {
    const res = await request.post(CHAT_URL, {
      headers: HEADERS,
      data: {
        model:             MODEL,
        messages:          [{ role: 'user', content: prompt }],
        streaming:         false,
        temperature:       0.7,
        max_tokens:        256,
        top_p:             1,
        presence_penalty:  0,
        frequency_penalty: 0,
      },
      timeout: 60_000,
    });

    const latencyMs = Date.now() - t0;
    const status    = res.status();

    if (status !== 200) {
      return { index, promptIndex, status, latencyMs, promptTokens: 0, completionTokens: 0, totalTokens: 0, tokensPerSec: 0, success: false, error: `HTTP ${status}` };
    }

    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content ?? '';
    const usage   = body?.usage ?? {};

    if (!content || content.length === 0) {
      return { index, promptIndex, status, latencyMs, promptTokens: 0, completionTokens: 0, totalTokens: 0, tokensPerSec: 0, success: false, error: 'Empty content' };
    }

    const promptTokens     = usage.prompt_tokens     ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    const totalTokens      = usage.total_tokens      ?? (promptTokens + completionTokens);
    const tokensPerSec     = completionTokens > 0 ? Math.round(completionTokens / (latencyMs / 1000)) : 0;

    return { index, promptIndex, status, latencyMs, promptTokens, completionTokens, totalTokens, tokensPerSec, success: true };

  } catch (err: any) {
    return { index, promptIndex, status: 0, latencyMs: Date.now() - t0, promptTokens: 0, completionTokens: 0, totalTokens: 0, tokensPerSec: 0, success: false, error: err?.message ?? String(err) };
  }
}

// ─── Helper: run N concurrent requests ───────────────────────────────────────
async function runConcurrent(request: any, concurrency: number, promptOffset = 0): Promise<{ results: RequestResult[]; wallTimeMs: number }> {
  const t0 = Date.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, i) => fireRequest(request, i, promptOffset + i)),
  );
  return { results, wallTimeMs: Date.now() - t0 };
}

// ─── Helper: compute & print scenario report ──────────────────────────────────
function computeReport(
  scenario: string,
  concurrency: number,
  results: RequestResult[],
  wallTimeMs: number,
): ScenarioReport {
  const total   = results.length;
  const passed  = results.filter(r => r.success);
  const failed  = total - passed.length;

  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const p = (pct: number) => latencies[Math.min(Math.floor(total * pct), total - 1)];

  const totalCompTokens = passed.reduce((s, r) => s + r.completionTokens, 0);
  const totalTokens     = passed.reduce((s, r) => s + r.totalTokens, 0);
  const avgLatency      = Math.round(latencies.reduce((s, v) => s + v, 0) / total);
  const avgCompTokens   = passed.length > 0 ? Math.round(totalCompTokens / passed.length) : 0;

  const throughputReqSec = parseFloat((total / (wallTimeMs / 1000)).toFixed(2));
  const throughputTokSec = parseFloat((totalCompTokens / (wallTimeMs / 1000)).toFixed(1));

  const report: ScenarioReport = {
    scenario,
    concurrency,
    totalRequests:    total,
    passedRequests:   passed.length,
    passRate:         parseFloat(((passed.length / total) * 100).toFixed(1)),
    totalTokens,
    totalCompTokens,
    wallTimeMs,
    throughputReqSec,
    throughputTokSec,
    latency: {
      min: latencies[0],
      avg: avgLatency,
      p50: p(0.50),
      p90: p(0.90),
      p95: p(0.95),
      p99: p(0.99),
      max: latencies[total - 1],
    },
    tokensPerReq: {
      avg: avgCompTokens,
      min: passed.length > 0 ? Math.min(...passed.map(r => r.completionTokens)) : 0,
      max: passed.length > 0 ? Math.max(...passed.map(r => r.completionTokens)) : 0,
    },
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  ${scenario} — ${MODEL} @ STG`);
  console.log(`  [BASELINE — BEFORE Speculative Decoding]`);
  console.log(`${'═'.repeat(65)}`);
  console.log(`  Concurrency        : ${concurrency} VU`);
  console.log(`  Total requests     : ${total}`);
  console.log(`  Passed / Failed    : ${passed.length} / ${failed}  (${report.passRate}%)`);
  console.log(`  Wall time          : ${wallTimeMs} ms`);
  console.log(`  ── Throughput ──────────────────────────────────────────`);
  console.log(`  Req/sec            : ${throughputReqSec}  ← target after SD: ${(throughputReqSec * 1.25).toFixed(2)}`);
  console.log(`  Tokens/sec (comp.) : ${throughputTokSec}  ← target after SD: ${(throughputTokSec * 1.25).toFixed(1)}`);
  console.log(`  ── Latency (ms) ────────────────────────────────────────`);
  console.log(`  Min / Avg          : ${report.latency.min} / ${avgLatency}`);
  console.log(`  P50 / P90          : ${report.latency.p50} / ${report.latency.p90}`);
  console.log(`  P95 / P99          : ${report.latency.p95} / ${report.latency.p99}`);
  console.log(`  Max                : ${report.latency.max}`);
  console.log(`  ── Tokens/request ──────────────────────────────────────`);
  console.log(`  Avg completion tok : ${avgCompTokens}`);
  console.log(`  Min / Max          : ${report.tokensPerReq.min} / ${report.tokensPerReq.max}`);
  if (failed > 0) {
    console.log(`  ❌ Failures:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`     [${r.index}] ${r.error} (${r.latencyMs}ms)`);
    });
  }
  console.log(`${'═'.repeat(65)}\n`);

  return report;
}

// ─── Save full baseline JSON ──────────────────────────────────────────────────
function saveBaseline(scenarios: ScenarioReport[]) {
  const outDir = path.resolve(__dirname, '../../reports/baseline');
  fs.mkdirSync(outDir, { recursive: true });

  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(outDir, `qwen3-32b-before-sd-${ts}.json`);

  const payload = {
    meta: {
      model:     MODEL,
      env:       'STG',
      apiUrl:    BASE,
      phase:     'BEFORE_SPECULATIVE_DECODING',
      timestamp: new Date().toISOString(),
      note:      'Run this file again after enabling Speculative Decoding. Compare throughputTokSec — expected +20-30%.',
    },
    scenarios,
  };

  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`\n📁 Baseline saved → ${file}`);
  console.log(`   Compare with next run after Speculative Decoding is enabled.\n`);
}

// ════════════════════════════════════════════════════════════════════════════
//  BASELINE SCENARIOS
// ════════════════════════════════════════════════════════════════════════════

const allReports: ScenarioReport[] = [];

test.describe.serial(`Baseline — ${MODEL} @ STG (BEFORE Speculative Decoding)`, () => {

  // ── BL_001: Single request — stable reference point ─────────────────────
  test('BL_001 — Single request (baseline reference)', async ({ request }) => {
    const { results, wallTimeMs } = await runConcurrent(request, 1, 0);
    const r = results[0];
    console.log(`\n🔵 BL_001 Single: HTTP ${r.status} | ${r.latencyMs}ms | ${r.completionTokens} comp-tokens | ${r.tokensPerSec} tok/s`);
    expect(r.success, `BL_001 failed: ${r.error}`).toBe(true);
    const report = computeReport('BL_001 Single request', 1, results, wallTimeMs);
    allReports.push(report);
  });

  // ── BL_002: 5 concurrent VU ───────────────────────────────────────────────
  test('BL_002 — 5 concurrent VU', async ({ request }) => {
    const { results, wallTimeMs } = await runConcurrent(request, 5, 0);
    const report = computeReport('BL_002 Light (5 VU)', 5, results, wallTimeMs);
    allReports.push(report);
    expect(report.passRate, 'BL_002 pass rate < 80%').toBeGreaterThanOrEqual(80);
  });

  // ── BL_003: 10 concurrent VU ──────────────────────────────────────────────
  test('BL_003 — 10 concurrent VU', async ({ request }) => {
    const { results, wallTimeMs } = await runConcurrent(request, 10, 5);
    const report = computeReport('BL_003 Medium (10 VU)', 10, results, wallTimeMs);
    allReports.push(report);
    expect(report.passRate, 'BL_003 pass rate < 70%').toBeGreaterThanOrEqual(70);
  });

  // ── BL_004: 20 concurrent VU ──────────────────────────────────────────────
  test('BL_004 — 20 concurrent VU', async ({ request }) => {
    const { results, wallTimeMs } = await runConcurrent(request, 20, 0);
    const report = computeReport('BL_004 High (20 VU)', 20, results, wallTimeMs);
    allReports.push(report);
    expect(report.passRate, 'BL_004 pass rate < 60%').toBeGreaterThanOrEqual(60);
  });

  // ── BL_005: Sustained 3 waves × 10 VU ────────────────────────────────────
  test('BL_005 — Sustained load (3 waves × 10 VU = 30 req)', async ({ request }) => {
    const WAVES     = 3;
    const WAVE_SIZE = 10;
    const allResults: RequestResult[] = [];
    let wallTimeMs = 0;

    console.log(`\n🌊 BL_005 Sustained: ${WAVES} waves × ${WAVE_SIZE} VU`);

    const t0 = Date.now();
    for (let w = 0; w < WAVES; w++) {
      const offset = w * WAVE_SIZE;
      const { results } = await runConcurrent(request, WAVE_SIZE, offset);
      allResults.push(...results);
      const passed = results.filter(r => r.success).length;
      console.log(`  Wave ${w + 1}/${WAVES}: ${passed}/${WAVE_SIZE} passed | avg ${Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / WAVE_SIZE)}ms`);
    }
    wallTimeMs = Date.now() - t0;

    const report = computeReport('BL_005 Sustained (3×10 VU)', WAVE_SIZE, allResults, wallTimeMs);
    allReports.push(report);
    expect(report.passRate, 'BL_005 pass rate < 70%').toBeGreaterThanOrEqual(70);
  });

  // ── BL_SAVE: Lưu toàn bộ kết quả vào JSON ────────────────────────────────
  test('BL_SAVE — Save baseline JSON', async () => {
    expect(allReports.length, 'No scenarios recorded').toBeGreaterThan(0);

    // ── Summary table ──────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(90));
    console.log('  BASELINE SUMMARY — BEFORE Speculative Decoding');
    console.log('─'.repeat(90));
    console.log(`  ${'Scenario'.padEnd(35)} ${'VU'.padStart(4)}  ${'Pass%'.padStart(5)}  ${'Req/s'.padStart(6)}  ${'Tok/s'.padStart(7)}  ${'P50ms'.padStart(6)}  ${'P95ms'.padStart(6)}`);
    console.log('─'.repeat(90));
    for (const r of allReports) {
      console.log(
        `  ${r.scenario.padEnd(35)} ${String(r.concurrency).padStart(4)}  ${String(r.passRate).padStart(5)}  ${String(r.throughputReqSec).padStart(6)}  ${String(r.throughputTokSec).padStart(7)}  ${String(r.latency.p50).padStart(6)}  ${String(r.latency.p95).padStart(6)}`
      );
    }
    console.log('─'.repeat(90));
    console.log('  ✅ Expected improvement AFTER Speculative Decoding: Tok/s +20–30%');
    console.log('─'.repeat(90) + '\n');

    saveBaseline(allReports);
  });

});
