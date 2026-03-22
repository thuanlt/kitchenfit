/**
 * webhook-server.ts
 * Lightweight HTTP server — n8n calls this to trigger Playwright tests.
 *
 * Start: npx ts-node utils/webhook-server.ts
 *
 * POST /webhook/playwright
 * Body (JSON, all optional):
 *   {
 *     "spec"    : "tests/api/api-inference-jp.spec.ts",   // file or glob
 *     "project" : "api",                                   // playwright project
 *     "grep"    : "TC_JP_001",                             // filter by test name
 *     "workers" : 4                                        // parallel workers
 *   }
 *
 * Response 200:
 *   { "ok": true,  "exitCode": 0, "passed": 25, "failed": 3, "summary": "..." }
 * Response 500:
 *   { "ok": false, "exitCode": 1, "passed": 0,  "failed": 0, "summary": "..." }
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { fetch, ProxyAgent, Agent } from 'undici';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT                = Number(process.env.WEBHOOK_PORT ?? 3001);
const SECRET              = process.env.WEBHOOK_SECRET ?? '';
const TEAMS_WEBHOOK       = process.env.TEAMS_WEBHOOK_URL ?? '';
const TEAMS_GROUP_WEBHOOK = process.env.TEAMS_GROUP_WEBHOOK_URL ?? '';
const ROOT                = path.resolve(__dirname, '..');

interface RunPayload {
  spec?    : string;
  project? : string;
  grep?    : string;
  workers? : number;
}

function runPlaywright(payload: RunPayload): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const args: string[] = ['playwright', 'test', '--reporter=list'];

    if (payload.spec)    args.push(payload.spec);
    if (payload.project) args.push('--project', payload.project);
    if (payload.grep)    args.push('--grep', payload.grep);
    if (payload.workers) args.push('--workers', String(payload.workers));

    const proc = spawn('npx', args, { cwd: ROOT, shell: true });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    proc.on('close', (code) => resolve({ exitCode: code ?? 1, output }));
  });
}

async function notifyTeams(ok: boolean, passed: number, failed: number, spec: string, summary: string) {
  if (!TEAMS_WEBHOOK) return;
  const status  = ok ? '✅ PASSED' : '❌ FAILED';
  const color   = ok ? '00C851' : 'FF4444';
  const payload = {
    '@type':      'MessageCard',
    '@context':   'https://schema.org/extensions',
    themeColor:   color,
    summary:      `Playwright ${status}`,
    sections: [{
      activityTitle:    `🎭 Playwright Test Result — ${status}`,
      activitySubtitle: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      facts: [
        { name: 'Spec',   value: spec || 'all tests' },
        { name: 'Passed', value: String(passed) },
        { name: 'Failed', value: String(failed) },
        { name: 'Total',  value: String(passed + failed) },
      ],
      text: failed > 0 ? `\`\`\`\n${summary}\n\`\`\`` : '',
    }],
  };

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : new Agent();
  try {
    console.log('📨 Sending Teams notification...');
    const res = await fetch(TEAMS_WEBHOOK, {
      method:     'POST',
      headers:    { 'Content-Type': 'application/json' },
      body:       JSON.stringify(payload),
      dispatcher,
    });
    console.log(`📨 Teams response: HTTP ${res.status}`);
  } catch (e: any) {
    console.error('❌ Teams notify error:', e.message);
  }
}

async function notifyTeamsGroup(passed: number, failed: number, spec: string, summary: string) {
  if (!TEAMS_GROUP_WEBHOOK) return;
  const message = `❌ **Playwright FAILED** — ${spec || 'all tests'}\n✅ Passed: ${passed} | ❌ Failed: ${failed}\n\`\`\`\n${summary}\n\`\`\``;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : new Agent();
  try {
    console.log('📨 Sending Teams Group notification...');
    const res = await fetch(TEAMS_GROUP_WEBHOOK, {
      method:     'POST',
      headers:    { 'Content-Type': 'application/json' },
      body:       JSON.stringify({ message }),
      dispatcher,
    });
    console.log(`📨 Teams Group response: HTTP ${res.status}`);
  } catch (e: any) {
    console.error('❌ Teams Group notify error:', e.message);
  }
}

function parseSummary(output: string) {
  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  // grab last 10 lines as summary
  const lines   = output.trim().split('\n');
  const summary = lines.slice(-10).join('\n');
  return { passed, failed, summary };
}

const server = http.createServer(async (req, res) => {
  // Auth check
  if (SECRET) {
    const auth = req.headers['authorization'] ?? '';
    if (auth !== `Bearer ${SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status: 'running' }));
    return;
  }

  // Trigger tests
  if (req.method === 'POST' && req.url === '/webhook/playwright') {
    let payload: RunPayload = {};
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      if (raw) payload = JSON.parse(raw);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
      return;
    }

    console.log(`[${new Date().toISOString()}] ▶ Run triggered`, payload);

    const { exitCode, output } = await runPlaywright(payload);
    const { passed, failed, summary } = parseSummary(output);
    const ok = exitCode === 0;

    console.log(`[${new Date().toISOString()}] ${ok ? '✅' : '❌'} Done — passed=${passed} failed=${failed}`);

    await notifyTeams(ok, passed, failed, payload.spec ?? '', summary);
    if (!ok) await notifyTeamsGroup(passed, failed, payload.spec ?? '', summary);

    res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok, exitCode, passed, failed, summary }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Playwright webhook server listening on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/webhook/playwright`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  if (SECRET)        console.log(`   Auth: Bearer ${SECRET}`);
  if (TEAMS_WEBHOOK)       console.log(`   Teams channel: ✅ configured`);
  else                     console.log(`   Teams channel: ⚠️  TEAMS_WEBHOOK_URL not set`);
  if (TEAMS_GROUP_WEBHOOK) console.log(`   Teams group:   ✅ configured (notify on fail only)`);
  else                     console.log(`   Teams group:   ⚠️  TEAMS_GROUP_WEBHOOK_URL not set`);
});
