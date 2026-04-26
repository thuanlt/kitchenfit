/**
 * teams-report.ts
 *
 * Chạy 3 test suite (ai, vn, jp) và gửi kết quả lên Microsoft Teams
 * qua Incoming Webhook (Adaptive Cards format).
 *
 * Usage:
 *   npx ts-node utils/teams-report.ts
 *   APP_ENV=stg npx ts-node utils/teams-report.ts
 *   SKIP_TESTS=true npx ts-node utils/teams-report.ts   ← chỉ gửi message test
 *
 * Env vars cần thiết:
 *   TEAMS_WEBHOOK_URL=https://xxx.webhook.office.com/webhookb2/...
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APP_ENV       = process.env.APP_ENV ?? 'test';
const TEAMS_WEBHOOK = process.env.TEAMS_WEBHOOK_URL!;
const PROXY_URL     = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

// ── Types ────────────────────────────────────────────────────────────────────

interface SuiteResult {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  failures: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractSuiteStats(suites: any[], results: any[] = []): any[] {
  for (const s of suites || []) {
    for (const spec of s.specs || []) {
      for (const test of spec.tests || []) {
        results.push({
          title: spec.title,
          suite: s.title,
          status: test.status,
          duration: test.results?.[0]?.duration ?? 0,
          error: test.results?.[0]?.error?.message?.split('\n')[0]?.substring(0, 150) ?? null,
        });
      }
    }
    extractSuiteStats(s.suites || [], results);
  }
  return results;
}

function parseReport(file: string): SuiteResult | null {
  if (!fs.existsSync(file)) {
    console.warn(`  ⚠ Report not found: ${file}`);
    return null;
  }
  try {
    const raw     = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const all     = extractSuiteStats(raw.suites || []);
    const passed  = all.filter(t => t.status === 'expected').length;
    const failed  = all.filter(t => t.status === 'unexpected').length;
    const skipped = all.filter(t => t.status === 'skipped').length;
    const duration = raw.stats?.duration ?? all.reduce((s: number, t: any) => s + t.duration, 0);
    const failures = all
      .filter(t => t.status === 'unexpected')
      .map(t => `• ${t.title}: ${t.error ?? 'failed'}`);
    return { name: '', passed, failed, skipped, total: all.length, duration, failures };
  } catch (e) {
    console.error(`  ❌ Failed to parse report: ${e}`);
    return null;
  }
}

function runTests(label: string, playwrightArgs: string[], outFile: string, cwd?: string): SuiteResult {
  console.log(`\n▶ Running [${label}]...`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

  const result = spawnSync(
    'npx',
    ['playwright', 'test', ...playwrightArgs, '--reporter=json'],
    {
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: outFile },
      cwd: cwd ?? path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      shell: true,
    }
  );

  if (!fs.existsSync(outFile) && result.stdout) {
    try {
      const jsonStart = result.stdout.indexOf('{');
      if (jsonStart >= 0) fs.writeFileSync(outFile, result.stdout.slice(jsonStart));
    } catch {}
  }

  if (result.stderr) {
    const lines = result.stderr.split('\n').filter((l: string) =>
      l.includes('passed') || l.includes('failed') || l.includes('skipped')
    );
    lines.forEach((l: string) => console.log(' ', l));
  }

  const parsed = parseReport(outFile) ?? {
    name: label, passed: 0, failed: 0, skipped: 0, total: 0, duration: 0, failures: []
  };
  parsed.name = label;
  console.log(`  → ${parsed.passed} passed, ${parsed.failed} failed, ${parsed.skipped} skipped / ${parsed.total} total`);
  return parsed;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

// ── Teams Adaptive Card builder ───────────────────────────────────────────────

function buildTeamsPayload(results: SuiteResult[]): object {
  const totalPassed  = results.reduce((s, r) => s + r.passed,  0);
  const totalFailed  = results.reduce((s, r) => s + r.failed,  0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const totalAll     = results.reduce((s, r) => s + r.total,   0);
  const allPassed    = totalFailed === 0 && totalAll > 0;
  const now          = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const statusTitle = allPassed
    ? `✅ API Test Report — ${APP_ENV.toUpperCase()} — All Passed`
    : `❌ API Test Report — ${APP_ENV.toUpperCase()} — ${totalFailed} Failed`;

  // Per-suite rows
  const suiteRows = results.map(r => {
    const icon = r.failed > 0 ? '🔴' : '🟢';
    const pct  = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
    return `${icon} **${r.name}**: ${r.passed}/${r.total} passed (${pct}%) | skip: ${r.skipped} | ${formatDuration(r.duration)}`;
  }).join('\n\n');

  // Failure list (max 10 per suite, combined)
  const allFailures: string[] = [];
  for (const r of results) {
    if (r.failures.length > 0) {
      allFailures.push(`**${r.name} — Failures:**`);
      allFailures.push(...r.failures.slice(0, 5));
      if (r.failures.length > 5) allFailures.push(`  _...and ${r.failures.length - 5} more_`);
    }
  }

  const bodyItems: any[] = [
    {
      type: 'TextBlock',
      text: statusTitle,
      weight: 'Bolder',
      size: 'Medium',
      color: allPassed ? 'Good' : 'Attention',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: `**Total:** ${totalPassed} passed / ${totalFailed} failed / ${totalSkipped} skipped / ${totalAll} total\n**Time:** ${now}`,
      wrap: true,
      spacing: 'Medium',
    },
    { type: 'TextBlock', text: suiteRows, wrap: true, spacing: 'Medium' },
  ];

  if (allFailures.length > 0) {
    bodyItems.push({
      type: 'TextBlock',
      text: allFailures.join('\n'),
      wrap: true,
      spacing: 'Medium',
      color: 'Attention',
    });
  }

  // Adaptive Card wrapped in Teams message format
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: bodyItems,
        },
      },
    ],
  };
}

// ── HTTP send with proxy support ─────────────────────────────────────────────

function postToTeams(payload: object): Promise<void> {
  return new Promise((resolve) => {
    const body      = JSON.stringify(payload);
    const targetUrl = new URL(TEAMS_WEBHOOK);

    const doRequest = (options: https.RequestOptions, useHttps: boolean) => {
      const lib = useHttps ? https : http;
      const req = lib.request(options, res => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          if (res.statusCode && res.statusCode < 300) {
            console.log('✅ Teams notification sent.');
          } else {
            console.error(`❌ Teams error ${res.statusCode}: ${data}`);
          }
          resolve();
        });
      });
      req.on('error', e => { console.error('❌ Teams request error:', e.message); resolve(); });
      req.write(body);
      req.end();
    };

    if (PROXY_URL) {
      // Send via corporate proxy (HTTP CONNECT tunnel not needed for simple POST)
      const proxy = new URL(PROXY_URL);
      doRequest(
        {
          hostname: proxy.hostname,
          port:     parseInt(proxy.port) || 8080,
          path:     `https://${targetUrl.hostname}${targetUrl.pathname}${targetUrl.search}`,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Host':           targetUrl.hostname,
          },
        },
        false  // connect to proxy over HTTP
      );
    } else {
      doRequest(
        {
          hostname: targetUrl.hostname,
          path:     `${targetUrl.pathname}${targetUrl.search}`,
          method:   'POST',
          headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        },
        true
      );
    }
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  if (!TEAMS_WEBHOOK) {
    console.error('❌ TEAMS_WEBHOOK_URL not set in .env');
    process.exit(1);
  }

  // SKIP_TESTS=true → chỉ gửi sample message để test webhook
  if (process.env.SKIP_TESTS === 'true') {
    console.log('⏭  SKIP_TESTS=true — sending sample message to Teams...');
    const sample: SuiteResult[] = [
      { name: 'Sample Suite', passed: 5, failed: 1, skipped: 0, total: 6, duration: 3000, failures: ['• TC-SAMPLE-001: Connection timeout'] },
    ];
    await postToTeams(buildTeamsPayload(sample));
    return;
  }

  const outDir = path.resolve(__dirname, `../reports/${APP_ENV}`);
  const mktDir = path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace');

  const results: SuiteResult[] = [
    runTests('AI (ai.fptcloud.com)',          ['--project=ai'],                                                                path.join(outDir, 'ai-results.json')),
    runTests('API VN (mkp-api.fptcloud.com)', ['src/tests/api/api-inference.spec.ts',    '--project=api'], path.join(outDir, 'vn-results.json'), mktDir),
    runTests('API JP (mkp-api.fptcloud.jp)',  ['src/tests/api/api-inference-jp.spec.ts', '--project=api'], path.join(outDir, 'jp-results.json'), mktDir),
  ];

  console.log('\n📊 Final Summary:');
  for (const r of results) {
    console.log(`  ${r.name}: ${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped`);
  }

  console.log('\n📤 Sending to Microsoft Teams...');
  await postToTeams(buildTeamsPayload(results));
})();
