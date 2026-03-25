/**
 * report-server.ts
 *
 * Local dashboard server — reads Playwright JSON reports and serves a Chart.js dashboard.
 *
 * Usage:
 *   npm run dashboard          → http://localhost:9999
 *   npm run dashboard:prod     → reads reports/prod/test-results.json
 */

import express from 'express';
import path from 'path';
import fs from 'fs';

const app  = express();
const PORT = process.env.DASHBOARD_PORT ? parseInt(process.env.DASHBOARD_PORT) : 9999;

// ── Parse a Playwright JSON report into a flat list of tests ──────────────────

interface TestResult {
  id: string;
  title: string;
  file: string;
  suite: string;
  status: 'expected' | 'unexpected' | 'skipped' | 'flaky';
  duration: number;
  error: string | null;
  retries: number;
}

function extractTests(suites: any[], results: TestResult[] = [], parentFile = ''): TestResult[] {
  for (const s of suites || []) {
    const file = s.file ? path.basename(s.file) : (parentFile || s.title || '');
    for (const spec of s.specs || []) {
      for (const test of spec.tests || []) {
        const r0 = test.results?.[0] || {};
        results.push({
          id: spec.id || `${file}-${spec.title}`,
          title: spec.title,
          file,
          suite: s.title || file,
          status: test.status,
          duration: r0.duration || 0,
          error: r0.error?.message?.split('\n')[0]?.substring(0, 200) || null,
          retries: (test.results?.length || 1) - 1,
        });
      }
    }
    extractTests(s.suites || [], results, file);
  }
  return results;
}

function loadReport(env: string) {
  const candidates = [
    path.resolve(__dirname, `../reports/${env}/test-results.json`),
    path.resolve(__dirname, `../reports/test-results.json`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const tests = extractTests(raw.suites || []);
        return { stats: raw.stats, tests, env, file: p };
      } catch { /* skip */ }
    }
  }
  return null;
}

// ── API endpoints ──────────────────────────────────────────────────────────────

app.get('/api/envs', (_req, res) => {
  const reportsDir = path.resolve(__dirname, '../reports');
  const envs: string[] = [];
  try {
    for (const entry of fs.readdirSync(reportsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const jsonPath = path.join(reportsDir, entry.name, 'test-results.json');
        if (fs.existsSync(jsonPath)) envs.push(entry.name);
      }
    }
  } catch { /* empty */ }
  res.json(envs);
});

app.get('/api/results/:env', (req, res) => {
  const data = loadReport(req.params.env);
  if (!data) return res.status(404).json({ error: `No report found for env: ${req.params.env}` });
  res.json(data);
});

// ── Serve dashboard HTML ───────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../dashboard/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Dashboard running at http://localhost:${PORT}`);
  console.log('   Press Ctrl+C to stop\n');
});
