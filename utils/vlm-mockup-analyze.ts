/**
 * vlm-mockup-analyze.ts
 *
 * Dùng khi CHƯA có trang web thật — chỉ có mockup/Figma/screenshot.
 *
 * Pipeline:
 *   Step 1 — Qwen2.5-VL : Phân tích ảnh → test scenarios + UI interactions
 *                          KHÔNG lấy locator hints (VLM đoán sai → gây nhiễu)
 *   Step 2 — Kimi/GLM   : Generate draft Playwright code
 *                          Locators được mark "// TODO: verify when page is live"
 *
 * Khi có trang thật → chạy tiếp: browser-inspect-gen.ts --draft <file>
 *
 * Usage:
 *   npx ts-node utils/vlm-mockup-analyze.ts <image> [feature_desc] [--save]
 *   npx ts-node utils/vlm-mockup-analyze.ts ./figma.png "trang login" --save
 *   npx ts-node utils/vlm-mockup-analyze.ts ./mockup.png --analyze-only
 *
 * API: PROD key (FPT_GEN_API_KEY / FPT_GEN_API_URL)
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const appEnv = process.env.APP_ENV ?? 'stg';
dotenv.config({ path: path.resolve(__dirname, `../.env.${appEnv}`), override: true } as any);

const API_BASE = process.env.FPT_GEN_API_URL ?? 'https://mkp-api.fptcloud.com';
const API_KEY  = process.env.FPT_GEN_API_KEY ?? process.env.FPT_API_KEY!;
const API_FROM = process.env.FPT_FROM ?? '';
const PROXY    = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } });

const VLM_MODELS  = ['Qwen2.5-VL-7B-Instruct', 'Qwen3-VL-8B-Instruct', 'gemma-3-27b-it'];
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

// ─── Step 1: VLM — chỉ lấy scenarios, KHÔNG lấy locator hints ────────────────
function buildImageContent(input: string) {
  if (input.startsWith('http')) return { type: 'image_url', image_url: { url: input } };
  const ext = path.extname(input).toLowerCase();
  const mime: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  const b64 = fs.readFileSync(input).toString('base64');
  return { type: 'image_url', image_url: { url: `data:${mime[ext] ?? 'image/png'};base64,${b64}` } };
}

async function analyzeScenarios(imageInput: string, featureDesc: string): Promise<string> {
  console.log('\n🔍 [Step 1] VLM phân tích UI → test scenarios...');

  const { content } = await callWithFallback(VLM_MODELS, [{
    role: 'system',
    content:
      'You are a senior QA engineer. Analyze the UI screenshot.\n' +
      'Output ONLY:\n' +
      '## UI Components\n- list each visible component with its display text\n\n' +
      '## User Interactions\n- list each action user can perform\n\n' +
      '## Test Scenarios\n' +
      '- TC_001: [name] — verify [what] when [action]\n' +
      '- TC_002: ...\n\n' +
      'DO NOT include locator hints, CSS selectors, or testid names — these will be determined later from the real DOM.',
  }, {
    role: 'user',
    content: [
      { type: 'text', text: `Feature: "${featureDesc || 'UI feature'}". Analyze this mockup and extract components, interactions, and test scenarios.` },
      buildImageContent(imageInput),
    ],
  }], 1200);

  return content;
}

// ─── Step 2: GLM — generate draft code với TODO locators ─────────────────────
async function generateDraftCode(
  scenarios: string,
  featureDesc: string,
): Promise<{ code: string; model: string }> {
  console.log('\n⚙️  [Step 2] GLM generate draft test code...');

  const prompt =
    `Generate Playwright TypeScript test cases from these UI scenarios.\n\n` +
    `## Scenarios:\n${scenarios}\n\n` +
    `## Feature: ${featureDesc || 'UI feature'}\n\n` +
    `## Rules:\n` +
    `1. Output ONLY valid TypeScript — no markdown fences, no explanations\n` +
    `2. Use TC_UI_001, TC_UI_002 numbering matching the scenarios\n` +
    `3. Import: import { test, expect } from '@playwright/test'; import { config } from '../../utils/config';\n` +
    `4. Add: test.use({ storageState: 'playwright/.auth/stg-user.json' });\n` +
    `5. Add beforeEach: await page.goto(config.baseUrl);\n` +
    `6. For EVERY locator you are unsure about, use getByText/getByRole based on display text from scenarios\n` +
    `7. Add comment "// TODO: verify locator when page is live" on uncertain locators\n` +
    `8. DO NOT use getByTestId() — the app has no data-testid attributes`;

  const { content: raw, model } = await callWithFallback(CODE_MODELS, [{
    role: 'system',
    content: 'You are an expert TypeScript/Playwright engineer. Output ONLY valid TypeScript code. No markdown fences, no explanations, no reasoning text.',
  }, { role: 'user', content: prompt }], 4000);

  const code = raw.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return { code, model };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args        = process.argv.slice(2);
  const analyzeOnly = args.includes('--analyze-only');
  const saveFlag    = args.includes('--save');
  const cleanArgs   = args.filter(a => !a.startsWith('--'));
  const imageInput  = cleanArgs[0];
  const featureDesc = cleanArgs.slice(1).join(' ');

  if (!imageInput) {
    console.error('Usage: npx ts-node utils/vlm-mockup-analyze.ts <image> [feature_desc] [--save] [--analyze-only]');
    process.exit(1);
  }
  if (!imageInput.startsWith('http') && !fs.existsSync(imageInput)) {
    console.error(`❌ File not found: ${imageInput}`); process.exit(1);
  }

  console.log('\n📸 Image  :', imageInput);
  console.log('📋 Feature:', featureDesc || '(not specified)');
  console.log('─'.repeat(60));

  // Step 1
  const scenarios = await analyzeScenarios(imageInput, featureDesc);
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 SCENARIOS:');
  console.log('═'.repeat(60));
  console.log(scenarios);

  if (analyzeOnly) return;

  // Step 2
  const { code, model } = await generateDraftCode(scenarios, featureDesc);
  console.log('\n' + '═'.repeat(60));
  console.log(`📄 DRAFT CODE (by ${model}) — locators marked TODO:`);
  console.log('═'.repeat(60));
  console.log(code);

  if (saveFlag) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outFile   = path.resolve(__dirname, `../tests/regression/draft-${timestamp}.spec.ts`);
    const header    =
      `// DRAFT — generated by vlm-mockup-analyze.ts\n` +
      `// VLM: ${VLM_MODELS[0]}  Code: ${model}\n` +
      `// Date: ${new Date().toISOString()}\n` +
      `// Image: ${imageInput}\n` +
      `// Feature: ${featureDesc || 'UI feature'}\n` +
      `// ⚠️  Locators marked TODO — run browser-inspect-gen.ts --draft to fix\n\n`;
    fs.writeFileSync(outFile, header + code, 'utf-8');
    console.log(`\n💾 Draft saved: ${outFile}`);
    console.log(`\n▶  Next step (when page is live):`);
    console.log(`   APP_ENV=stg npx ts-node utils/browser-inspect-gen.ts --url <URL> --draft ${outFile} --save`);
  }
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
