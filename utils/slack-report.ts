/**
 * slack-report.ts
 *
 * Chạy 3 test suite (ai, vn, jp) và gửi kết quả lên Slack #marketplace
 *
 * Usage:
 *   npx ts-node utils/slack-report.ts
 *   APP_ENV=stg npx ts-node utils/slack-report.ts
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APP_ENV       = process.env.APP_ENV ?? 'test';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL!;
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
    const failures = all.filter(t => t.status === 'unexpected')
      .map(t => `• \`${t.title}\`: ${t.error ?? 'failed'}`);
    return { name: '', passed, failed, skipped, total: all.length, duration, failures };
  } catch (e) {
    console.error(`  ❌ Failed to parse report: ${e}`);
    return null;
  }
}

function runTests(label: string, playwrightArgs: string[], outFile: string, cwd?: string): SuiteResult {
  console.log(`\n▶ Running [${label}]...`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  // Remove old report so we don't read stale data
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

  const result = spawnSync(
    'npx',
    ['playwright', 'test', ...playwrightArgs, `--reporter=json`],
    {
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: outFile },
      cwd: cwd ?? path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      shell: true,
    }
  );

  // Try to parse JSON from stdout if file not written
  if (!fs.existsSync(outFile) && result.stdout) {
    try {
      const jsonStart = result.stdout.indexOf('{');
      if (jsonStart >= 0) {
        fs.writeFileSync(outFile, result.stdout.slice(jsonStart));
      }
    } catch {}
  }

  // Also print stderr for visibility
  if (result.stderr) {
    const lines = result.stderr.split('\n').filter((l: string) =>
      l.includes('passed') || l.includes('failed') || l.includes('skipped') || l.startsWith('  ✓') || l.startsWith('  ✗')
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

function buildSlackMessage(results: SuiteResult[]): object {
  const totalPassed  = results.reduce((s, r) => s + r.passed,  0);
  const totalFailed  = results.reduce((s, r) => s + r.failed,  0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const totalAll     = results.reduce((s, r) => s + r.total,   0);
  const allPassed    = totalFailed === 0 && totalAll > 0;
  const now          = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const header = allPassed
    ? `:white_check_mark: *API Test Report — ${APP_ENV.toUpperCase()}* — All Passed`
    : `:x: *API Test Report — ${APP_ENV.toUpperCase()}* — ${totalFailed} Failed`;

  const summaryLines = results.map(r => {
    const icon = r.failed > 0 ? ':red_circle:' : ':large_green_circle:';
    const pct  = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
    return `${icon} *${r.name}*: ${r.passed}/${r.total} passed (${pct}%) | skip: ${r.skipped} | ${formatDuration(r.duration)}`;
  });

  const failureLines: string[] = [];
  for (const r of results) {
    if (r.failures.length > 0) {
      failureLines.push(`\n*${r.name} — Failures:*`);
      failureLines.push(...r.failures.slice(0, 5));
      if (r.failures.length > 5) failureLines.push(`  _...and ${r.failures.length - 5} more_`);
    }
  }

  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: `API Test Report — ${APP_ENV.toUpperCase()}`, emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: header } },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*Total:* ${totalPassed} passed / ${totalFailed} failed / ${totalSkipped} skipped / ${totalAll} total`,
          `*Time:* ${now}`,
          '',
          ...summaryLines,
        ].join('\n'),
      },
    },
  ];

  if (failureLines.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: failureLines.join('\n') } });
  }

  return { blocks };
}

function postToSlack(payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify(payload);
    const slackUrl = new URL(SLACK_WEBHOOK);

    const doRequest = (options: https.RequestOptions, isHttps: boolean) => {
      const lib = isHttps ? https : http;
      const req = lib.request(options, res => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          if (res.statusCode === 200) console.log('✅ Slack notification sent.');
          else console.error(`❌ Slack error ${res.statusCode}: ${data}`);
          resolve();
        });
      });
      req.on('error', e => { console.error('❌ Slack request error:', e.message); resolve(); });
      req.write(body);
      req.end();
    };

    if (PROXY_URL) {
      const proxy   = new URL(PROXY_URL);
      const options = {
        hostname: proxy.hostname,
        port:     parseInt(proxy.port) || 8080,
        path:     `https://${slackUrl.hostname}${slackUrl.pathname}`,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Host':           slackUrl.hostname,
        },
      };
      doRequest(options, false);
    } else {
      const options = {
        hostname: slackUrl.hostname,
        path:     slackUrl.pathname,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };
      doRequest(options, true);
    }
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  if (!SLACK_WEBHOOK) {
    console.error('❌ SLACK_WEBHOOK_URL not set in .env');
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, `../reports/${APP_ENV}`);
  const mktDir = path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace');

  const results: SuiteResult[] = [
    runTests('AI (ai.fptcloud.com)',          ['--project=ai'],                                                               path.join(outDir, 'ai-results.json')),
    runTests('API VN (mkp-api.fptcloud.com)', ['src/tests/api/api-inference.spec.ts',    '--project=api'], path.join(outDir, 'vn-results.json'), mktDir),
    runTests('API JP (mkp-api.fptcloud.jp)',  ['src/tests/api/api-inference-jp.spec.ts', '--project=api'], path.join(outDir, 'jp-results.json'), mktDir),
  ];

  console.log('\n📊 Final Summary:');
  for (const r of results) {
    console.log(`  ${r.name}: ${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped`);
  }

  console.log('\n📤 Sending to Slack...');
  const payload = buildSlackMessage(results);
  await postToSlack(payload);
})();
