/**
 * post-api-inference-result.ts
 * Reads Playwright JSON report and posts a summary to Teams (Market Place channel).
 *
 * Usage:
 *   APP_ENV=prod npx ts-node utils/post-api-inference-result.ts
 *   APP_ENV=stg  npx ts-node utils/post-api-inference-result.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APP_ENV        = process.env.APP_ENV ?? 'prod';
const WEBHOOK        = process.env.TEAMS_WEBHOOK_URL!;
const WEBHOOK_GROUP  = process.env.TEAMS_AUTO_TEST_WEBHOOK_URL;   // AUTO_TEST_MODAS (Power Automate)
const REPORT         = path.resolve(__dirname, `../reports/${APP_ENV}/test-results.json`);
const PROXY          = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const proxy          = new ProxyAgent(PROXY);

// ── Icon map per suite title keyword ─────────────────────────────────────────
const SUITE_ICON: Record<string, string> = {
  'Vision':     '👁️',
  'Embedding':  '🔢',
  'Rerank':     '📊',
  'Speech':     '🎙️',
  'Text to Speech': '🔊',
  'Chat':       '💬',
};

function suiteIcon(title: string): string {
  for (const [key, icon] of Object.entries(SUITE_ICON)) {
    if (title.includes(key)) return icon;
  }
  return '🧪';
}

function statusEmoji(status: string): string {
  if (status === 'expected') return '✅';
  if (status === 'skipped')  return '⏭️';
  return '❌';
}

// ── Parse report ──────────────────────────────────────────────────────────────
if (!fs.existsSync(REPORT)) {
  console.error(`❌ Report not found: ${REPORT}`);
  process.exit(1);
}

const report   = JSON.parse(fs.readFileSync(REPORT, 'utf-8'));
const stats    = report.stats as {
  startTime: string; duration: number;
  expected: number; unexpected: number; skipped: number; flaky: number;
};

const total    = stats.expected + stats.unexpected + stats.skipped + stats.flaky;
const passed   = stats.expected;
const failed   = stats.unexpected;
const skipped  = stats.skipped;
const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
const duration = (stats.duration / 1000).toFixed(1);
const runDate  = new Date(stats.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

const overallColor = failed > 0 ? 'Attention' : 'Good';
const overallIcon  = failed > 0 ? '❌' : '✅';
const envLabel     = APP_ENV === 'prod' ? 'VN' : APP_ENV === 'jp' ? 'JP' : APP_ENV.toUpperCase();

// Collect per-suite facts from the first file suite
const fileSuite = report.suites?.[0];
const suiteFacts: { title: string; value: string }[] = [];

if (fileSuite?.suites) {
  for (const suite of fileSuite.suites as any[]) {
    const tests   = (suite.specs ?? []) as any[];
    const results = tests.map((s: any) => statusEmoji(s.tests?.[0]?.status ?? 'unexpected'));
    const allPass = results.every(r => r === '✅');
    const models  = tests.map((s: any) => s.title.replace(/^TC_API_\d+ — /, '')).join(', ');
    suiteFacts.push({
      title: `${suiteIcon(suite.title)} ${suite.title}`,
      value: `${models} — ${allPass ? '✅ All 200' : results.join(' ')}`,
    });
  }
}

// ── Build Adaptive Card ───────────────────────────────────────────────────────
const card = {
  type: 'message',
  attachments: [
    {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: `${overallIcon} API Inference Test Results — ${envLabel}`,
            weight: 'Bolder',
            size: 'Large',
            color: overallColor,
          },
          {
            type: 'TextBlock',
            text: `🌐 **Endpoint:** mkp-api.fptcloud${APP_ENV === 'prod' ? '.com' : APP_ENV === 'jp' ? '.jp' : '.stg'}  \n📅 **Run:** ${runDate}  \n⏱️ **Duration:** ${duration}s`,
            wrap: true,
            spacing: 'Small',
          },
          {
            type: 'ColumnSet',
            spacing: 'Medium',
            columns: [
              { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: `**${passed}/${total}**`, color: overallColor, weight: 'Bolder', size: 'ExtraLarge' }] },
              { type: 'Column', width: 'stretch', items: [
                { type: 'TextBlock', text: `✅ Passed: **${passed}**  ❌ Failed: **${failed}**  ⏭️ Skipped: **${skipped}**`, wrap: true },
                { type: 'TextBlock', text: `Pass rate: **${passRate}%**`, color: overallColor },
              ]},
            ],
          },
          { type: 'Separator' },
          {
            type: 'TextBlock',
            text: 'Detail by Group',
            weight: 'Bolder',
            spacing: 'Medium',
          },
          {
            type: 'FactSet',
            facts: suiteFacts,
          },
        ],
      },
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function postAdaptiveCard(url: string, label: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
    dispatcher: proxy,
  } as any);
  if (res.ok) {
    console.log(`✅ Posted ${envLabel} results to ${label}`);
  } else {
    console.error(`❌ [${label}] HTTP ${res.status}: ${await res.text()}`);
  }
}

// Plain-text payload for Power Automate (AUTO_TEST_MODAS group)
const endpoint = `mkp-api.fptcloud${APP_ENV === 'prod' ? '.com' : APP_ENV === 'jp' ? '.jp' : '.stg'}`;

// Mỗi suite trên 1 dòng, mỗi model xuống dòng riêng
const detailLines = suiteFacts.map(f => {
  // Tách phần models và status: "model1, model2 — ✅ All 200"
  const dashIdx = f.value.lastIndexOf(' — ');
  const modelsPart  = dashIdx >= 0 ? f.value.substring(0, dashIdx) : f.value;
  const statusPart  = dashIdx >= 0 ? f.value.substring(dashIdx + 3) : '';
  const modelLines  = modelsPart.split(', ').map((m, i) => `${i + 1}. ${m}`).join('\n\n');
  return `${f.title}  ${statusPart}\n\n${modelLines}`;
}).join('\n\n---\n\n');

const groupPayload = {
  title:    `${overallIcon} API Inference Test Results — ${envLabel}`,
  env:      APP_ENV === 'prod' ? 'com' : APP_ENV === 'jp' ? 'jp' : 'stg',
  passed,
  failed,
  total,
  duration,
  passRate,
  runDate,
  detail:   `🌐 ${endpoint}\n\n${detailLines}`,
};

async function postToGroup(url: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(groupPayload),
    dispatcher: proxy,
  } as any);
  if (res.ok) {
    console.log(`✅ Posted ${envLabel} results to Teams (AUTO_TEST_MODAS)`);
  } else {
    console.error(`❌ [AUTO_TEST_MODAS] HTTP ${res.status}: ${await res.text()}`);
  }
}

async function main() {
  await postAdaptiveCard(WEBHOOK, 'Teams (Market Place)');
  if (WEBHOOK_GROUP) await postToGroup(WEBHOOK_GROUP);
}

main();
