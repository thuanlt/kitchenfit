/**
 * browser-inspect-gen.ts
 *
 * Dùng khi ĐÃ có trang web thật — không cần mockup/Figma.
 *
 * Pipeline:
 *   Step 1 — Playwright  : ariaSnapshot() của trang thật → accessibility tree
 *   Step 2 — Kimi/GLM    : Generate (hoặc fix draft) Playwright test code
 *                          Locators dựa trực tiếp từ DOM thật → chính xác
 *
 * Hai mode:
 *   1. Fresh generate  : chưa có draft — GLM tự viết từ snapshot
 *   2. Fix draft       : có draft từ vlm-mockup-analyze.ts — GLM sửa locators
 *
 * Usage:
 *   # Fresh generate (chỉ cần URL)
 *   npx ts-node utils/browser-inspect-gen.ts --url https://marketplace-stg.fptcloud.net/en [--save]
 *
 *   # Fix draft (sau khi chạy vlm-mockup-analyze.ts)
 *   npx ts-node utils/browser-inspect-gen.ts --url https://marketplace-stg.fptcloud.net/en \
 *     --draft tests/regression/draft-2026-03-17T10-00-00.spec.ts [--save]
 *
 *   # Chỉ lấy snapshot (không gen code)
 *   npx ts-node utils/browser-inspect-gen.ts --url https://... --snapshot-only
 *
 * API: PROD key (FPT_GEN_API_KEY / FPT_GEN_API_URL)
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';
import { chromium } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const appEnv = process.env.APP_ENV ?? 'stg';
dotenv.config({ path: path.resolve(__dirname, `../.env.${appEnv}`), override: true } as any);

const API_BASE = process.env.FPT_GEN_API_URL ?? 'https://mkp-api.fptcloud.com';
const API_KEY  = process.env.FPT_GEN_API_KEY ?? process.env.FPT_API_KEY!;
const API_FROM = process.env.FPT_FROM ?? '';
const PROXY    = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } });

const CODE_MODELS = ['Kimi-K2.5', 'GLM-4.7', 'Qwen2.5-Coder-32B-Instruct', 'DeepSeek-V3.2-Speciale'];

// ─── FPT API ──────────────────────────────────────────────────────────────────
async function callFPT(model: string, messages: any[], maxTokens: number): Promise<string> {
  const fromParam = API_FROM ? `?from=${API_FROM}` : '';
  const res = await fetch(`${API_BASE}/v1/chat/completions${fromParam}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.2, streaming: false }),
    dispatcher,
  } as any);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 150)}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response');
  const u = json.usage ?? {};
  console.log(`   tokens — prompt: ${u.prompt_tokens ?? '?'}, completion: ${u.completion_tokens ?? '?'}`);
  return content;
}

async function callWithFallback(
  models: string[], messages: any[], maxTokens: number,
): Promise<{ content: string; model: string }> {
  for (const model of models) {
    try {
      console.log(`\n🤖 [${model}]`);
      const content = await callFPT(model, messages, maxTokens);
      console.log(`✅ Done — ${content.length} chars`);
      return { content, model };
    } catch (err: any) {
      console.warn(`⚠️  Failed (${err.message.match(/HTTP (\d+)/)?.[1] ?? '?'}) — next...`);
    }
  }
  throw new Error('All models failed.');
}

// ─── Step 1: Playwright ariaSnapshot ─────────────────────────────────────────
async function inspectPage(url: string): Promise<string> {
  console.log(`\n🌐 [Step 1] Playwright inspect: ${url}`);
  const authFile = path.resolve(__dirname, `../playwright/.auth/${appEnv}-user.json`);

  const browser = await chromium.launch({
    headless: true,
    proxy: { server: PROXY },
  });

  const contextOptions: any = { ignoreHTTPSErrors: true };
  if (fs.existsSync(authFile)) {
    contextOptions.storageState = authFile;
    console.log(`   Auth: ${authFile}`);
  } else {
    console.log(`   Auth: none (unauthenticated)`);
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500); // chờ JS render xong

    // ariaSnapshot — Browser MCP-format accessibility tree
    const snapshot = await page.locator('body').ariaSnapshot();

    console.log(`   Snapshot: ${snapshot.length} chars`);
    await browser.close();

    // Cắt bớt nếu quá dài (max 12000 chars)
    if (snapshot.length > 12000) {
      const trimmed = snapshot.substring(0, 12000) + '\n... (truncated)';
      console.log(`   → trimmed to 12000 chars`);
      return trimmed;
    }
    return snapshot;
  } catch (err: any) {
    await browser.close();
    throw new Error(`Playwright inspect failed: ${err.message}`);
  }
}

// ─── Step 2a: Fresh generate từ snapshot ─────────────────────────────────────
async function generateFromSnapshot(
  snapshot: string,
  url: string,
): Promise<{ code: string; model: string }> {
  console.log('\n⚙️  [Step 2] GLM generate test code from DOM snapshot...');

  const prompt =
    `Generate Playwright TypeScript test cases for this page.\n\n` +
    `## Page URL: ${url}\n\n` +
    `## Accessibility Snapshot (real DOM):\n${snapshot}\n\n` +
    `## Rules:\n` +
    `1. Output ONLY valid TypeScript — no markdown fences, no explanations\n` +
    `2. Import: import { test, expect } from '@playwright/test'; import { config } from '../../utils/config';\n` +
    `3. Add: test.use({ storageState: 'playwright/.auth/stg-user.json' });\n` +
    `4. Add beforeEach: await page.goto(config.baseUrl);\n` +
    `5. Use locators DIRECTLY from the snapshot: getByRole, getByLabel, getByText, getByPlaceholder\n` +
    `6. DO NOT use getByTestId() — the app has no data-testid attributes\n` +
    `7. Test IDs: TC_UI_001, TC_UI_002...\n` +
    `8. Add comment "// VERIFIED via DOM snapshot" on each locator`;

  const { content: raw, model } = await callWithFallback(CODE_MODELS, [{
    role: 'system',
    content: 'You are an expert TypeScript/Playwright engineer. Output ONLY valid TypeScript code. No markdown fences, no explanations, no reasoning text.',
  }, { role: 'user', content: prompt }], 4000);

  const code = raw.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return { code, model };
}

// ─── Step 2b: Fix draft locators với snapshot ─────────────────────────────────
async function fixDraftWithSnapshot(
  draftCode: string,
  snapshot: string,
  url: string,
): Promise<{ code: string; model: string }> {
  console.log('\n🔧 [Step 2] GLM fix draft locators from DOM snapshot...');

  const prompt =
    `Fix all locators in this draft Playwright test code using the real DOM snapshot.\n\n` +
    `## Page URL: ${url}\n\n` +
    `## Real DOM Snapshot (from live page):\n${snapshot}\n\n` +
    `## Draft test code (locators marked TODO or may be wrong):\n${draftCode}\n\n` +
    `## Rules:\n` +
    `1. Output ONLY the corrected TypeScript code — no markdown fences, no explanations\n` +
    `2. Replace every "// TODO: verify locator" with correct locator from the snapshot\n` +
    `3. Use getByRole, getByLabel, getByText, getByPlaceholder based on what's in the snapshot\n` +
    `4. Keep test logic and assertions intact — only fix locators\n` +
    `5. Add comment "// FIXED via DOM snapshot" on corrected lines\n` +
    `6. DO NOT use getByTestId() — the app has no data-testid attributes`;

  const { content: raw, model } = await callWithFallback(CODE_MODELS, [{
    role: 'system',
    content: 'You are an expert Playwright test engineer. Fix test locators based on real DOM. Output ONLY valid TypeScript code.',
  }, { role: 'user', content: prompt }], 4000);

  const code = raw.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return { code, model };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args         = process.argv.slice(2);
  const snapshotOnly = args.includes('--snapshot-only');
  const saveFlag     = args.includes('--save');

  const urlIdx   = args.indexOf('--url');
  const draftIdx = args.indexOf('--draft');
  const url      = urlIdx !== -1 ? args[urlIdx + 1] : undefined;
  const draftFile = draftIdx !== -1 ? args[draftIdx + 1] : undefined;

  if (!url) {
    console.error('Usage: npx ts-node utils/browser-inspect-gen.ts --url <URL> [--draft <file>] [--save] [--snapshot-only]');
    process.exit(1);
  }

  if (draftFile && !fs.existsSync(draftFile)) {
    console.error(`❌ Draft file not found: ${draftFile}`); process.exit(1);
  }

  console.log('\n🌐 URL    :', url);
  if (draftFile) console.log('📄 Draft  :', draftFile);
  console.log('─'.repeat(60));

  // Step 1: Browser inspect
  const snapshot = await inspectPage(url);
  console.log('\n' + '═'.repeat(60));
  console.log('🌳 DOM SNAPSHOT:');
  console.log('═'.repeat(60));
  console.log(snapshot.substring(0, 2000) + (snapshot.length > 2000 ? '\n... (preview truncated)' : ''));

  if (snapshotOnly) return;

  // Step 2: Generate or fix
  let finalCode: string;
  let finalModel: string;

  if (draftFile) {
    const draftCode = fs.readFileSync(draftFile, 'utf-8');
    const { code, model } = await fixDraftWithSnapshot(draftCode, snapshot, url);
    finalCode  = code;
    finalModel = model;
  } else {
    const { code, model } = await generateFromSnapshot(snapshot, url);
    finalCode  = code;
    finalModel = model;
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📄 FINAL CODE (by ${finalModel}):`);
  console.log('═'.repeat(60));
  console.log(finalCode);

  if (saveFlag) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outFile   = path.resolve(__dirname, `../tests/regression/browser-generated-${timestamp}.spec.ts`);
    const mode      = draftFile ? `fix-draft: ${path.basename(draftFile)}` : 'fresh-generate';
    const header    =
      `// AUTO-GENERATED by browser-inspect-gen.ts\n` +
      `// Mode: ${mode}\n` +
      `// Model: ${finalModel}\n` +
      `// Date: ${new Date().toISOString()}\n` +
      `// URL: ${url}\n` +
      `// Locators verified from live DOM snapshot\n\n`;
    fs.writeFileSync(outFile, header + finalCode, 'utf-8');
    console.log(`\n💾 Saved: ${outFile}`);
  }
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
